-- Migration: Fix Schema Mismatches
-- Created: 2024-11-29
-- Purpose: Align database schema with Prisma schema definitions

-- ============================================================================
-- FIX #1: Rename comments.text to comments.content
-- ============================================================================
-- Prisma schema defines: content String
-- But migration created: "text" TEXT NOT NULL
-- This will cause "column 'content' does not exist" errors

ALTER TABLE comments RENAME COLUMN "text" TO "content";

-- ============================================================================
-- FIX #2: Add missing updatedAt columns
-- ============================================================================
-- Prisma schema defines updatedAt for User and Post models
-- But these columns were missing from the initial migration

-- Add updatedAt to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- FIX #3: Add auto-update trigger for updatedAt
-- ============================================================================
-- Automatically update updatedAt timestamp on record updates

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;

-- Create triggers for auto-updating updatedAt
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FIX #4: Make birthday and gender nullable (align with migration)
-- ============================================================================
-- The initial migration made these fields nullable (TEXT,)
-- Prisma schema will be updated to match this
-- No SQL changes needed here - the database is already correct

-- Add comments for documentation
COMMENT ON COLUMN users.birthday IS 'User birthday - optional field, can be NULL if not provided during signup';
COMMENT ON COLUMN users.gender IS 'User gender - optional field, can be NULL if not provided during signup';
COMMENT ON COLUMN users."updatedAt" IS 'Automatically updated timestamp when user record is modified';
COMMENT ON COLUMN posts."updatedAt" IS 'Automatically updated timestamp when post record is modified';
COMMENT ON COLUMN comments.content IS 'Comment text content (renamed from text to match Prisma schema)';
