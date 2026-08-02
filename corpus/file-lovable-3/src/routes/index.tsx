import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shared Photo Gallery" },
      { name: "description", content: "Upload and share photos in a public gallery anyone can view." },
      { property: "og:title", content: "Shared Photo Gallery" },
      { property: "og:description", content: "Upload and share photos in a public gallery anyone can view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Photo = { name: string; url: string };

function Index() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: listError } = await supabase.storage
      .from("gallery")
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }
    const files = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    if (files.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("gallery")
      .createSignedUrls(files.map((f) => f.name), 60 * 60);
    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }
    setPhotos(
      (signed ?? [])
        .filter((s) => s.signedUrl)
        .map((s) => ({ name: s.path ?? "", url: s.signedUrl! })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("gallery")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(upErr.message);
        break;
      }
    }
    setUploading(false);
    loadPhotos();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Shared Gallery
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload photos and share the page link — anyone with it can browse the gallery.
          </p>

          <label
            className={`mt-6 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Click to upload images (or drag files onto this box)
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>

          {error && (
            <p className="mt-3 text-sm text-destructive">Error: {error}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading gallery…
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
            <ImageIcon className="mb-3 h-10 w-10" />
            <p className="text-sm">No photos yet. Upload the first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={p.url}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
