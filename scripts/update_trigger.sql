-- Update the handle_new_user function to use correct default profile picture path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
  user_profile_picture TEXT;
BEGIN
  -- Use username from metadata or generate from email with random suffix
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
  );
  
  -- Use profile picture from metadata or default
  user_profile_picture := COALESCE(
    NEW.raw_user_meta_data->>'profilePicture',
    '/resources/images/default-profile.png'
  );
  
  -- Insert new user into public.users table
  INSERT INTO public.users (id, email, username, "profilePicture", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    generated_username,
    user_profile_picture,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "updatedAt" = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
