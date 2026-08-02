import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "gallery/" })

    const images = blobs
      .map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split("/").pop() || "image",
        uploadedAt: blob.uploadedAt,
        size: blob.size,
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
