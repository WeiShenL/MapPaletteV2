-- Add profile customization fields to users table
-- coverPhoto: Optional cover photo URL for profile page
-- bio: Optional bio/tagline text
-- location: Optional location (e.g., "Singapore")
-- showBirthday: Whether to show birthday on public profile (default true)
-- showLocation: Whether to show location on public profile (default true)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showBirthday" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showLocation" BOOLEAN NOT NULL DEFAULT true;
