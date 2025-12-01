-- ============================================
-- Auth Sync Trigger
-- ============================================
-- Automatically syncs new users from auth.users to public.users
-- When a user signs up via Supabase Auth, they are created in auth.users
-- This trigger automatically creates a record in public.users
-- ============================================

-- Function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user record in public.users when auth user is created
  INSERT INTO public.users (
    id,
    email,
    username,
    "profilePicture",
    "birthday",
    "gender",
    "isProfilePrivate",
    "isPostPrivate",
    "numFollowers",
    "numFollowing",
    "points",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Use username from metadata or generate from email
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    -- Use profile picture from metadata or default
    COALESCE(NEW.raw_user_meta_data->>'profilePicture', '/resources/default-profile.png'),
    -- Birthday from metadata (optional)
    NEW.raw_user_meta_data->>'birthday',
    -- Gender from metadata (optional)
    NEW.raw_user_meta_data->>'gender',
    -- Default privacy settings
    false,
    false,
    -- Default counts
    0,
    0,
    0,
    -- Timestamps
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, public.users.username),
    "profilePicture" = COALESCE(EXCLUDED."profilePicture", public.users."profilePicture"),
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users table
-- Triggers when a new user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also trigger on UPDATE to sync profile changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO supabase_admin;
GRANT SELECT ON auth.users TO supabase_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_admin;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically syncs user data from auth.users to public.users when a user signs up or updates their profile';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers when a new user signs up via Supabase Auth, automatically creating a public.users record';

COMMENT ON TRIGGER on_auth_user_updated ON auth.users IS 'Triggers when user updates auth profile, syncing changes to public.users';
