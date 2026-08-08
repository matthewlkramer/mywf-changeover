-- Adaptations of the ported Rails schema for Supabase.
--
-- 1. Rails' `users` table is replaced by Supabase `auth.users`; `people` links to it.
-- 2. Rails set created_at/updated_at/external_identifier in the app layer; do it in the DB.
-- 3. RLS is enabled everywhere and left without policies: all access goes through the
--    API route handlers using the service-role key, which bypasses RLS.

ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES auth.users (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "index_people_on_user_id" ON "people" ("user_id");

ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[]::text[] LOOP
    NULL;
  END LOOP;
END $$;

-- Timestamp + identifier defaults for every ported table that has the columns.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('created_at', 'updated_at', 'external_identifier')
  LOOP
    IF r.column_name = 'external_identifier' THEN
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN %I SET DEFAULT gen_random_uuid()::text',
        r.table_name, r.column_name
      );
    ELSE
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN %I SET DEFAULT now()',
        r.table_name, r.column_name
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'updated_at'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_updated_at ON %I', r.table_name);
    EXECUTE format(
      'CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',
      r.table_name
    );
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
  END LOOP;
END $$;
