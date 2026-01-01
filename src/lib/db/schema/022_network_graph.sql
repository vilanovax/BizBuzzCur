-- Network Graph & Trust Signals
--
-- BizBuzz از «پروفایل هوشمند» می‌ره به «شبکه‌ی قابل اعتماد»
-- نه کانکشن عددی، نه فالو — گراف معنادار + سیگنال اعتماد
--
-- Design Principles:
-- 1. Profile-first (connections around identity, not messages)
-- 2. Explainable (every suggestion = reason)
-- 3. Non-vanity (no followers, no likes count)
-- 4. Privacy-first (no revealing sensitive details)

-- =============================================================================
-- NETWORK EDGES (Relationships)
-- =============================================================================

CREATE TABLE IF NOT EXISTS network_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Direction (from → to)
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Relationship Type
  -- DIRECT: Direct connection request
  -- INTRODUCED: Connected through mutual
  -- COLLABORATED: Worked together
  -- ENDORSED: Skill endorsement
  edge_type VARCHAR(30) NOT NULL CHECK (edge_type IN ('direct', 'introduced', 'collaborated', 'endorsed')),

  -- Relationship Context
  -- NETWORK: General networking
  -- TEAM: Team/work relationship
  -- MENTOR: Mentorship
  -- EVENT: Met at event
  context VARCHAR(30) DEFAULT 'network' CHECK (context IN ('network', 'team', 'mentor', 'event', 'project')),

  -- Strength & Trust (0.0 - 1.0)
  strength DECIMAL(3,2) DEFAULT 0.50,
  trust DECIMAL(3,2) DEFAULT 0.50,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'blocked')),

  -- Introduction metadata
  introduced_by UUID REFERENCES profiles(id),
  introduction_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ,

  -- Prevent self-connections and duplicates
  CONSTRAINT no_self_connection CHECK (from_profile_id != to_profile_id),
  CONSTRAINT unique_edge UNIQUE (from_profile_id, to_profile_id)
);

-- =============================================================================
-- TRUST SIGNALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS trust_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which edge this signal belongs to
  edge_id UUID NOT NULL REFERENCES network_edges(id) ON DELETE CASCADE,

  -- Signal Type
  -- SHARED_PROJECT: Worked on project together
  -- MUTUAL_CONNECTION: Have trusted mutual
  -- ENDORSEMENT: Skill endorsement given
  -- INTRO_HISTORY: Successful introductions
  -- REPUTATION: External reputation
  -- COLLABORATION: Active collaboration
  signal_type VARCHAR(30) NOT NULL CHECK (signal_type IN (
    'shared_project',
    'mutual_connection',
    'endorsement',
    'intro_history',
    'reputation',
    'collaboration'
  )),

  -- Signal Weight (0.0 - 1.0)
  weight DECIMAL(3,2) DEFAULT 0.50,

  -- Evidence (explainability)
  evidence TEXT,

  -- Reference to related entity
  reference_id UUID,
  reference_type VARCHAR(30), -- 'project', 'skill', 'event', 'profile'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Some signals expire
);

-- =============================================================================
-- CONNECTION REQUESTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is requesting
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Request Type
  request_type VARCHAR(30) DEFAULT 'direct' CHECK (request_type IN ('direct', 'introduction')),

  -- Message
  message TEXT,

  -- If introduction, who is introducing
  introducer_profile_id UUID REFERENCES profiles(id),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  CONSTRAINT no_self_request CHECK (from_profile_id != to_profile_id)
);

-- =============================================================================
-- INTERACTION FEEDBACK
-- =============================================================================

CREATE TABLE IF NOT EXISTS interaction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which edge
  edge_id UUID NOT NULL REFERENCES network_edges(id) ON DELETE CASCADE,

  -- Who gave feedback
  from_profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Feedback type
  interaction_type VARCHAR(30) CHECK (interaction_type IN ('connection', 'introduction', 'collaboration', 'message')),

  -- Was it useful?
  rating VARCHAR(10) CHECK (rating IN ('positive', 'negative', 'neutral')),

  -- Optional note
  note TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Fast lookup by profile
CREATE INDEX IF NOT EXISTS idx_network_edges_from ON network_edges(from_profile_id);
CREATE INDEX IF NOT EXISTS idx_network_edges_to ON network_edges(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_network_edges_status ON network_edges(status);

-- Active connections
CREATE INDEX IF NOT EXISTS idx_network_edges_active ON network_edges(from_profile_id, to_profile_id) WHERE status = 'active';

-- Trust signals by edge
CREATE INDEX IF NOT EXISTS idx_trust_signals_edge ON trust_signals(edge_id);

-- Connection requests
CREATE INDEX IF NOT EXISTS idx_connection_requests_to ON connection_requests(to_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_from ON connection_requests(from_profile_id, status);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps
CREATE TRIGGER update_network_edges_updated_at
  BEFORE UPDATE ON network_edges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to calculate mutual connections count
CREATE OR REPLACE FUNCTION get_mutual_connections(profile_a UUID, profile_b UUID)
RETURNS INTEGER AS $$
DECLARE
  mutual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mutual_count
  FROM network_edges e1
  JOIN network_edges e2 ON e1.to_profile_id = e2.to_profile_id
  WHERE e1.from_profile_id = profile_a
    AND e2.from_profile_id = profile_b
    AND e1.status = 'active'
    AND e2.status = 'active';

  RETURN mutual_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trust score between two profiles
CREATE OR REPLACE FUNCTION calculate_edge_trust(p_edge_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_trust DECIMAL;
  signal_count INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(weight), 0),
    COUNT(*)
  INTO total_trust, signal_count
  FROM trust_signals
  WHERE edge_id = p_edge_id
    AND (expires_at IS NULL OR expires_at > NOW());

  IF signal_count = 0 THEN
    RETURN 0.5; -- Default trust
  END IF;

  -- Weighted average capped at 1.0
  RETURN LEAST(1.0, total_trust / signal_count * 1.2);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE network_edges IS 'Weighted relationships between profiles with trust signals';
COMMENT ON TABLE trust_signals IS 'Evidence-based trust indicators for network edges';
COMMENT ON TABLE connection_requests IS 'Pending connection requests with optional introductions';
COMMENT ON TABLE interaction_feedback IS 'Post-interaction feedback for learning loop';
COMMENT ON COLUMN network_edges.strength IS 'Relationship strength 0-1 based on interaction frequency';
COMMENT ON COLUMN network_edges.trust IS 'Trust level 0-1 based on trust signals';
