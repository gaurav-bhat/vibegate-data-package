"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import type { GalleryImage } from "@/lib/types"
import { Lightbox } from "@/components/lightbox"

interface GalleryGridProps {
  images: GalleryImage[]
  isLoading: boolean
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ImageIcon className="size-6" aria-hidden="true" />
        </div>
        <p className="text-base font-medium text-foreground">No images yet</p>
        <p className="text-sm text-muted-foreground">Upload your first image to start the gallery.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.pathname}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`View ${image.filename}`}
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

      {activeIndex !== null && (
        <Lightbox
          images={images}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  )
}
