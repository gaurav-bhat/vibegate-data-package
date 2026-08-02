import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "gallery/" })

    const images = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split("/").pop() ?? "image",
        uploadedAt: blob.uploadedAt,
        size: blob.size,
      }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("List error:", error)
    return NextResponse.json({ error: "Failed to load images" }, { status: 500 })
  }
}
