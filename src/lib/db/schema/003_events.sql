-- Events Table - Public events (conferences, meetups, expos)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event Identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Event Type
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('conference', 'meetup', 'workshop', 'expo', 'webinar', 'seminar')),

  -- Date & Time
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'Asia/Tehran',

  -- Location
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('in_person', 'online', 'hybrid')),
  venue_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  map_url TEXT,
  online_link TEXT,

  -- Media
  banner_url TEXT,
  logo_url TEXT,
  images JSONB DEFAULT '[]',

  -- Capacity & Pricing
  max_attendees INT,
  is_free BOOLEAN DEFAULT TRUE,
  price DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'IRR',

  -- Registration Settings
  auto_approve BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  allow_waitlist BOOLEAN DEFAULT TRUE,
  registration_deadline TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled', 'archived')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  is_invite_only BOOLEAN DEFAULT FALSE,

  -- QR Code
  qr_code_url TEXT,

  -- Analytics
  view_count INT DEFAULT 0,
  registration_count INT DEFAULT 0,
  attendance_count INT DEFAULT 0,

  -- Custom Fields
  custom_fields JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_public ON events(visibility, status) WHERE visibility = 'public' AND status = 'published';

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Event Attendees Table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Guest Info (for non-registered users)
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(255),

  -- Registration Data
  registration_data JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'waitlist')),
  rsvp_status VARCHAR(20) CHECK (rsvp_status IN ('pending', 'accepted', 'maybe', 'declined')),

  -- Check-in
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id),

  -- Ticket
  ticket_code VARCHAR(50) UNIQUE,
  qr_code_url TEXT,

  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed', 'not_required')),
  payment_amount DECIMAL(10, 2),
  payment_id VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_ticket ON event_attendees(ticket_code);

-- Trigger for updated_at
CREATE TRIGGER update_event_attendees_updated_at
  BEFORE UPDATE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Event Tickets Table (for paid events)
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'IRR',
  quantity INT,
  sold_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,

  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);

-- Event Speakers Table
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  company VARCHAR(255),
  bio TEXT,
  photo_url TEXT,

  social_links JSONB DEFAULT '{}',

  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_speakers_event ON event_speakers(event_id);
