"use client"

import { useState } from "react"
import { X, ImageOff } from "lucide-react"

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ImageOff className="size-6" />
        </span>
        <p className="font-medium text-foreground">No images yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Upload your first image above and it will show up here for everyone with the link.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <li key={image.pathname}>
            <button
              type="button"
              onClick={() => setActive(image)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url || "/placeholder.svg"}
                alt={image.filename}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.filename}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url || "/placeholder.svg"}
            alt={active.filename}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
