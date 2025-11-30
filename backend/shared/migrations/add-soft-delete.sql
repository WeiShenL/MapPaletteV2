-- Add soft delete columns to tables
-- This migration adds isDeleted and deletedAt columns for soft delete functionality

-- Add soft delete columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Add soft delete columns to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Add soft delete columns to Comment table
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "User_isDeleted_idx" ON "User"("isDeleted");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

CREATE INDEX IF NOT EXISTS "Post_isDeleted_idx" ON "Post"("isDeleted");
CREATE INDEX IF NOT EXISTS "Post_deletedAt_idx" ON "Post"("deletedAt");

CREATE INDEX IF NOT EXISTS "Comment_isDeleted_idx" ON "Comment"("isDeleted");
CREATE INDEX IF NOT EXISTS "Comment_deletedAt_idx" ON "Comment"("deletedAt");

-- Add comments for documentation
COMMENT ON COLUMN "User"."isDeleted" IS 'Soft delete flag - true if user is deleted';
COMMENT ON COLUMN "User"."deletedAt" IS 'Timestamp when user was soft deleted';

COMMENT ON COLUMN "Post"."isDeleted" IS 'Soft delete flag - true if post is deleted';
COMMENT ON COLUMN "Post"."deletedAt" IS 'Timestamp when post was soft deleted';

COMMENT ON COLUMN "Comment"."isDeleted" IS 'Soft delete flag - true if comment is deleted';
COMMENT ON COLUMN "Comment"."deletedAt" IS 'Timestamp when comment was soft deleted';
