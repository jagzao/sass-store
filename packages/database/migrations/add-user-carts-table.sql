-- Add user_carts table for cart persistence
CREATE TABLE IF NOT EXISTS user_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  CONSTRAINT user_carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique index for user lookup
CREATE UNIQUE INDEX IF NOT EXISTS user_carts_user_id_idx ON user_carts (user_id);
