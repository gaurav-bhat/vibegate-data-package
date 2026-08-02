
CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Anyone can upload gallery images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'gallery');
