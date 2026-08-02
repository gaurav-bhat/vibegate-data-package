import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const GALLERY_BUCKET = 'gallery';

export type ImageRow = {
  id: string;
  storage_path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

export function publicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${GALLERY_BUCKET}/${storagePath}`;
}
