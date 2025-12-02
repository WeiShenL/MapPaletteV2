-- ============================================
-- Initial Schema Creation
-- ============================================
-- Creates all core application tables from scratch
-- Note: auth schema and auth.users are created by Supabase init scripts
-- ============================================

-- CreateTable users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL DEFAULT '/resources/default-profile.png',
    "birthday" TEXT,
    "gender" TEXT,
    "isProfilePrivate" BOOLEAN NOT NULL DEFAULT false,
    "isPostPrivate" BOOLEAN NOT NULL DEFAULT false,
    "numFollowers" INTEGER NOT NULL DEFAULT 0,
    "numFollowing" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "searchVector" tsvector,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable posts
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "waypoints" JSONB NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF0000',
    "region" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "searchVector" tsvector,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable follows
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable likes
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable comments
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable shares
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_points_idx" ON "users"("points" DESC);

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex (Soft Delete)
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");

-- CreateIndex (Soft Delete)
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "posts_userId_createdAt_idx" ON "posts"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_region_idx" ON "posts"("region");

-- CreateIndex (Soft Delete)
CREATE INDEX "posts_isDeleted_idx" ON "posts"("isDeleted");

-- CreateIndex (Soft Delete)
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_postId_key" ON "likes"("userId", "postId");

-- CreateIndex
CREATE INDEX "likes_postId_idx" ON "likes"("postId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt" DESC);

-- CreateIndex (Soft Delete)
CREATE INDEX "comments_isDeleted_idx" ON "comments"("isDeleted");

-- CreateIndex (Soft Delete)
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE INDEX "shares_postId_idx" ON "shares"("postId");

-- CreateIndex
CREATE INDEX "shares_userId_idx" ON "shares"("userId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON "posts";
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON "posts"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON "comments";
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON "comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Full-Text Search Support
-- ============================================
-- Creates functions to update search vectors for User and Post tables
-- Uses PostgreSQL tsvector for efficient full-text search with ranking

-- Function to update User search vector
CREATE OR REPLACE FUNCTION update_user_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."profilePicture", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update Post search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update search vectors on INSERT/UPDATE
DROP TRIGGER IF EXISTS user_search_vector_trigger ON "users";
CREATE TRIGGER user_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_search_vector();

DROP TRIGGER IF EXISTS post_search_vector_trigger ON "posts";
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "posts"
  FOR EACH ROW
  EXECUTE FUNCTION update_post_search_vector();

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS user_search_vector_idx ON "users" USING GIN("searchVector");
CREATE INDEX IF NOT EXISTS post_search_vector_idx ON "posts" USING GIN("searchVector");

-- ============================================
-- Storage Note
-- ============================================
-- Storage buckets and RLS policies are managed by the Supabase storage service.
-- The storage service runs its own migrations and owns the storage.* tables.
-- To create buckets, use the storage API or the Supabase Studio dashboard.
-- Required buckets: profile-pictures, route-images, route-images-optimized
-- See: backend/db/volumes/db/init/80-storage-buckets.sql for reference SQL

-- ============================================
-- Auth User Sync Trigger
-- ============================================
-- Automatically syncs new users from auth.users to public.users
-- Triggers on INSERT to auth.users (when user signs up)

-- Function to handle new user creation in public.users
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
    '/resources/default-profile.png'
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

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Sync Existing Auth Users (One-time migration)
-- ============================================
-- Insert any existing auth.users that don't exist in public.users
INSERT INTO public.users (id, email, username, "profilePicture", "createdAt", "updatedAt")
SELECT 
  au.id::text,
  au.email,
  split_part(au.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4),
  '/resources/default-profile.png',
  COALESCE(au.created_at, CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id::text
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS Policies for Storage
-- ============================================
-- Allow authenticated uploads to route-images bucket
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated uploads to route-images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        DROP POLICY "Allow authenticated uploads to route-images" ON storage.objects;
    END IF;
END
\$\$;

CREATE POLICY "Allow authenticated uploads to route-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'route-images');

