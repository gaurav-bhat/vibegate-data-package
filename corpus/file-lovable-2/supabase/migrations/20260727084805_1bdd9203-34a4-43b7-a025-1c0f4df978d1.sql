
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.images TO anon, authenticated;
GRANT ALL ON public.images TO service_role;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view images" ON public.images FOR SELECT USING (true);
CREATE POLICY "Anyone can add images" ON public.images FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can upload to gallery" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Anyone can view gallery objects" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');
