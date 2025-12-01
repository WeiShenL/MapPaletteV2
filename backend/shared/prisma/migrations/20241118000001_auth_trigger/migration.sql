-- Add trigger to automatically create user profile when Supabase Auth creates a user
-- This ensures auth.users and public.users stay in sync

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users when a new user is created in auth.users
  INSERT INTO public.users (id, email, username, "profilePicture", birthday, gender, "numFollowers", "numFollowing", points, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Use metadata username or email prefix
    COALESCE(NEW.raw_user_meta_data->>'profilePicture', '/resources/default-profile.png'),
    NEW.raw_user_meta_data->>'birthday', -- Optional birthday from signup metadata
    NEW.raw_user_meta_data->>'gender',   -- Optional gender from signup metadata
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Don't fail if user already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Note: This requires superuser access or the trigger to be created by Supabase migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile in public.users when Supabase Auth creates a new user';
