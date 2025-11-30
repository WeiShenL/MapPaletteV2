-- ============================================
-- Supabase Storage Schema Setup
-- ============================================
-- Creates storage schema and basic structure
-- The storage-api service will manage buckets
-- ============================================

-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Grant permissions
GRANT USAGE ON SCHEMA storage TO postgres, supabase_storage_admin, service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

-- Set search path for storage admin
ALTER ROLE supabase_storage_admin SET search_path TO storage, public;

-- Create buckets table (storage-api will populate)
CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE,
  avif_autodetection BOOLEAN DEFAULT FALSE,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[]
);

-- Create objects table (storage-api will populate)
CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version TEXT,
  UNIQUE(bucket_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_objects_name ON storage.objects(name);
CREATE INDEX IF NOT EXISTS idx_objects_owner ON storage.objects(owner);

-- Grant permissions on tables
GRANT ALL ON storage.buckets TO supabase_storage_admin, postgres, service_role;
GRANT ALL ON storage.objects TO supabase_storage_admin, postgres, service_role;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;

-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public buckets are viewable by everyone"
  ON storage.buckets FOR SELECT
  USING (public = true);

CREATE POLICY "Public objects are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id IN (
    SELECT id FROM storage.buckets WHERE public = true
  ));

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view their own objects"
  ON storage.objects FOR SELECT
  USING (auth.uid() = owner);

CREATE POLICY "Authenticated users can upload objects"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own objects"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own objects"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);
