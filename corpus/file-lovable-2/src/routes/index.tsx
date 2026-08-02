import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shared Gallery — Upload & View Images" },
      { name: "description", content: "Upload images and share them with anyone via a public gallery link." },
      { property: "og:title", content: "Shared Gallery" },
      { property: "og:description", content: "Upload images and share them with anyone via a public gallery link." },
    ],
  }),
  component: Gallery,
});

type ImageItem = { id: string; storage_path: string; created_at: string; url: string };

const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

function Gallery() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("images")
      .select("id, storage_path, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load gallery");
      setLoading(false);
      return;
    }
    const paths = (data ?? []).map((r) => r.storage_path);
    const signed =
      paths.length === 0
        ? { data: [], error: null }
        : await supabase.storage.from("gallery").createSignedUrls(paths, SIGNED_URL_TTL);
    const urlMap = new Map<string, string>();
    (signed.data ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
    });
    setItems(
      (data ?? []).map((r) => ({ ...r, url: urlMap.get(r.storage_path) ?? "" })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("gallery").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (up.error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const ins = await supabase.from("images").insert({ storage_path: path });
        if (ins.error) {
          toast.error(`Save failed: ${file.name}`);
          continue;
        }
      }
      toast.success("Uploaded");
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">Shared Gallery</h1>
          </div>
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload images</>
            )}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Anyone with this link can view and add to the gallery.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-20 text-center">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No images yet. Upload the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it) => (
              <a
                key={it.id}
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="group aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={it.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
