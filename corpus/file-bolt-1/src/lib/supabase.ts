import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GALLERY_BUCKET = 'gallery-images';

export type GalleryImage = {
  id: string;
  storage_path: string;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};
