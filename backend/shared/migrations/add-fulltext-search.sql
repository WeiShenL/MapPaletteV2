-- Add full-text search support to User and Post tables
-- This migration adds tsvector columns and indexes for fast full-text search

-- Add search_vector column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add search_vector column to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update User search vector
CREATE OR REPLACE FUNCTION user_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."displayName", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update Post search vector
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update search vectors
DROP TRIGGER IF EXISTS user_search_vector_trigger ON "User";
CREATE TRIGGER user_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION user_search_vector_update();

DROP TRIGGER IF EXISTS post_search_vector_trigger ON "Post";
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Post"
  FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS user_search_vector_idx ON "User" USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS post_search_vector_idx ON "Post" USING GIN (search_vector);

-- Initialize search vectors for existing data
UPDATE "User"
SET search_vector =
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("displayName", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'C');

UPDATE "Post"
SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(tags, ' '), '')), 'C');

-- Add comments for documentation
COMMENT ON COLUMN "User".search_vector IS 'Full-text search vector for username, displayName, and bio';
COMMENT ON COLUMN "Post".search_vector IS 'Full-text search vector for name, description, and tags';
