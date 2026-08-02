"use client"

import { useEffect, useState } from "react"
import { ImageIcon, X } from "lucide-react"

export interface GalleryImage {
  url: string
  pathname: string
  filename: string
  uploadedAt: string
  size: number
}

interface GalleryGridProps {
  images: GalleryImage[]
  isLoading: boolean
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [active, setActive] = useState<GalleryImage | null>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ImageIcon className="size-6" />
        </div>
        <p className="text-sm font-medium text-foreground">No images yet</p>
        <p className="text-sm text-muted-foreground">Upload some images to start your gallery.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <button
            key={image.pathname}
            type="button"
            onClick={() => setActive(image)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.filename}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.filename}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url || "/placeholder.svg"}
            alt={active.filename}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  )
}
