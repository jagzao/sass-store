-- Migration: add birthdate and gender to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS gender varchar(20);
