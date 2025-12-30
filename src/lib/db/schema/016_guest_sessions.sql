-- Guest Sessions for Event Participation
-- Run on: 2024-12-29

-- Create guest_sessions table for temporary guest access
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session identifier (stored in cookie)
  session_token VARCHAR(255) UNIQUE NOT NULL,

  -- Guest info
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),

  -- Associated event (guest can only access one event per session)
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Link to attendee record if they joined the event
  attendee_id UUID REFERENCES event_attendees(id) ON DELETE SET NULL,

  -- Session state
  is_active BOOLEAN DEFAULT TRUE,

  -- Expiry (sessions expire after event ends + 24h)
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_event ON guest_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_active ON guest_sessions(is_active, expires_at);

-- Add guest-specific fields to event_attendees
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'attendee';
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS networking_status VARCHAR(50);

-- Add event features configuration
ALTER TABLE events ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20) DEFAULT '#2563eb';
ALTER TABLE events ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS online_platform VARCHAR(50);

-- Cleanup function for expired guest sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM guest_sessions
  WHERE expires_at < NOW() OR is_active = FALSE;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
