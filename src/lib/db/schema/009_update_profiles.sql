-- Update profiles table for new features

-- Add 'company' to profile_type enum
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_profile_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_profile_type_check
  CHECK (profile_type IN ('business_card', 'resume', 'event', 'company'));

-- Add new fields for enhanced profile features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS template_id VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
  CHECK (visibility IN ('public', 'connections', 'private', 'event_only'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_visibility VARCHAR(20) DEFAULT 'full'
  CHECK (phone_visibility IN ('full', 'masked', 'after_connect', 'hidden'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_visibility VARCHAR(20) DEFAULT 'full'
  CHECK (email_visibility IN ('full', 'masked', 'after_connect', 'hidden'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_type VARCHAR(30) DEFAULT 'connect'
  CHECK (cta_type IN ('connect', 'message', 'book_meeting', 'download_cv', 'visit_website', 'none'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cta_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_url TEXT;

-- Theme colors palette (store selected color)
-- theme_color already exists as VARCHAR(7)

-- Add index for template
CREATE INDEX IF NOT EXISTS idx_profiles_template ON profiles(template_id);

-- Add index for visibility
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(visibility);
