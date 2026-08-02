/*
# Create products table (single-tenant, no auth)

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `price` (numeric, not null) — stored as numeric to preserve decimal precision for currency
  - `description` (text, nullable)
  - `created_at` (timestamptz, defaults to now)
2. Security
- Enable RLS on `products`.
- Allow anon + authenticated full CRUD because this is a single-tenant admin dashboard with no sign-in screen; the data is intentionally shared.
3. Notes
- No user_id column or auth.users foreign key — the app has no sign-in flow.
- `price` uses numeric(10,2) to represent currency accurately.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);
