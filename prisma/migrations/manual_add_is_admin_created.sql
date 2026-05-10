-- Migration: add is_admin_created to users and mark original admin
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Step 1: Add the column (skip if already exists)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Mark the original admin account as admin-created
-- so they can log in and use forgot-password.
UPDATE users
  SET is_admin_created = TRUE
  WHERE email = 'clancymendonca@gmail.com';
