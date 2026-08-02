"use client"

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
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
      if (imageFiles.length === 0) {
        setError("Please choose image files only.")
        return
      }

      setError(null)
      setUploading(true)
      setProgress({ done: 0, total: imageFiles.length })

      try {
        for (let i = 0; i < imageFiles.length; i++) {
          const formData = new FormData()
          formData.append("file", imageFiles[i])

          const res = await fetch("/api/upload", { method: "POST", body: formData })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || "Upload failed")
          }
          setProgress({ done: i + 1, total: imageFiles.length })
        }
        onUploaded()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setUploading(false)
        setProgress(null)
      }
    },
    [onUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles],
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragging ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent/50",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-6" aria-hidden="true" />
          )}
        </div>

        {uploading && progress ? (
          <p className="text-sm font-medium text-foreground">
            {`Uploading ${progress.done} of ${progress.total}…`}
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground text-balance">
              Drag &amp; drop images here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">PNG, JPG, GIF, WEBP, or SVG</p>
          </div>
        )}

        <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
          <ImagePlus className="size-4" aria-hidden="true" />
          Select images
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
