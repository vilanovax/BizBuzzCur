-- Personal Events Table - Meetings, private gatherings
CREATE TABLE IF NOT EXISTS personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event Identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Event Type
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('meeting', 'hangout', 'webinar', 'workshop', 'interview', 'consultation')),

  -- Date & Time
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'Asia/Tehran',

  -- Location
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('physical', 'online', 'hybrid')),
  venue_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  online_link TEXT,

  -- Settings
  max_attendees INT,
  is_private BOOLEAN DEFAULT TRUE,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),

  -- QR Code
  qr_code_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personal_events_creator ON personal_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_personal_events_slug ON personal_events(slug);
CREATE INDEX IF NOT EXISTS idx_personal_events_start_date ON personal_events(start_date);

-- Trigger for updated_at
CREATE TRIGGER update_personal_events_updated_at
  BEFORE UPDATE ON personal_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Personal Event Attendees Table
CREATE TABLE IF NOT EXISTS personal_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES personal_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Guest Info (for non-registered or external users)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Status
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'maybe', 'declined')),

  -- Check-in
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,

  -- Role in meeting
  role VARCHAR(50) DEFAULT 'attendee' CHECK (role IN ('organizer', 'presenter', 'attendee', 'observer')),

  -- Notes
  notes TEXT,

  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(event_id, user_id),
  UNIQUE(event_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personal_event_attendees_event ON personal_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_personal_event_attendees_user ON personal_event_attendees(user_id);

-- Personal Event Documents Table (agenda, minutes, attachments)
CREATE TABLE IF NOT EXISTS personal_event_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES personal_events(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),

  -- Document Info
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  category VARCHAR(50) CHECK (category IN ('agenda', 'minutes', 'presentation', 'document', 'other')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_event_docs_event ON personal_event_documents(event_id);

-- Personal Event Discussions Table (comments/notes for meeting)
CREATE TABLE IF NOT EXISTS personal_event_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES personal_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES personal_event_discussions(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Status
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_event_discussions_event ON personal_event_discussions(event_id);
CREATE INDEX IF NOT EXISTS idx_personal_event_discussions_parent ON personal_event_discussions(parent_id);
