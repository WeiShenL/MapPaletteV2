-- ============================================
-- Supabase Auth Integration Setup
-- ============================================
-- This file contains SQL to integrate Supabase Auth with your application
-- Run this AFTER Prisma migrations complete
--
-- Usage:
--   docker compose exec supabase-db psql -U postgres -d postgres -f /path/to/this/file.sql
-- ============================================

-- 1. Create function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create user profile when auth user is created
  INSERT INTO public.users (
    id,
    email,
    username,
    "profilePicture",
    birthday,
    gender,
    "isProfilePrivate",
    "isPostPrivate",
    "numFollowers",
    "numFollowing",
    points,
    "createdAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Use username from metadata or generate from email
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    -- Use profile picture from metadata or default
    COALESCE(
      NEW.raw_user_meta_data->>'profilePicture',
      '/resources/default-profile.png'
    ),
    -- Birthday from metadata (can be null)
    (NEW.raw_user_meta_data->>'birthday'),
    -- Gender from metadata (can be null)
    (NEW.raw_user_meta_data->>'gender'),
    -- Privacy settings
    false,
    false,
    -- Counts
    0,
    0,
    0,
    -- Timestamp
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, public.users.username);

  RETURN NEW;
END;
$$;

-- 2. Create trigger on auth.users
SET ROLE supabase_auth_admin;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
RESET ROLE;

-- 3. Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cascade delete is handled by Prisma schema
  -- This is just for logging
  RAISE LOG 'User deleted: %', OLD.id;
  RETURN OLD;
END;
$$;

-- 4. Create trigger for user deletion
SET ROLE supabase_auth_admin;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();
RESET ROLE;

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticator;
GRANT SELECT ON auth.users TO postgres, authenticator;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO postgres;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 7. Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates/updates user profile in public.users when Supabase Auth user is created/updated';

COMMENT ON FUNCTION public.handle_user_delete() IS
  'Logs when a Supabase Auth user is deleted (cascade delete handled by schema)';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Syncs auth.users with public.users on insert/update';

COMMENT ON TRIGGER on_auth_user_deleted ON auth.users IS
  'Logs user deletion events';

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify setup:
--
-- Check if triggers exist:
--   SELECT * FROM pg_trigger WHERE tgname LIKE '%auth_user%';
--
-- Check if functions exist:
--   SELECT * FROM pg_proc WHERE proname LIKE 'handle_%user%';
--
-- Test trigger (create a test user via Supabase Auth, then check):
--   SELECT * FROM public.users WHERE email = 'test@example.com';
-- ============================================
