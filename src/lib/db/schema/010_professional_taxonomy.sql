-- Professional Taxonomy System
-- Supports: Domains → Specializations → Skills
-- Owned by BizBuzz, consumed by external apps (Carbarg, etc.)

-- ============================================
-- LAYER 1: Professional Domains (گرایش شغلی)
-- ============================================
CREATE TABLE IF NOT EXISTS professional_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_fa TEXT,
  icon VARCHAR(50), -- Lucide icon name
  color VARCHAR(7), -- Hex color
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LAYER 2: Specializations (حوزه تخصصی)
-- ============================================
CREATE TABLE IF NOT EXISTS specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES professional_domains(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_fa TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id, slug)
);

-- ============================================
-- LAYER 3: Skills (مهارت‌ها)
-- ============================================
-- Skills are independent entities, not tied to specializations
-- They can be suggested based on specialization but stored separately
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_fa VARCHAR(150) NOT NULL,
  description_en TEXT,
  description_fa TEXT,
  -- Category for grouping (technical, soft, certification, tool, etc.)
  category VARCHAR(50) DEFAULT 'technical',
  -- Suggested domains (for autocomplete relevance)
  suggested_domain_ids UUID[] DEFAULT '{}',
  -- Popularity score for ranking in suggestions
  popularity_score INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill to Specialization suggestions (many-to-many)
-- Used for smart autocomplete, not strict hierarchy
CREATE TABLE IF NOT EXISTS skill_specialization_suggestions (
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  relevance_score INT DEFAULT 50, -- 0-100, higher = more relevant
  PRIMARY KEY (skill_id, specialization_id)
);

-- ============================================
-- USER PROFESSIONAL IDENTITY
-- ============================================

-- User's primary and secondary domains
CREATE TABLE IF NOT EXISTS user_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES professional_domains(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain_id)
);

-- User's specializations
CREATE TABLE IF NOT EXISTS user_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  years_experience INT, -- Optional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, specialization_id)
);

-- User's skills with level and verification
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level VARCHAR(20) DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience INT, -- Optional
  is_verified BOOLEAN DEFAULT false, -- For future verification system
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ============================================
-- LAYER 4: Professional Status (وضعیت شغلی)
-- ============================================
-- Context-aware, can vary per profile or event
CREATE TABLE IF NOT EXISTS professional_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_fa TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  -- Status type for categorization
  status_type VARCHAR(30) DEFAULT 'availability' CHECK (status_type IN ('availability', 'seeking', 'offering')),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's professional status (can be profile-specific or global)
CREATE TABLE IF NOT EXISTS user_professional_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES professional_statuses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = global status
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'event_only', 'private')),
  custom_message TEXT, -- Optional custom availability message
  expires_at TIMESTAMPTZ, -- For temporary statuses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Either global (profile_id NULL) or per-profile
  UNIQUE(user_id, profile_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_specializations_domain ON specializations(domain_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_popularity ON skills(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_domains_user ON user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_primary ON user_domains(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_specializations_user ON user_specializations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_professional_status_user ON user_professional_status(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables (drop first if exists to avoid errors)
DROP TRIGGER IF EXISTS trg_professional_domains_updated ON professional_domains;
CREATE TRIGGER trg_professional_domains_updated
  BEFORE UPDATE ON professional_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_specializations_updated ON specializations;
CREATE TRIGGER trg_specializations_updated
  BEFORE UPDATE ON specializations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_skills_updated ON skills;
CREATE TRIGGER trg_skills_updated
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_skills_updated ON user_skills;
CREATE TRIGGER trg_user_skills_updated
  BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_professional_status_updated ON user_professional_status;
CREATE TRIGGER trg_user_professional_status_updated
  BEFORE UPDATE ON user_professional_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE professional_domains IS 'Top-level professional categories (Finance, IT, Legal, etc.)';
COMMENT ON TABLE specializations IS 'Specializations within domains (Accounting within Finance, Backend within IT)';
COMMENT ON TABLE skills IS 'Granular skills, independent of hierarchy, used for matching';
COMMENT ON TABLE user_domains IS 'User primary and secondary professional domains';
COMMENT ON TABLE user_specializations IS 'User selected specializations';
COMMENT ON TABLE user_skills IS 'User skills with level and verification status';
COMMENT ON TABLE professional_statuses IS 'Available professional statuses (Open to work, Consulting, etc.)';
COMMENT ON TABLE user_professional_status IS 'User current professional status, can be global or per-profile';
