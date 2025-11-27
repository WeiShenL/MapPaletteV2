-- ============================================
-- Supabase Realtime Schema Initialization
-- ============================================
-- Creates realtime schema for pub/sub functionality
-- ============================================

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS realtime;

-- Grant permissions on realtime schema
GRANT USAGE ON SCHEMA realtime TO postgres, supabase_auth_admin;

-- Create publication for realtime changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Realtime schema initialized successfully';
END
$$;
