import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X, UploadCloud, Images } from 'lucide-react';
import { supabase, GALLERY_BUCKET, type ImageRow } from '@/lib/supabase';

type UploadState = {
  fileName: string;
  progress: number;
  status: 'uploading' | 'error' | 'done';
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function App() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<ImageRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError('Could not load the gallery. Please try again.');
    } else {
      setImages(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setUploading(true);
    const initial: UploadState[] = fileArray.map((f) => ({
      fileName: f.name,
      progress: 0,
      status: 'uploading',
    }));
    setUploads(initial);

    await Promise.all(
      fileArray.map(async (file, idx) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { width, height } = await getImageDimensions(file);

        const { error: upErr } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (upErr) {
          setUploads((prev) =>
            prev.map((u, i) =>
              i === idx ? { ...u, status: 'error', error: upErr.message } : u,
            ),
          );
          return;
        }

        const { error: dbErr } = await supabase.from('images').insert({
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          width: width || null,
          height: height || null,
        });

        if (dbErr) {
          await supabase.storage.from(GALLERY_BUCKET).remove([path]);
          setUploads((prev) =>
            prev.map((u, i) =>
              i === idx ? { ...u, status: 'error', error: dbErr.message } : u,
            ),
          );
          return;
        }

        setUploads((prev) =>
          prev.map((u, i) => (i === idx ? { ...u, status: 'done', progress: 100 } : u)),
        );
      }),
    );

    await loadImages();
    setUploading(false);
    setTimeout(() => setUploads([]), 2500);
  }, [loadImages]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const deleteImage = useCallback(
    async (img: ImageRow) => {
      const prev = images;
      setImages((cur) => cur.filter((i) => i.id !== img.id));
      await supabase.storage.from(GALLERY_BUCKET).remove([img.storage_path]);
      await supabase.from('images').delete().eq('id', img.id);
      // best-effort; reload to reconcile
      void prev;
    },
    [images],
  );

  const publicUrl = (path: string) =>
    supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Images className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Shared Gallery</h1>
              <p className="text-xs text-neutral-500">Anyone with the link can view & add</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 active:scale-95"
          >
            <ImagePlus className="h-4 w-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragOver
              ? 'border-neutral-900 bg-neutral-100'
              : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50'
          }`}
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition group-hover:bg-neutral-200">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-neutral-800">
            Drag & drop images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-neutral-500">PNG, JPG, GIF, WebP — multiple files supported</p>
        </div>

        {/* Upload progress */}
        {uploading && uploads.length > 0 && (
          <div className="mb-8 space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
            {uploads.map((u, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate pr-3 text-neutral-700">{u.fileName}</span>
                {u.status === 'uploading' && (
                  <span className="flex items-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </span>
                )}
                {u.status === 'done' && <span className="text-green-600">Done</span>}
                {u.status === 'error' && (
                  <span className="text-red-600" title={u.error}>
                    Failed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-neutral-400">
            <Images className="mb-3 h-10 w-10" />
            <p className="text-sm">No images yet. Upload the first one!</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl bg-neutral-100 shadow-sm ring-1 ring-neutral-200"
              >
                <img
                  src={publicUrl(img.storage_path)}
                  alt={img.file_name}
                  loading="lazy"
                  className="w-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-[1.02]"
                  onClick={() => setLightbox(img)}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">{img.file_name}</p>
                  <p className="text-[11px] text-white/70">
                    {img.width && img.height ? `${img.width}×${img.height} · ` : ''}
                    {formatBytes(img.size_bytes)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(img);
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={publicUrl(lightbox.storage_path)}
            alt={lightbox.file_name}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-center text-xs text-white/90">
            {lightbox.file_name} · {formatBytes(lightbox.size_bytes)}
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        Shared Gallery · public link access
      </footer>
    </div>
  );
}
