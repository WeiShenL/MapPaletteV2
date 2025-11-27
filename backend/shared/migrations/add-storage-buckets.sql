-- Add Storage Buckets for MapPalette
-- This migration creates:
-- 1. Storage schema (if not exists)
-- 2. Buckets for profile pictures and route images
-- 3. Storage policies for public access

-- Create storage schema if not exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create buckets table if not exists
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL UNIQUE,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create objects table if not exists
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text,
  UNIQUE(bucket_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects(name);
CREATE INDEX IF NOT EXISTS objects_owner_idx ON storage.objects(owner);

-- Insert buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'profile-pictures',
    'profile-pictures',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'route-images',
    'route-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'route-images-optimized',
    'route-images-optimized',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (name) DO NOTHING;

-- Storage policies
-- Note: These policies may need to be adjusted based on your Supabase setup
-- Some Supabase setups use RLS policies, others use these simpler grants

-- Grant access to storage schema
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon, authenticated;

-- Create storage policies table if not exists
CREATE TABLE IF NOT EXISTS storage.objects_policies (
  id serial PRIMARY KEY,
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  definition text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create RLS policies if your Supabase supports it
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read policy for route images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Public route images are publicly accessible'
  ) THEN
    CREATE POLICY "Public route images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('route-images', 'route-images-optimized', 'profile-pictures'));
  END IF;
END$$;

-- Authenticated users can upload to their own folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Authenticated users can upload'
  ) THEN
    CREATE POLICY "Authenticated users can upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id IN ('route-images', 'profile-pictures')
      AND auth.role() = 'authenticated'
    );
  END IF;
END$$;

-- Users can update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Users can update own files'
  ) THEN
    CREATE POLICY "Users can update own files"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id IN ('route-images', 'profile-pictures')
      AND owner = auth.uid()
    );
  END IF;
END$$;

-- Users can delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Users can delete own files'
  ) THEN
    CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id IN ('route-images', 'profile-pictures')
      AND owner = auth.uid()
    );
  END IF;
END$$;

-- Service role can do anything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Service role can do anything'
  ) THEN
    CREATE POLICY "Service role can do anything"
    ON storage.objects FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END$$;

-- Create helper function to get public URL
CREATE OR REPLACE FUNCTION storage.get_public_url(bucket text, object_path text)
RETURNS text AS $$
BEGIN
  RETURN format('%s/storage/v1/object/public/%s/%s',
    current_setting('app.settings.storage_url', true),
    bucket,
    object_path
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to delete old images
CREATE OR REPLACE FUNCTION storage.delete_old_images(older_than interval DEFAULT '90 days')
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id IN ('route-images', 'route-images-optimized', 'profile-pictures')
    AND last_accessed_at < NOW() - older_than
    AND metadata->>'permanent' IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION storage.delete_old_images IS 'Delete images older than specified interval (default 90 days) that are not marked as permanent';
