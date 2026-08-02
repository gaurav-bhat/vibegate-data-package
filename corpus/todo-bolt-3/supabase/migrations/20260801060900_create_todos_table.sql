/*
# Create todos table (multi-user, owner-scoped)

1. New Tables
- `todos`
  - `id` (uuid, primary key)
  - `title` (text, not null) — the task text
  - `completed` (boolean, default false) — whether the task is done
  - `user_id` (uuid, not null, defaults to auth.uid()) — the owner; references auth.users with cascade delete
  - `created_at` (timestamptz, default now()) — creation timestamp
2. Security
- Enable RLS on `todos`.
- Owner-scoped CRUD: each authenticated user can only SELECT, INSERT, UPDATE, and DELETE their own rows.
- No anon access — the app requires sign-in.
3. Indexes
- Index on `user_id` for fast per-user queries.
4. Important Notes
- `user_id` defaults to `auth.uid()` so the client can insert `{ title }` without passing an owner.
- Policies use `auth.uid()` (never `current_user`).
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

DROP POLICY IF EXISTS "select_own_todos" ON todos;
CREATE POLICY "select_own_todos" ON todos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_todos" ON todos;
CREATE POLICY "insert_own_todos" ON todos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_todos" ON todos;
CREATE POLICY "update_own_todos" ON todos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_todos" ON todos;
CREATE POLICY "delete_own_todos" ON todos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
