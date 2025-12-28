-- OAuth Applications Table - Third-party apps that use BizBuzz OAuth
CREATE TABLE IF NOT EXISTS oauth_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Application Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  homepage_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,

  -- OAuth Credentials
  client_id VARCHAR(64) UNIQUE NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
  client_secret_prefix VARCHAR(8) NOT NULL, -- First 8 chars for identification

  -- Configuration
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] DEFAULT ARRAY['profile:read'],
  grant_types TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token'],
  token_endpoint_auth_method VARCHAR(50) DEFAULT 'client_secret_post',

  -- Ownership
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Settings
  requires_pkce BOOLEAN DEFAULT TRUE,
  access_token_ttl INT DEFAULT 3600, -- seconds
  refresh_token_ttl INT DEFAULT 2592000, -- 30 days

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_apps_client_id ON oauth_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_apps_owner ON oauth_applications(owner_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_oauth_applications_updated_at
  BEFORE UPDATE ON oauth_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- OAuth Authorization Codes Table (short-lived, 10 minutes)
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(128) UNIQUE NOT NULL,

  -- References
  application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OAuth Parameters
  redirect_uri TEXT NOT NULL,
  scope TEXT[] NOT NULL,
  code_challenge VARCHAR(128), -- PKCE
  code_challenge_method VARCHAR(10) DEFAULT 'S256',
  state VARCHAR(255),
  nonce VARCHAR(255), -- For OIDC

  -- Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_authorization_codes(expires_at);

-- OAuth Access Tokens Table
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token (hashed for security)
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_prefix VARCHAR(8) NOT NULL, -- For identification in logs

  -- References
  application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  authorization_code_id UUID REFERENCES oauth_authorization_codes(id) ON DELETE SET NULL,

  -- Token Details
  scope TEXT[] NOT NULL,
  token_type VARCHAR(20) DEFAULT 'Bearer',

  -- Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_app ON oauth_access_tokens(application_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_access_tokens(expires_at);

-- OAuth Refresh Tokens Table
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_prefix VARCHAR(8) NOT NULL,

  -- References
  application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_id UUID REFERENCES oauth_access_tokens(id) ON DELETE SET NULL,

  -- Scope
  scope TEXT[] NOT NULL,

  -- Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Rotation tracking
  previous_token_id UUID REFERENCES oauth_refresh_tokens(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON oauth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON oauth_refresh_tokens(user_id);

-- User OAuth Consents Table (what users have approved)
CREATE TABLE IF NOT EXISTS oauth_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,

  -- Granted Permissions
  granted_scopes TEXT[] NOT NULL,

  -- Lifecycle
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  CONSTRAINT unique_user_app_consent UNIQUE(user_id, application_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consents_user ON oauth_user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_app ON oauth_user_consents(application_id);

-- API Keys Table (for server-to-server direct API access)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key Details
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(12) NOT NULL, -- e.g., "bz_live_xxxx" or "bz_test_xxxx"

  -- Environment
  environment VARCHAR(20) NOT NULL CHECK (environment IN ('live', 'test')),

  -- Permissions
  scopes TEXT[] NOT NULL,
  allowed_origins TEXT[], -- CORS origins
  allowed_ips INET[], -- IP whitelist

  -- Ownership
  application_id UUID REFERENCES oauth_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Rate Limiting
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT DEFAULT 10000,

  -- Lifecycle
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
