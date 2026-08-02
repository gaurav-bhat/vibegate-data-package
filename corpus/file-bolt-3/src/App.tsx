import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  X,
  Trash2,
  ImageIcon,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { supabase, GALLERY_BUCKET, publicUrl, type ImageRow } from '@/lib/supabase';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(error.message);
    } else {
      setImages((data ?? []) as ImageRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));

    const newItems: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading',
    }));

    if (newItems.length === 0) return;
    setUploads((prev) => [...newItems, ...prev]);

    await Promise.all(
      newItems.map(async (item) => {
        if (!ACCEPTED_TYPES.includes(item.file.type)) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: 'Unsupported file type' } : u,
            ),
          );
          return;
        }
        if (item.file.size > MAX_FILE_SIZE) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: 'File too large (max 25 MB)' } : u,
            ),
          );
          return;
        }

        const ext = item.file.name.split('.').pop() || 'bin';
        const storagePath = `${item.id}.${ext}`;
        const dims = await readImageDimensions(item.file);

        const { error: upErr } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            upsert: false,
          });

        if (upErr) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: upErr.message } : u,
            ),
          );
          return;
        }

        const { error: dbErr } = await supabase.from('images').insert({
          storage_path: storagePath,
          name: item.file.name,
          mime_type: item.file.type,
          size_bytes: item.file.size,
          width: dims.width || null,
          height: dims.height || null,
        });

        if (dbErr) {
          await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: 'error', error: dbErr.message } : u,
            ),
          );
          return;
        }

        setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: 'done' } : u)));
      }),
    );

    await loadImages();
  }, [loadImages]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const dismissUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const deleteImage = useCallback(
    async (img: ImageRow) => {
      setDeletingId(img.id);
      await supabase.storage.from(GALLERY_BUCKET).remove([img.storage_path]);
      const { error } = await supabase.from('images').delete().eq('id', img.id);
      setDeletingId(null);
      if (!error) {
        setImages((prev) => prev.filter((i) => i.id !== img.id));
      }
    },
    [],
  );

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, images.length]);

  const activeUploads = uploads.filter((u) => u.status === 'uploading').length;

  return (
    <div
      className="min-h-screen bg-neutral-50 text-neutral-900"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={onDrop}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Gallery</h1>
              <p className="text-xs text-neutral-500">
                {images.length} {images.length === 1 ? 'photo' : 'photos'} · public link
              </p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            <UploadCloud className="h-4 w-4" />
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload progress / errors */}
        {uploads.length > 0 && (
          <div className="mb-6 space-y-2">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                  {u.status === 'uploading' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                  ) : u.status === 'error' ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.file.name}</p>
                  <p className="text-xs text-neutral-500">
                    {u.status === 'uploading' && `Uploading… ${formatBytes(u.file.size)}`}
                    {u.status === 'done' && 'Uploaded'}
                    {u.status === 'error' && (u.error || 'Failed')}
                  </p>
                </div>
                {u.status !== 'uploading' && (
                  <button
                    onClick={() => dismissUpload(u.id)}
                    className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
            <Loader2 className="mb-3 h-8 w-8 animate-spin" />
            <p className="text-sm">Loading gallery…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-red-700">Couldn't load the gallery</p>
            <p className="mt-1 text-xs text-red-500">{loadError}</p>
            <button
              onClick={loadImages}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !loadError && images.length === 0 && activeUploads === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-6 py-24 text-center transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <UploadCloud className="h-7 w-7 text-neutral-500" />
            </div>
            <p className="text-base font-medium text-neutral-700">Drop images here to upload</p>
            <p className="mt-1 text-sm text-neutral-500">
              PNG, JPG, WEBP, GIF, AVIF up to 25 MB — anyone with the link can view
            </p>
          </button>
        )}

        {/* Gallery grid */}
        {!loading && !loadError && images.length > 0 && (
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
            {images.map((img, idx) => (
              <figure
                key={img.id}
                className="group relative break-inside-avoid overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-neutral-200/60"
              >
                <button
                  onClick={() => setLightboxIndex(idx)}
                  className="block w-full"
                  aria-label={`View ${img.name}`}
                >
                  <img
                    src={publicUrl(img.storage_path)}
                    alt={img.name}
                    loading="lazy"
                    className="w-full transition duration-300 group-hover:scale-[1.03]"
                  />
                </button>
                {/* Overlay */}
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="min-w-0 text-white">
                    <p className="truncate text-xs font-medium">{img.name}</p>
                    <p className="text-[11px] text-white/70">
                      {img.width && img.height ? `${img.width}×${img.height} · ` : ''}
                      {formatBytes(img.size_bytes)}
                    </p>
                  </div>
                  <div className="pointer-events-auto flex shrink-0 gap-1">
                    <a
                      href={publicUrl(img.storage_path)}
                      download={img.name}
                      className="pointer-events-auto rounded-md bg-white/15 p-1.5 text-white backdrop-blur-sm transition hover:bg-white/25"
                      aria-label="Download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(img);
                      }}
                      disabled={deletingId === img.id}
                      className="pointer-events-auto rounded-md bg-white/15 p-1.5 text-white backdrop-blur-sm transition hover:bg-red-500/80 disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </figcaption>
                <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/40 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5" />
                </div>
              </figure>
            ))}
          </div>
        )}
      </main>

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-white/70 px-12 py-10 text-center text-white">
            <UploadCloud className="mx-auto mb-3 h-10 w-10" />
            <p className="text-lg font-medium">Drop images to upload</p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="max-h-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={publicUrl(images[lightboxIndex].storage_path)}
              alt={images[lightboxIndex].name}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">
              {images[lightboxIndex].name}
              {images[lightboxIndex].width && images[lightboxIndex].height
                ? ` · ${images[lightboxIndex].width}×${images[lightboxIndex].height}`
                : ''}
              {' · '}
              {formatBytes(images[lightboxIndex].size_bytes)}
            </figcaption>
          </figure>
        </div>
      )}

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        Public gallery · anyone with the link can view and upload
      </footer>
    </div>
  );
}
