/*
# Create image gallery storage and metadata table

## Overview
Sets up a public image gallery with no sign-in required. Anyone with the app
link can view uploaded images and add new ones. Images are stored in a public
Supabase Storage bucket; metadata (file name, storage path, size, dimensions)
is tracked in the `images` table.

## 1. Storage bucket
- Creates a public bucket named `gallery` so image URLs are accessible by
  anyone with the link (no signed URLs needed).

## 2. New table: `images`
- `id` (uuid, primary key)
- `storage_path` (text, not null) — path of the object inside the `gallery` bucket
- `file_name` (text, not null) — original file name as uploaded
- `mime_type` (text, not null) — image content type
- `size_bytes` (integer, not null) — file size in bytes
- `width` (integer, nullable) — image width in pixels if known
- `height` (integer, nullable) — image height in pixels if known
- `created_at` (timestamptz, default now())

## 3. Security
- RLS enabled on `images`.
- SELECT/INSERT/DELETE open to `anon, authenticated` because this is an
  intentionally public, shared gallery (no sign-in screen).
- Storage object policies on `storage.objects` allow anon to SELECT (read)
  and INSERT (upload) objects in the `gallery` bucket. DELETE is allowed so
  images can be removed from the gallery.

## Notes
1. No `user_id` / auth ownership because the app has no sign-in screen.
2. The bucket is public, so anyone with the object URL can view the image.
3. Uploads are open to anyone with the link, consistent with the shared-gallery
   use case. Add auth later if you want to restrict uploads to an owner.
*/

-- 1. Create the public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the images metadata table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Public read for the gallery
DROP POLICY IF EXISTS "anon_select_images" ON images;
CREATE POLICY "anon_select_images" ON images
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can add images
DROP POLICY IF EXISTS "anon_insert_images" ON images;
CREATE POLICY "anon_insert_images" ON images
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can remove images from the gallery
DROP POLICY IF EXISTS "anon_delete_images" ON images;
CREATE POLICY "anon_delete_images" ON images
  FOR DELETE TO anon, authenticated USING (true);

-- 3. Storage object policies for the gallery bucket
DROP POLICY IF EXISTS "gallery_read_objects" ON storage.objects;
CREATE POLICY "gallery_read_objects" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_insert_objects" ON storage.objects;
CREATE POLICY "gallery_insert_objects" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_delete_objects" ON storage.objects;
CREATE POLICY "gallery_delete_objects" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gallery');

-- Index for ordering by newest
CREATE INDEX IF NOT EXISTS images_created_at_idx ON images (created_at DESC);
