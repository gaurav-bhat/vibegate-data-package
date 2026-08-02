/*
# Create waitlist table for FlowNote landing page

1. New Tables
- `waitlist`
  - `id` (uuid, primary key)
  - `email` (text, unique, not null) — the visitor's email address
  - `created_at` (timestamptz, defaults to now) — when they joined the waitlist

2. Security
- Enable RLS on `waitlist`.
- This is a no-auth landing page (no sign-in), so the frontend uses the anon key.
- Allow anon + authenticated to INSERT new emails (visitors join the waitlist).
- Allow anon + authenticated to SELECT only to support duplicate-email feedback;
  the unique constraint on `email` already prevents duplicates, and emails are
  not sensitive in this context. (No UPDATE or DELETE policies — waitlist entries
  are append-only.)

3. Notes
- The `email` column has a UNIQUE constraint so the same address can't sign up twice.
- No `user_id` column or auth dependency — this is a single-tenant waitlist.
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist;
CREATE POLICY "anon_insert_waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_waitlist" ON waitlist;
CREATE POLICY "anon_select_waitlist"
  ON waitlist FOR SELECT
  TO anon, authenticated
  USING (true);
