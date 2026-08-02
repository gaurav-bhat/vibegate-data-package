"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { ImagePlus, Loader2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onUploaded: () => void
}

export function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"))
      if (images.length === 0) {
        setError("Please choose image files only.")
        return
      }

      setError(null)
      setUploading(true)
      setProgress({ done: 0, total: images.length })

      let failed = 0
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData()
        formData.append("file", images[i])
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          if (!res.ok) failed++
        } catch {
          failed++
        }
        setProgress({ done: i + 1, total: images.length })
      }

      setUploading(false)
      setProgress(null)
      if (failed > 0) setError(`${failed} image${failed > 1 ? "s" : ""} failed to upload.`)
      onUploaded()
    },
    [onUploaded],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files)
    e.target.value = ""
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/60 hover:bg-accent/50",
          uploading && "pointer-events-none opacity-80",
        )}
        aria-label="Upload images"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : isDragging ? (
            <ImagePlus className="size-6" />
          ) : (
            <UploadCloud className="size-6" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {uploading && progress
              ? `Uploading ${progress.done} of ${progress.total}...`
              : "Drop images here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP, or SVG</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleChange}
      />

      {error && (
        <p className="mt-3 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
