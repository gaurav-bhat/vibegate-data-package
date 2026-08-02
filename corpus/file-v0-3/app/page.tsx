"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, Images, Link2 } from "lucide-react"
import type { GalleryImage } from "@/lib/types"
import { ImageUploader } from "@/components/image-uploader"
import { GalleryGrid } from "@/components/gallery-grid"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function GalleryPage() {
  const { data, isLoading, mutate } = useSWR<{ images: GalleryImage[] }>("/api/list", fetcher)
  const [copied, setCopied] = useState(false)

  const images = data?.images ?? []

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Images className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Shared Gallery</h1>
            <p className="text-sm text-muted-foreground">
              {`${images.length} ${images.length === 1 ? "image" : "images"} · anyone with the link can view`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Link copied
            </>
          ) : (
            <>
              <Link2 className="size-4" aria-hidden="true" />
              Copy share link
            </>
          )}
        </button>
      </header>

      <section className="mt-8" aria-label="Upload images">
        <ImageUploader onUploaded={() => mutate()} />
      </section>

      <section className="mt-10" aria-label="Image gallery">
        <GalleryGrid images={images} isLoading={isLoading} />
      </section>
    </main>
  )
}
