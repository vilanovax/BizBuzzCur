import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/inbox - Get unified inbox with conversations, connection status, and context
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, unread, guests, connected, events, archived

    // Build filter conditions
    let filterConditions = sql``;

    switch (filter) {
      case 'unread':
        filterConditions = sql`AND cp.unread_count > 0`;
        break;
      case 'archived':
        filterConditions = sql`AND cp.is_archived = true`;
        break;
      case 'connected':
        filterConditions = sql`AND con.status = 'accepted'`;
        break;
      case 'events':
        filterConditions = sql`AND c.context_type = 'event'`;
        break;
      case 'jobs':
        filterConditions = sql`AND c.context_type = 'job_application'`;
        break;
      default:
        filterConditions = sql`AND cp.is_archived = false`;
    }

    // Get conversations with connection status and context info
    const conversations = await sql`
      SELECT
        c.id,
        c.context_type,
        c.context_id,
        c.last_message_at,
        c.last_message_preview,
        c.created_at,
        cp.unread_count,
        cp.is_muted,
        cp.is_archived,
        cp.is_pinned,
        CASE
          WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
          ELSE c.participant_1_id
        END as other_user_id,
        u.first_name as other_first_name,
        u.last_name as other_last_name,
        u.avatar_url as other_avatar,
        -- Connection status
        con.status as connection_status,
        con.id as connection_id,
        -- Context info
        CASE
          WHEN c.context_type = 'event' THEN e.title
          WHEN c.context_type = 'profile_share' THEN COALESCE(p.full_name, p.title)
          WHEN c.context_type = 'job_application' THEN j.title
          ELSE NULL
        END as context_name,
        CASE
          WHEN c.context_type = 'event' THEN e.slug
          WHEN c.context_type = 'job_application' THEN j.id::text
          ELSE NULL
        END as context_slug,
        -- Job application info
        ja.id as application_id,
        ja.status as application_status,
        -- Contact notes and labels
        ct.notes as contact_notes,
        ct.tags as contact_tags,
        ct.is_favorite as is_favorite
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      JOIN users u ON u.id = CASE
        WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
        ELSE c.participant_1_id
      END
      LEFT JOIN connection_requests con ON (
        (con.requester_id = ${user.id} AND con.addressee_id = u.id)
        OR (con.requester_id = u.id AND con.addressee_id = ${user.id})
      ) AND con.status IN ('pending', 'accepted')
      LEFT JOIN events e ON c.context_type = 'event' AND c.context_id = e.id
      LEFT JOIN profiles p ON c.context_type = 'profile_share' AND c.context_id = p.id
      LEFT JOIN job_ads j ON c.context_type = 'job_application' AND c.context_id = j.id
      LEFT JOIN job_applications ja ON ja.conversation_id = c.id
      LEFT JOIN contacts ct ON ct.user_id = ${user.id} AND ct.contact_user_id = u.id
      WHERE (c.participant_1_id = ${user.id} OR c.participant_2_id = ${user.id})
      ${filterConditions}
      ORDER BY cp.is_pinned DESC, c.last_message_at DESC NULLS LAST
    `;

    // Get unread counts for tabs
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE cp.is_archived = false) as total,
        COUNT(*) FILTER (WHERE cp.unread_count > 0 AND cp.is_archived = false) as unread,
        COUNT(*) FILTER (WHERE cp.is_archived = true) as archived,
        COUNT(*) FILTER (WHERE con.status = 'accepted' AND cp.is_archived = false) as connected,
        COUNT(*) FILTER (WHERE c.context_type = 'event' AND cp.is_archived = false) as events,
        COUNT(*) FILTER (WHERE c.context_type = 'job_application' AND cp.is_archived = false) as jobs
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      JOIN users u ON u.id = CASE
        WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
        ELSE c.participant_1_id
      END
      LEFT JOIN connection_requests con ON (
        (con.requester_id = ${user.id} AND con.addressee_id = u.id)
        OR (con.requester_id = u.id AND con.addressee_id = ${user.id})
      ) AND con.status IN ('pending', 'accepted')
      WHERE (c.participant_1_id = ${user.id} OR c.participant_2_id = ${user.id})
    `;

    return NextResponse.json({
      success: true,
      data: conversations.map(c => ({
        id: c.id,
        context_type: c.context_type,
        context_id: c.context_id,
        context_name: c.context_name,
        context_slug: c.context_slug,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview,
        unread_count: c.unread_count,
        is_muted: c.is_muted,
        is_archived: c.is_archived,
        is_pinned: c.is_pinned,
        is_favorite: c.is_favorite,
        created_at: c.created_at,
        other_participant: {
          id: c.other_user_id,
          first_name: c.other_first_name,
          last_name: c.other_last_name,
          avatar_url: c.other_avatar,
        },
        connection: {
          status: c.connection_status || null,
          id: c.connection_id || null,
        },
        contact: {
          notes: c.contact_notes,
          tags: c.contact_tags || [],
        },
        job_application: c.application_id ? {
          id: c.application_id,
          status: c.application_status,
        } : null,
      })),
      counts: {
        total: parseInt(counts?.total || '0'),
        unread: parseInt(counts?.unread || '0'),
        archived: parseInt(counts?.archived || '0'),
        connected: parseInt(counts?.connected || '0'),
        events: parseInt(counts?.events || '0'),
        jobs: parseInt(counts?.jobs || '0'),
      }
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get inbox' },
      { status: 500 }
    );
  }
}
