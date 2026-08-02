"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, Loader2, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onUploaded: () => void
}

export function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
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

      for (const file of images) {
        try {
          const formData = new FormData()
          formData.append("file", file)
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || "Upload failed")
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed")
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }

      setUploading(false)
      onUploaded()
    },
    [onUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files?.length) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles],
  )

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors",
          "hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging && "border-primary bg-accent",
          uploading && "cursor-not-allowed opacity-70",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : dragging ? (
            <ImagePlus className="size-6" />
          ) : (
            <Upload className="size-6" />
          )}
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-medium text-foreground">
            {uploading
              ? `Uploading ${progress.done} of ${progress.total}...`
              : "Drop images here or click to upload"}
          </span>
          <span className="text-sm text-muted-foreground">PNG, JPG, GIF, WebP up to 10MB</span>
        </span>
      </button>

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

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
