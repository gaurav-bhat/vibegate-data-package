"use client"

import useSWR from "swr"
import { useState } from "react"
import { Images, Link2, Check } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import { GalleryGrid, type GalleryImage } from "@/components/gallery-grid"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Page() {
  const { data, isLoading, mutate } = useSWR<{ images: GalleryImage[] }>("/api/images", fetcher)
  const [copied, setCopied] = useState(false)

  const images = data?.images ?? []

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Images className="size-6" />
          </span>
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">Shared Gallery</h1>
            <p className="text-sm text-muted-foreground">
              {images.length} {images.length === 1 ? "image" : "images"} &middot; anyone with the link can view
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? "Link copied" : "Copy share link"}
        </button>
      </header>

      <section className="mb-10" aria-label="Upload images">
        <ImageUploader onUploaded={() => mutate()} />
      </section>

      <section aria-label="Gallery">
        <GalleryGrid images={images} isLoading={isLoading} />
      </section>
    </main>
  )
}
