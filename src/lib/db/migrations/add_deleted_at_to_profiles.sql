-- Migration: Add deleted_at column for soft delete functionality
-- This enables a trash/recycle bin feature for profiles

-- Add deleted_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of non-deleted profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Create index for trash queries (only deleted profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_trash ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
