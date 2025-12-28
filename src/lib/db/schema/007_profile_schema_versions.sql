-- Profile Schema Versions Table - For API versioning
CREATE TABLE IF NOT EXISTS profile_schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version Info
  version VARCHAR(20) NOT NULL, -- e.g., "1.0.0", "1.1.0", "2.0.0"
  profile_type VARCHAR(50) NOT NULL CHECK (profile_type IN ('business_card', 'resume', 'event')),

  -- Schema Definition (JSON Schema format)
  json_schema JSONB NOT NULL,

  -- Metadata
  description TEXT,
  changelog TEXT,
  breaking_changes BOOLEAN DEFAULT FALSE,

  -- Deprecation
  deprecated_at TIMESTAMPTZ,
  sunset_at TIMESTAMPTZ, -- When this version will stop working
  migration_to_version VARCHAR(20), -- Which version to migrate to

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_latest BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_schema_version UNIQUE(profile_type, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schema_versions_type ON profile_schema_versions(profile_type);
CREATE INDEX IF NOT EXISTS idx_schema_versions_active ON profile_schema_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_schema_versions_latest ON profile_schema_versions(is_latest) WHERE is_latest = TRUE;

-- Insert initial schema versions
INSERT INTO profile_schema_versions (version, profile_type, json_schema, description, is_active, is_latest) VALUES
('1.0.0', 'business_card', '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "full_name": {"type": "string", "maxLength": 255},
    "headline": {"type": "string", "maxLength": 500},
    "email": {"type": "string", "format": "email"},
    "phone": {"type": "string"},
    "company": {"type": "string"},
    "job_title": {"type": "string"},
    "website": {"type": "string", "format": "uri"},
    "social_links": {
      "type": "object",
      "properties": {
        "linkedin": {"type": "string", "format": "uri"},
        "twitter": {"type": "string", "format": "uri"},
        "instagram": {"type": "string"},
        "telegram": {"type": "string"}
      }
    }
  },
  "required": ["full_name"]
}'::jsonb, 'Initial business card schema', TRUE, TRUE),

('1.0.0', 'resume', '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "full_name": {"type": "string", "maxLength": 255},
    "headline": {"type": "string", "maxLength": 500},
    "bio": {"type": "string"},
    "email": {"type": "string", "format": "email"},
    "phone": {"type": "string"},
    "location": {"type": "string"},
    "experience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "company": {"type": "string"},
          "title": {"type": "string"},
          "start_date": {"type": "string", "format": "date"},
          "end_date": {"type": "string", "format": "date"},
          "is_current": {"type": "boolean"},
          "description": {"type": "string"}
        }
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "institution": {"type": "string"},
          "degree": {"type": "string"},
          "field": {"type": "string"},
          "graduation_year": {"type": "integer"}
        }
      }
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "level": {"type": "string", "enum": ["beginner", "intermediate", "advanced", "expert"]}
        }
      }
    },
    "social_links": {"type": "object"}
  },
  "required": ["full_name"]
}'::jsonb, 'Initial resume schema', TRUE, TRUE),

('1.0.0', 'event', '{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "full_name": {"type": "string", "maxLength": 255},
    "headline": {"type": "string", "maxLength": 500},
    "company": {"type": "string"},
    "job_title": {"type": "string"},
    "bio": {"type": "string"},
    "looking_for": {
      "type": "array",
      "items": {"type": "string"}
    },
    "social_links": {"type": "object"}
  },
  "required": ["full_name"]
}'::jsonb, 'Initial event networking profile schema', TRUE, TRUE)
ON CONFLICT (profile_type, version) DO NOTHING;
