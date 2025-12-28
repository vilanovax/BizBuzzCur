-- Profiles Table - Multi-type digital profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Profile Identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  profile_type VARCHAR(50) NOT NULL CHECK (profile_type IN ('business_card', 'resume', 'event')),

  -- Schema Version for API compatibility
  schema_version VARCHAR(20) DEFAULT '1.0.0',

  -- Basic Info
  full_name VARCHAR(255),
  headline VARCHAR(500),
  bio TEXT,
  photo_url TEXT,
  cover_url TEXT,

  -- Contact Info
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),

  -- Professional Info (for resume type)
  job_title VARCHAR(255),
  company VARCHAR(255),
  industry VARCHAR(100),

  -- Social Links (JSONB for flexibility)
  social_links JSONB DEFAULT '{}',
  -- Example: {"linkedin": "url", "twitter": "url", "instagram": "url", "telegram": "url", "github": "url"}

  -- Custom Fields (JSONB for extensibility)
  custom_fields JSONB DEFAULT '[]',
  -- Example: [{"label": "Skills", "value": "JavaScript, Python"}, ...]

  -- QR Code
  qr_code_url TEXT,

  -- Display Settings
  theme_color VARCHAR(7) DEFAULT '#2563eb',
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Analytics
  view_count INT DEFAULT 0,
  completion_score INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON profiles(is_public) WHERE is_public = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Education Table (for resume profiles)
CREATE TABLE IF NOT EXISTS profile_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_education_profile ON profile_education(profile_id);

-- Experience Table (for resume profiles)
CREATE TABLE IF NOT EXISTS profile_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_experience_profile ON profile_experience(profile_id);

-- Skills Table (for resume profiles)
CREATE TABLE IF NOT EXISTS profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON profile_skills(profile_id);
