/*
# Create waitlist table for FlowNote landing page

## Purpose
Stores email addresses submitted by visitors who want to join the FlowNote
waitlist. This is a single-tenant, no-auth landing page: visitors are not
logged in, so the frontend talks to Supabase with the anon key.

## New Tables
- `waitlist`
  - `id` (uuid, primary key, auto-generated)
  - `email` (text, unique, not null) — the visitor's email address
  - `created_at` (timestamptz, defaults to now()) — when they signed up

## Security
- Row Level Security is ENABLED on `waitlist`.
- INSERT is allowed for `anon, authenticated` so any visitor can join the
  waitlist without signing in. The WITH CHECK validates that a non-empty
  email is provided (basic guard; full validation happens client-side too).
- SELECT is intentionally restricted to `authenticated` only. This prevents
  anonymous visitors from scraping the full list of submitted emails. The
  project owner can view signups through the Supabase dashboard (which uses
  a privileged role that bypasses RLS) or by signing in.
- UPDATE and DELETE are restricted to `authenticated` only for management.

## Notes
1. The `email` column has a UNIQUE constraint so the same address cannot
   sign up twice. The frontend handles the duplicate-gracefully case.
2. No `user_id` column or `auth.uid()` usage — this is a no-auth landing page.
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- INSERT: anyone (anon + authenticated) can add their email to the waitlist
DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist;
CREATE POLICY "anon_insert_waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 0);

-- SELECT: only authenticated users can read the list (prevents anonymous scraping)
DROP POLICY IF EXISTS "authenticated_select_waitlist" ON waitlist;
CREATE POLICY "authenticated_select_waitlist"
ON waitlist FOR SELECT
TO authenticated
USING (true);

-- UPDATE: only authenticated users can manage entries
DROP POLICY IF EXISTS "authenticated_update_waitlist" ON waitlist;
CREATE POLICY "authenticated_update_waitlist"
ON waitlist FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

-- DELETE: only authenticated users can remove entries
DROP POLICY IF EXISTS "authenticated_delete_waitlist" ON waitlist;
CREATE POLICY "authenticated_delete_waitlist"
ON waitlist FOR DELETE
TO authenticated
USING (true);
