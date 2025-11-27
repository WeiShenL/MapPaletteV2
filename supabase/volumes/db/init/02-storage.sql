-- ============================================
-- Supabase Storage Schema Initialization
-- ============================================
-- Creates storage schema and base tables for Storage API
-- ============================================

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Grant permissions on storage schema
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role, supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

-- Create buckets table
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create objects table
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text,
  UNIQUE(bucket_id, name)
);

-- Create migrations table for storage
CREATE TABLE IF NOT EXISTS storage.migrations (
  id integer PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  hash varchar(40) NOT NULL,
  executed_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS buckets_owner_idx ON storage.buckets(owner);
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects(name);
CREATE INDEX IF NOT EXISTS objects_owner_idx ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS objects_bucket_id_name_idx ON storage.objects(bucket_id, name);

-- Grant permissions on tables
GRANT ALL ON storage.buckets TO supabase_storage_admin, postgres;
GRANT ALL ON storage.objects TO supabase_storage_admin, postgres;
GRANT ALL ON storage.migrations TO supabase_storage_admin, postgres;

GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;

-- Enable Row Level Security
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for buckets
DO $$
BEGIN
  -- Public buckets are viewable by anyone
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'buckets'
    AND policyname = 'Public buckets are viewable by everyone'
  ) THEN
    CREATE POLICY "Public buckets are viewable by everyone"
    ON storage.buckets FOR SELECT
    TO anon, authenticated
    USING (public = true);
  END IF;

  -- Authenticated users can view all buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'buckets'
    AND policyname = 'Authenticated users can view all buckets'
  ) THEN
    CREATE POLICY "Authenticated users can view all buckets"
    ON storage.buckets FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  -- Service role can do anything with buckets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'buckets'
    AND policyname = 'Service role can do anything with buckets'
  ) THEN
    CREATE POLICY "Service role can do anything with buckets"
    ON storage.buckets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

-- Create RLS policies for objects
DO $$
BEGIN
  -- Public objects in public buckets are viewable by everyone
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public objects are viewable by everyone'
  ) THEN
    CREATE POLICY "Public objects are viewable by everyone"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (
      bucket_id IN (
        SELECT id FROM storage.buckets WHERE public = true
      )
    );
  END IF;

  -- Service role can do anything with objects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Service role can do anything with objects'
  ) THEN
    CREATE POLICY "Service role can do anything with objects"
    ON storage.objects FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;

-- Create helper functions for storage
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT string_to_array(name, '/')
$$;

CREATE OR REPLACE FUNCTION storage.filename(name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (string_to_array(name, '/'))[array_upper(string_to_array(name, '/'), 1)]
$$;

CREATE OR REPLACE FUNCTION storage.extension(name text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT reverse(split_part(reverse(name), '.', 1))
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION storage.foldername TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION storage.filename TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION storage.extension TO anon, authenticated, service_role;

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Storage schema initialized successfully';
  RAISE NOTICE 'Tables: buckets, objects, migrations';
END
$$;
