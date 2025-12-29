-- Conversations Table - Chat threads between users
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants (for 1:1 chat, we store both user IDs)
  participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Context (where the conversation started)
  context_type VARCHAR(50) CHECK (context_type IN ('profile_share', 'event', 'meeting', 'connection', 'direct')),
  context_id UUID, -- Reference to profile_id, event_id, etc.

  -- Last message info (for list display)
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique conversation between two users
  UNIQUE(participant_1_id, participant_2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages Table - Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR(30) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'contact_card', 'welcome', 'system')),

  -- Attachments (for files, images, etc.)
  attachments JSONB DEFAULT '[]',
  -- Format: [{ "type": "image|file", "url": "...", "name": "...", "size": 1234 }]

  -- Metadata
  metadata JSONB DEFAULT '{}',
  -- For contact_card: { "profile_id": "...", "name": "...", "photo": "..." }
  -- For welcome: { "auto_sent": true, "profile_id": "..." }

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Soft delete (for sender)
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Conversation Participants Table - For tracking read status and settings per user
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Read tracking
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  unread_count INT DEFAULT 0,

  -- User settings for this conversation
  is_muted BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Notifications
  notifications_enabled BOOLEAN DEFAULT TRUE,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- Guest Sessions Table - For tracking guest visitors
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session identifier (stored in localStorage on client)
  session_token VARCHAR(100) UNIQUE NOT NULL,

  -- Guest info (optional, collected during interaction)
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Context
  first_profile_viewed UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_event_attended UUID,

  -- Tracking
  device_info JSONB DEFAULT '{}',
  -- Format: { "userAgent": "...", "platform": "...", "language": "..." }

  -- Conversion
  converted_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_converted ON guest_sessions(converted_to_user_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires ON guest_sessions(expires_at);

-- Profile Visitors Table - Track who viewed which profile
CREATE TABLE IF NOT EXISTS profile_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Visitor (either user or guest)
  visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_guest_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,

  -- Context
  source VARCHAR(50) CHECK (source IN ('direct', 'qr_scan', 'share_link', 'event', 'search', 'referral')),
  referrer TEXT,

  -- Timestamps
  visited_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate visits in short time
  CONSTRAINT visitor_check CHECK (visitor_user_id IS NOT NULL OR visitor_guest_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_profile_visitors_profile ON profile_visitors(profile_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_user ON profile_visitors(visitor_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_visitors_guest ON profile_visitors(visitor_guest_id);

-- Notifications Table - User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification type
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_message',
    'connection_request',
    'connection_accepted',
    'profile_view',
    'event_reminder',
    'event_invitation',
    'system'
  )),

  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT,

  -- Action
  action_url TEXT,
  action_data JSONB DEFAULT '{}',
  -- Format: { "conversation_id": "...", "request_id": "...", etc. }

  -- Related entities
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Auto-delete old notifications
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);

-- Welcome Messages Table - Auto-welcome messages for profiles
CREATE TABLE IF NOT EXISTS profile_welcome_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Message content
  message TEXT NOT NULL,

  -- Attachments
  attachments JSONB DEFAULT '[]',
  -- Format: [{ "type": "file|link", "url": "...", "name": "...", "description": "..." }]

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  send_delay_seconds INT DEFAULT 0, -- Delay before sending (0 = immediate)

  -- Conditions
  only_for_guests BOOLEAN DEFAULT FALSE,
  only_from_events BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_welcome_messages_profile ON profile_welcome_messages(profile_id);

-- Trigger for updated_at on conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_welcome_messages_updated_at
  BEFORE UPDATE ON profile_welcome_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
