import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// POST /api/admin/migrate-messaging - Run messaging schema migration
export async function POST() {
  try {
    // Create conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        context_type VARCHAR(50) CHECK (context_type IN ('profile_share', 'event', 'meeting', 'connection', 'direct')),
        context_id UUID,
        last_message_id UUID,
        last_message_at TIMESTAMPTZ,
        last_message_preview TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(participant_1_id, participant_2_id)
      )
    `;

    // Create indexes for conversations
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC)`;

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(30) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'contact_card', 'welcome', 'system')),
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create indexes for messages
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`;

    // Create conversation_participants table
    await sql`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ,
        last_read_message_id UUID,
        unread_count INT DEFAULT 0,
        is_muted BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
      )
    `;

    // Create indexes for conversation_participants
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id)`;

    // Create guest_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS guest_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_token VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        first_profile_viewed UUID REFERENCES profiles(id) ON DELETE SET NULL,
        first_event_attended UUID,
        device_info JSONB DEFAULT '{}',
        converted_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        converted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_active_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
      )
    `;

    // Create indexes for guest_sessions
    await sql`CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_guest_sessions_converted ON guest_sessions(converted_to_user_id)`;

    // Create profile_visitors table
    await sql`
      CREATE TABLE IF NOT EXISTS profile_visitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        visitor_guest_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
        source VARCHAR(50) CHECK (source IN ('direct', 'qr_scan', 'share_link', 'event', 'search', 'referral')),
        referrer TEXT,
        visited_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create indexes for profile_visitors
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_visitors_profile ON profile_visitors(profile_id, visited_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_visitors_user ON profile_visitors(visitor_user_id)`;

    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN (
          'new_message',
          'connection_request',
          'connection_accepted',
          'profile_view',
          'event_reminder',
          'event_invitation',
          'system'
        )),
        title VARCHAR(255) NOT NULL,
        body TEXT,
        action_url TEXT,
        action_data JSONB DEFAULT '{}',
        related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        related_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
      )
    `;

    // Create indexes for notifications
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE`;

    // Create profile_welcome_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS profile_welcome_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        attachments JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        send_delay_seconds INT DEFAULT 0,
        only_for_guests BOOLEAN DEFAULT FALSE,
        only_from_events BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(profile_id)
      )
    `;

    // Create index for profile_welcome_messages
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_welcome_messages_profile ON profile_welcome_messages(profile_id)`;

    return NextResponse.json({
      success: true,
      message: 'Messaging schema migration completed successfully',
      tables: [
        'conversations',
        'messages',
        'conversation_participants',
        'guest_sessions',
        'profile_visitors',
        'notifications',
        'profile_welcome_messages'
      ]
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
