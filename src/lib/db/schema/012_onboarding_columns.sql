-- Add onboarding tracking columns to users table

-- Add onboarding columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_skipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS entry_source VARCHAR(50);

-- Comment
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user completed the onboarding flow';
COMMENT ON COLUMN users.onboarding_completed_at IS 'When user completed onboarding';
COMMENT ON COLUMN users.onboarding_skipped_at IS 'When user skipped onboarding';
COMMENT ON COLUMN users.entry_source IS 'How user came to the platform (bizbuzz, carbarg, direct, etc.)';
