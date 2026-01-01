-- Profile Versions Table
-- One Profile → Many Versions (different views of the same identity)
-- Version defines: what to show, what to emphasize, what to hide
-- Data is NEVER duplicated - versions are references, not copies

-- Version Types
-- SYSTEM: Auto-generated based on context
-- USER: Manually created by user

-- Context Types
-- public: General sharing
-- network: For networking/connections
-- team: For team/colleague introduction
-- investor: For investor/pitch context
-- job: For job applications
-- custom: User-defined context

CREATE TABLE IF NOT EXISTS profile_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Version Identity
  name VARCHAR(100) NOT NULL, -- User-friendly name: "نسخه شبکه‌سازی"
  type VARCHAR(20) NOT NULL CHECK (type IN ('system', 'user')),
  context VARCHAR(30) NOT NULL CHECK (context IN ('public', 'network', 'team', 'investor', 'job', 'custom')),

  -- Visibility Rules (which blocks to show/hide)
  -- JSONB array of: { block: string, mode: 'show' | 'hide' | 'limited' }
  visibility_rules JSONB DEFAULT '[]',
  -- Example: [{"block": "education", "mode": "hide"}, {"block": "projects", "mode": "show"}]

  -- Emphasis Rules (which items to highlight)
  -- JSONB array of: { targetId: UUID, targetType: string, weight: number }
  emphasis_rules JSONB DEFAULT '[]',
  -- Example: [{"targetId": "skill-uuid", "targetType": "skill", "weight": 5}]

  -- Ordering Rules (custom order of blocks)
  -- JSONB array of: { block: string, order: number }
  ordering_rules JSONB DEFAULT '[]',
  -- Example: [{"block": "experience", "order": 1}, {"block": "skills", "order": 2}]

  -- Sharing
  slug VARCHAR(50), -- Short slug for share link: bizbuzz.me/user/team
  is_default BOOLEAN DEFAULT FALSE, -- Is this the default version?
  expires_at TIMESTAMPTZ, -- Optional expiry (Premium feature)

  -- Explainability (AI-generated reasons)
  auto_generated BOOLEAN DEFAULT FALSE,
  reasons JSONB DEFAULT '[]',
  -- Example: [{"type": "context_fit", "message": "مهارت‌های مشارکتی پررنگ شده‌اند"}]

  -- Analytics
  view_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one slug per profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_versions_slug ON profile_versions(profile_id, slug) WHERE slug IS NOT NULL;

-- Only one default version per profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_versions_default ON profile_versions(profile_id) WHERE is_default = TRUE;

-- Fast lookup by profile
CREATE INDEX IF NOT EXISTS idx_profile_versions_profile ON profile_versions(profile_id);

-- Lookup by context
CREATE INDEX IF NOT EXISTS idx_profile_versions_context ON profile_versions(context);

-- Trigger for updated_at
CREATE TRIGGER update_profile_versions_updated_at
  BEFORE UPDATE ON profile_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BLOCK DEFINITIONS (Reference for visibility/ordering rules)
-- =============================================================================
-- Available blocks that can be controlled:
-- - basics: name, headline, bio
-- - photo: profile photo
-- - contact: email, phone, website
-- - social: social links
-- - experience: work experience
-- - education: education history
-- - skills: skills list
-- - projects: projects (future)
-- - signals: personality signals (future)
-- - custom: custom fields

-- =============================================================================
-- DEFAULT VERSIONS (System-generated)
-- =============================================================================
-- These are created automatically when a profile is created
-- User can customize or create new versions

-- Function to create default version when profile is created
CREATE OR REPLACE FUNCTION create_default_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profile_versions (
    profile_id,
    name,
    type,
    context,
    is_default,
    visibility_rules,
    ordering_rules
  ) VALUES (
    NEW.id,
    'نسخه اصلی',
    'system',
    'public',
    TRUE,
    '[]'::jsonb,
    '[{"block": "basics", "order": 1}, {"block": "experience", "order": 2}, {"block": "education", "order": 3}, {"block": "skills", "order": 4}]'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create default version
CREATE TRIGGER create_profile_default_version
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_profile_version();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE profile_versions IS 'Different views/versions of the same profile for different contexts';
COMMENT ON COLUMN profile_versions.visibility_rules IS 'Which profile blocks to show/hide in this version';
COMMENT ON COLUMN profile_versions.emphasis_rules IS 'Which items (skills, experiences) to highlight';
COMMENT ON COLUMN profile_versions.ordering_rules IS 'Custom ordering of profile blocks';
COMMENT ON COLUMN profile_versions.reasons IS 'AI-generated explanations for why this version is configured this way';
