import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 })
    }

    const blob = await put(`gallery/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
