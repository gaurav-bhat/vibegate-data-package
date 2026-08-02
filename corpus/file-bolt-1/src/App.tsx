import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react';
import { supabase, GALLERY_BUCKET, type GalleryImage } from '@/lib/supabase';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

type UploadStatus = {
  name: string;
  progress: number;
  error?: string;
  done?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024).toFixed(1))} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function App() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, err } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError('Could not load the gallery. Please try again.');
    } else {
      setImages((data as GalleryImage[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (list.length === 0) {
        setError('Please choose image files (PNG, JPEG, WebP, GIF, or AVIF).');
        return;
      }

      setError(null);
      const statuses: UploadStatus[] = list.map((f) => ({ name: f.name, progress: 0 }));
      setUploads((prev) => [...statuses, ...prev]);

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const statusIdx = i; // index into the statuses array we just pushed

        if (file.size > MAX_FILE_BYTES) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === statusIdx ? { ...u, error: 'File is larger than 10 MB' } : u,
            ),
          );
          continue;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (upErr) {
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === statusIdx ? { ...u, error: upErr.message || 'Upload failed' } : u,
            ),
          );
          continue;
        }

        const { data: pub } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath);

        const { error: dbErr } = await supabase.from('images').insert({
          storage_path: storagePath,
          url: pub.publicUrl,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });

        if (dbErr) {
          // Roll back the storage object so we don't leave orphans
          await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === statusIdx ? { ...u, error: dbErr.message || 'Could not save metadata' } : u,
            ),
          );
          continue;
        }

        setUploads((prev) =>
          prev.map((u, idx) => (idx === statusIdx ? { ...u, progress: 100, done: true } : u)),
        );
      }

      // Refresh the gallery and prune completed uploads shortly after
      await fetchImages();
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => !u.done && !u.error));
      }, 2500);
    },
    [fetchImages],
  );

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const deleteImage = useCallback(
    async (img: GalleryImage) => {
      const prev = images;
      setImages((cur) => cur.filter((i) => i.id !== img.id));
      if (lightbox?.id === img.id) setLightbox(null);

      await supabase.storage.from(GALLERY_BUCKET).remove([img.storage_path]);
      const { error: delErr } = await supabase.from('images').delete().eq('id', img.id);
      if (delErr) {
        setImages(prev); // restore on failure
        setError('Could not delete that image. Please try again.');
      }
    },
    [images, lightbox],
  );

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link to your clipboard.');
    }
  };

  const totalSize = useMemo(
    () => images.reduce((sum, i) => sum + i.size_bytes, 0),
    [images],
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs font-medium text-neutral-400 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Public gallery — anyone with the link can view
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Image Gallery
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Upload images and share the link. Photos are stored securely and visible to anyone
              who opens this page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareLink}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-800"
            >
              <Share2 className="h-4 w-4" />
              {copied ? 'Link copied' : 'Share link'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={onFilePick}
              className="hidden"
            />
          </div>
        </header>

        {/* Stats */}
        {!loading && images.length > 0 && (
          <div className="mb-6 flex items-center gap-6 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {images.length} {images.length === 1 ? 'photo' : 'photos'}
            </span>
            <span>{formatBytes(totalSize)} total</span>
          </div>
        )}

        {/* Upload dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group mb-10 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition group-hover:scale-105 group-hover:text-emerald-400">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-neutral-200">
            Drag and drop images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            PNG, JPEG, WebP, GIF, or AVIF — up to 10 MB each
          </p>
        </div>

        {/* Upload progress */}
        {uploads.length > 0 && (
          <div className="mb-8 space-y-2">
            {uploads.map((u, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-sm"
              >
                {u.error ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                ) : u.done ? (
                  <ImageIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-400" />
                )}
                <span className="truncate text-neutral-300">{u.name}</span>
                {u.error ? (
                  <span className="ml-auto text-xs text-red-400">{u.error}</span>
                ) : (
                  <span className="ml-auto text-xs text-neutral-500">
                    {u.done ? 'Uploaded' : 'Uploading…'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/70 transition hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/40 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-neutral-500">
              <ImageIcon className="h-7 w-7" />
            </div>
            <p className="text-base font-medium text-neutral-300">No photos yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Upload your first image to get the gallery started.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {images.map((img) => (
              <figure
                key={img.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
              >
                <button
                  onClick={() => setLightbox(img)}
                  className="block w-full"
                  aria-label={`View ${img.filename}`}
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    loading="lazy"
                    className="w-full transition duration-500 group-hover:scale-[1.03]"
                  />
                </button>

                {/* Overlay */}
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent p-4 pt-10 opacity-0 transition duration-300 group-hover:opacity-100">
                  <p className="truncate text-sm font-medium text-white">{img.filename}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {formatBytes(img.size_bytes)} · {formatDate(img.created_at)}
                  </p>
                </figcaption>

                {/* Delete button */}
                <button
                  onClick={() => deleteImage(img)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/70 text-neutral-300 opacity-0 backdrop-blur transition hover:bg-red-500 hover:text-white group-hover:opacity-100"
                  aria-label={`Delete ${img.filename}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <a
            href={lightbox.url}
            download={lightbox.filename}
            target="_blank"
            rel="noreferrer"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-5 w-5" />
          </a>

          <img
            src={lightbox.url}
            alt={lightbox.filename}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2 text-center text-sm text-white backdrop-blur">
            <span className="font-medium">{lightbox.filename}</span>
            <span className="mx-2 text-white/40">·</span>
            <span className="text-white/70">{formatBytes(lightbox.size_bytes)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
