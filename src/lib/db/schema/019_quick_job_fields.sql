-- Quick Job Fields Migration
-- Adds fields for the 2-phase job creation UX

-- Team Context (Quick Job Phase 1)
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS team_context VARCHAR(30)
  CHECK (team_context IN ('solo', 'small_team', 'cross_functional'));

-- Role Summary - short one-liner (2-3 sentences, Quick Job Phase 1)
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS role_summary VARCHAR(500);

-- Apply Method (Quick Job Phase 1)
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS apply_method VARCHAR(30) DEFAULT 'bizbuzz'
  CHECK (apply_method IN ('bizbuzz', 'external_link'));

-- External Apply Link (if apply_method = 'external_link')
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS external_apply_url TEXT;

-- Work Style Expectations (Professional Job Phase 2)
-- Stored as JSONB: { autonomy: 1-5, collaboration: 1-5, pace: 1-5, structure: 1-5 }
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS workstyle_expectations JSONB;

-- Team Snapshot (Professional Job Phase 2)
-- Stored as JSONB: { team_size: number, works_with: string[], reports_to: string }
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS team_snapshot JSONB;

-- Hiring Preferences (Internal Only, Professional Job Phase 2)
-- Stored as JSONB: { decision_speed: 'fast'|'careful', remote_openness: 1-5, target_days_to_hire: number }
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS hiring_preferences JSONB;

-- Skill Importance Levels (Professional Job Phase 2)
-- Stored as JSONB: { "skill_name": "low"|"medium"|"high", ... }
ALTER TABLE job_ads ADD COLUMN IF NOT EXISTS skill_importance JSONB DEFAULT '{}';

-- Role Category from taxonomy (Quick Job Phase 1)
-- Links to professional_domains for structured matching
-- domain_id already exists in schema, we use that

-- Comments
COMMENT ON COLUMN job_ads.team_context IS 'Team context: solo, small_team, cross_functional';
COMMENT ON COLUMN job_ads.role_summary IS 'Short role description (2-3 sentences)';
COMMENT ON COLUMN job_ads.apply_method IS 'How candidates apply: bizbuzz (conversation) or external_link';
COMMENT ON COLUMN job_ads.external_apply_url IS 'External URL for applications when apply_method = external_link';
COMMENT ON COLUMN job_ads.workstyle_expectations IS 'Work style preferences for matching (autonomy, collaboration, pace, structure)';
COMMENT ON COLUMN job_ads.team_snapshot IS 'Team info: size, works_with roles, reports_to';
COMMENT ON COLUMN job_ads.hiring_preferences IS 'Internal hiring preferences (never shown to candidates)';
COMMENT ON COLUMN job_ads.skill_importance IS 'Per-skill importance level for matching';
