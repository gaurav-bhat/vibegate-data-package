"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/image-uploader"
import { GalleryGrid, type GalleryImage } from "@/components/gallery-grid"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function GalleryApp() {
  const { data, isLoading, mutate } = useSWR<{ images: GalleryImage[] }>("/api/images", fetcher)
  const [copied, setCopied] = useState(false)

  const images = data?.images ?? []

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Shared Gallery
          </h1>
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">
            Upload images and share the link. Anyone who opens it can view every photo.
          </p>
        </div>
        <Button variant="outline" onClick={handleShare} className="shrink-0 bg-transparent">
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? "Link copied" : "Copy share link"}
        </Button>
      </header>

      <ImageUploader onUploaded={() => mutate()} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            {images.length > 0 ? `${images.length} image${images.length > 1 ? "s" : ""}` : "Gallery"}
          </h2>
        </div>
        <GalleryGrid images={images} isLoading={isLoading} />
      </section>
    </main>
  )
}
