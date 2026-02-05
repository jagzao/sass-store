-- Add metadata column to social_posts to match schema
ALTER TABLE "social_posts"
  ADD COLUMN IF NOT EXISTS "metadata" jsonb;
