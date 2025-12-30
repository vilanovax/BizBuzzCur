-- Job Ads Table - Job postings owned by Entities (Companies/Departments)
CREATE TABLE IF NOT EXISTS job_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity Owner (required) - Job belongs to Entity, not Profile
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,

  -- Created by (for tracking who posted)
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Display Profile (optional - which profile shows this job)
  display_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Job Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  location_type VARCHAR(50) CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
  location VARCHAR(255),

  -- Salary (optional)
  salary_range JSONB DEFAULT NULL,
  -- Format: { "min": 5000000, "max": 10000000, "currency": "IRR", "period": "monthly" }

  -- Requirements
  experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'manager')),
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',

  -- Professional Taxonomy links
  domain_id UUID REFERENCES professional_domains(id) ON DELETE SET NULL,
  specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed', 'filled')),
  is_featured BOOLEAN DEFAULT FALSE,

  -- Event Context (for event-based job boards - Phase 3)
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Timestamps
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job_ads
CREATE INDEX IF NOT EXISTS idx_job_ads_company ON job_ads(company_id);
CREATE INDEX IF NOT EXISTS idx_job_ads_department ON job_ads(department_id);
CREATE INDEX IF NOT EXISTS idx_job_ads_status ON job_ads(status);
CREATE INDEX IF NOT EXISTS idx_job_ads_published ON job_ads(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_job_ads_domain ON job_ads(domain_id);
CREATE INDEX IF NOT EXISTS idx_job_ads_specialization ON job_ads(specialization_id);
CREATE INDEX IF NOT EXISTS idx_job_ads_event ON job_ads(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_ads_skills ON job_ads USING GIN(required_skills);

-- Trigger for updated_at
CREATE TRIGGER update_job_ads_updated_at
  BEFORE UPDATE ON job_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Job Applications Table - Applications from users to job ads
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_ads(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Application Details
  cover_message TEXT,
  resume_url TEXT,

  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Just submitted
    'reviewing',    -- Being reviewed
    'shortlisted',  -- Selected for next step
    'interviewing', -- In interview process
    'offered',      -- Offer made
    'rejected',     -- Not selected
    'withdrawn',    -- Applicant withdrew
    'hired'         -- Successfully hired
  )),

  -- Conversation Link (for messaging between applicant and company)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Notes (private, only visible to company)
  internal_notes TEXT,

  -- Prevent duplicate applications
  UNIQUE(job_id, applicant_id)
);

-- Indexes for job_applications
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_conversation ON job_applications(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_applications_applied ON job_applications(applied_at DESC);


-- Add company_id to profiles table (for Entity-owned profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_entity_profile BOOLEAN DEFAULT FALSE;

-- Index for entity profiles
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id) WHERE company_id IS NOT NULL;


-- Update conversations context_type to include job_application
-- Note: This requires recreating the constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
  CHECK (context_type IN ('profile_share', 'event', 'meeting', 'connection', 'direct', 'job_application'));


-- Update notifications type to include job-related notifications
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_message',
    'connection_request',
    'connection_accepted',
    'profile_view',
    'event_reminder',
    'event_invitation',
    'system',
    'job_application',        -- New application received
    'application_status',     -- Application status changed
    'job_match'               -- New job matches your profile
  ));
