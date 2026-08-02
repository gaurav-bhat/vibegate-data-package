/*
# Create waitlist table for FlowNote landing page

1. New Tables
- `waitlist`
  - `id` (uuid, primary key, auto-generated)
  - `email` (text, unique, not null) — the visitor's email address
  - `created_at` (timestamptz, defaults to now) — when they joined the waitlist

2. Security
- Enable RLS on `waitlist`.
- INSERT policy for `anon, authenticated`: any visitor (no sign-in) can add their own email.
  This is intentionally public write access because the landing page has no login.
- No SELECT/UPDATE/DELETE policies for anon: emails are private and can only be read
  by the project owner through the Supabase dashboard / service role. This prevents
  anyone from scraping the waitlist.

3. Helper Function
- `waitlist_count()` — SECURITY DEFINER function returning the total number of
  waitlist entries. EXECUTE granted to `anon, authenticated` so the landing page
  can display "Join N others on the waitlist" without exposing any emails.
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist;
CREATE POLICY "anon_insert_waitlist" ON waitlist FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Count function: returns only the integer count, never the emails
CREATE OR REPLACE FUNCTION waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM waitlist;
$$;

GRANT EXECUTE ON FUNCTION waitlist_count() TO anon, authenticated;
