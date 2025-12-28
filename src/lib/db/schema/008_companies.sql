-- Companies Table - Organization profiles
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,

  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#2563eb',

  -- Company Info
  industry VARCHAR(100),
  company_size VARCHAR(50) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+')),
  founded_year INT,
  company_type VARCHAR(50) CHECK (company_type IN ('startup', 'private', 'public', 'nonprofit', 'government', 'other')),

  -- Contact
  website VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),

  -- Social Links
  linkedin_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  telegram_url TEXT,

  -- Leadership
  ceo_name VARCHAR(255),
  ceo_message TEXT,
  vision TEXT,
  mission TEXT,
  core_values TEXT[],

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_hiring BOOLEAN DEFAULT FALSE,
  show_in_directory BOOLEAN DEFAULT TRUE,

  -- QR Code
  qr_code_url TEXT,

  -- Analytics
  total_views INT DEFAULT 0,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified);

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Company Team Members Table
CREATE TABLE IF NOT EXISTS company_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'member')),
  job_title VARCHAR(255),
  department_id UUID,
  bio TEXT,

  -- Display
  show_in_team_page BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,

  -- Invitation
  invitation_status VARCHAR(20) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_company ON company_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON company_team_members(user_id);

-- Company Departments Table
CREATE TABLE IF NOT EXISTS company_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,

  -- QR Code for department
  qr_code_url TEXT,

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_company ON company_departments(company_id);

-- Add foreign key for department in team members
ALTER TABLE company_team_members
  ADD CONSTRAINT fk_team_members_department
  FOREIGN KEY (department_id) REFERENCES company_departments(id) ON DELETE SET NULL;
