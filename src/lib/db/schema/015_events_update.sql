-- Update events table for new event types and fields
-- Run on: 2024-12-29

-- Add welcome_attachments column for file attachments
ALTER TABLE events ADD COLUMN IF NOT EXISTS welcome_attachments JSONB DEFAULT '[]';

-- Update location_type to match new values (allow 'physical')
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_location_type_check;
ALTER TABLE events ADD CONSTRAINT events_location_type_check
  CHECK (location_type IN ('in_person', 'online', 'hybrid', 'physical'));
