-- ============================================
-- Supabase Realtime Schema Setup
-- ============================================
-- Sets up realtime replication for tables
-- ============================================

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS realtime;

-- Grant permissions
GRANT USAGE ON SCHEMA realtime TO postgres, supabase_realtime_admin;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;

-- Create publication for realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Note: You can add tables to realtime publication like this:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
-- etc.

-- For now, we'll leave it empty and add tables as needed
-- This can be done via SQL or through Supabase Studio
