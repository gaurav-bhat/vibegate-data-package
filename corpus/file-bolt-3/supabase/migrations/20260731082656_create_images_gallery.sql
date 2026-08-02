/*
# Image gallery — public upload + public viewing

This app lets anyone upload images and view them in a shared gallery.
No sign-in is required: the frontend uses the anon key for everything,
so all policies must allow the `anon` role.

## 1. New Tables
- `images`
  - `id` (uuid, primary key)
  - `storage_path` (text, not null) — the path inside the `gallery` storage bucket
  - `name` (text, not null) — original file name
  - `mime_type` (text, not null)
  - `size_bytes` (integer, not null)
  - `width` (integer, nullable) — decoded image width in pixels
  - `height` (integer, nullable) — decoded image height in pixels
  - `created_at` (timestamptz, default now())

## 2. Storage
- Create a public storage bucket named `gallery` so anyone with the link
  can view the uploaded images directly via the public URL.

## 3. Security (RLS)
- Enable RLS on `images`.
- Allow `anon, authenticated` to SELECT (gallery is intentionally public).
- Allow `anon, authenticated` to INSERT (anyone can upload).
- Allow `anon, authenticated` to DELETE (gallery is open/shared).
- Storage bucket policies: allow public read + public upload + public delete
  on the `gallery` bucket.

## 4. Notes
- The table is intentionally world-readable and world-writable because the
  app has no sign-in and the gallery is meant to be shared by link.
- No `user_id` column is used because there is no auth flow.
*/

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- Public storage bucket for the gallery
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, public upload, public delete
DROP POLICY IF EXISTS "Public read on gallery" ON storage.objects;
CREATE POLICY "Public read on gallery" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public upload on gallery" ON storage.objects;
CREATE POLICY "Public upload on gallery" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public delete on gallery" ON storage.objects;
CREATE POLICY "Public delete on gallery" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gallery');