-- Analytics Events Table
-- Structured event tracking for user behavior

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_name VARCHAR(100) NOT NULL,

  -- Core properties (denormalized for query performance)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source VARCHAR(50) NOT NULL,
  entry_app VARCHAR(50) NOT NULL DEFAULT 'bizbuzz',
  session_id VARCHAR(100),

  -- Event-specific properties (JSONB for flexibility)
  properties JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON analytics_events(source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entry_app ON analytics_events(entry_app);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON analytics_events(user_id, event_name, event_timestamp DESC);

-- JSONB index for property queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN (properties);

-- Comments
COMMENT ON TABLE analytics_events IS 'Structured event tracking for user behavior analytics';
COMMENT ON COLUMN analytics_events.event_name IS 'Event type (onboarding_started, skill_added, etc.)';
COMMENT ON COLUMN analytics_events.source IS 'Where the event originated (onboarding, profile_builder, etc.)';
COMMENT ON COLUMN analytics_events.entry_app IS 'Which app referred the user (bizbuzz, carbarg, etc.)';
COMMENT ON COLUMN analytics_events.properties IS 'Event-specific properties as JSONB';
