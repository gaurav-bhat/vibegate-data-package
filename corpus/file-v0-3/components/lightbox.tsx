"use client"

import { useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import type { GalleryImage } from "@/lib/types"

interface LightboxProps {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const image = images[index]

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + images.length) % images.length)
  }, [index, images.length, onNavigate])

  const goNext = useCallback(() => {
    onNavigate((index + 1) % images.length)
  }, [index, images.length, onNavigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, goPrev, goNext])

  if (!image) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-4 flex size-11 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url || "/placeholder.svg"}
        alt={image.filename}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
      />
    </div>
  )
}
