import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shared Photo Gallery" },
      {
        name: "description",
        content:
          "Upload photos and share them instantly — anyone with the link can view the gallery.",
      },
      { property: "og:title", content: "Shared Photo Gallery" },
      {
        property: "og:description",
        content:
          "Upload photos and share them instantly — anyone with the link can view the gallery.",
      },
    ],
  }),
  component: Gallery,
});

type ImageRow = { id: string; storage_path: string; created_at: string };
type DisplayImage = ImageRow & { url: string };

const BUCKET = "gallery";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

function Gallery() {
  const [images, setImages] = useState<DisplayImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadImages() {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from("images")
      .select("id, storage_path, created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as ImageRow[];
    if (rows.length === 0) {
      setImages([]);
      setLoading(false);
      return;
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        rows.map((r) => r.storage_path),
        SIGNED_URL_TTL,
      );

    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }

    setImages(
      rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" })),
    );
    setLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase
          .from("images")
          .insert({ storage_path: path });
        if (insErr) throw insErr;
      }
      await loadImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Shared Gallery
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload photos — anyone with this link can view them.
            </p>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {uploading ? "Uploading…" : "Upload photos"}
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading gallery…</p>
        ) : images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              No photos yet. Upload the first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="group block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img
                  src={img.url}
                  alt="Gallery photo"
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
