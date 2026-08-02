/*
# Create public image gallery storage and metadata table

1. Storage
- Create a public storage bucket `gallery-images` so anyone with the link can view uploaded images.
- Add storage policies allowing anon + authenticated to upload (INSERT) and read (SELECT) objects in the bucket.
2. New Tables
- `images`
  - `id` (uuid, primary key)
  - `storage_path` (text, the path of the object in the bucket)
  - `url` (text, the public URL of the image)
  - `filename` (text, original file name)
  - `mime_type` (text, file content type)
  - `size_bytes` (integer, file size)
  - `created_at` (timestamptz, default now())
3. Security
- Enable RLS on `images`.
- Allow anon + authenticated to read and insert (public gallery, no sign-in).
- Allow anon + authenticated to delete (so images can be removed).
- Storage bucket policies allow anon + authenticated to upload and read objects.
4. Notes
- This is a single-tenant, no-auth app: anyone with the link can upload and view.
- The storage bucket is public, so image URLs are directly accessible.
*/

-- Create the public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon + authenticated to upload and read
DROP POLICY IF EXISTS "anon_upload_gallery_images" ON storage.objects;
CREATE POLICY "anon_upload_gallery_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "anon_read_gallery_images" ON storage.objects;
CREATE POLICY "anon_read_gallery_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "anon_delete_gallery_images" ON storage.objects;
CREATE POLICY "anon_delete_gallery_images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'gallery-images');

-- Metadata table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  url text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_images" ON images;
CREATE POLICY "anon_select_images" ON images FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_images" ON images;
CREATE POLICY "anon_insert_images" ON images FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_images" ON images;
CREATE POLICY "anon_delete_images" ON images FOR DELETE
TO anon, authenticated USING (true);

-- Index for ordering by newest
CREATE INDEX IF NOT EXISTS images_created_at_idx ON images (created_at DESC);
