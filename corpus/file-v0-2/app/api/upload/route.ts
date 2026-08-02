import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Prefix with a folder and randomize the name to avoid collisions.
    const blob = await put(`gallery/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
