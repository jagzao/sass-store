-- Migration to add reset_token and reset_token_expiry columns to users table
-- This addresses the 500 error in forgot-password functionality

-- Add reset_token column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- Add reset_token_expiry column to users table  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create index for reset_token for faster lookups
CREATE INDEX IF NOT EXISTS users_reset_token_idx ON users (reset_token);

-- Create index for reset_token_expiry to help with token expiration checks
CREATE INDEX IF NOT EXISTS users_reset_token_expiry_idx ON users (reset_token_expiry);