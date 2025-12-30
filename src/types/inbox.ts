import type { ConversationContextType, ConnectionStatus } from './messaging';
import type { ApplicationStatus } from './job';

// Inbox item - unified view of conversation with relationship context
export interface InboxItem {
  id: string;
  context_type: ConversationContextType | null;
  context_id: string | null;
  context_name: string | null;
  context_slug: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  created_at: string;
  other_participant: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  connection: {
    status: ConnectionStatus | null;
    id: string | null;
  };
  contact: {
    notes: string | null;
    tags: string[];
  };
  job_application?: {
    id: string;
    status: ApplicationStatus;
  } | null;
}

// Inbox counts for filter badges
export interface InboxCounts {
  total: number;
  unread: number;
  archived: number;
  connected: number;
  events: number;
  jobs: number;
}

// Inbox filter options
export type InboxFilter = 'all' | 'unread' | 'connected' | 'events' | 'jobs' | 'archived';

// Inbox API response
export interface InboxResponse {
  success: boolean;
  data: InboxItem[];
  counts: InboxCounts;
}

// Contact labels/tags
export interface ContactLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

// Contact note
export interface ContactNote {
  id: string;
  user_id: string;
  contact_user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Connection relationship display
export type RelationshipStatus =
  | 'connected'      // Mutual connection
  | 'pending_sent'   // User sent request, waiting
  | 'pending_received' // User received request, waiting
  | 'guest'          // Guest conversation (no account)
  | 'none';          // No relationship yet

export function getRelationshipStatus(
  connectionStatus: ConnectionStatus | null,
  isRequester: boolean
): RelationshipStatus {
  if (!connectionStatus) return 'none';

  if (connectionStatus === 'accepted') return 'connected';

  if (connectionStatus === 'pending') {
    return isRequester ? 'pending_sent' : 'pending_received';
  }

  return 'none';
}

// Context type display info
export const CONTEXT_TYPE_INFO: Record<string, { label: string; labelEn: string; icon: string }> = {
  event: { label: 'ایونت', labelEn: 'Event', icon: 'Calendar' },
  meeting: { label: 'جلسه', labelEn: 'Meeting', icon: 'Video' },
  profile_share: { label: 'اشتراک پروفایل', labelEn: 'Profile Share', icon: 'Share2' },
  connection: { label: 'درخواست ارتباط', labelEn: 'Connection', icon: 'UserPlus' },
  direct: { label: 'مستقیم', labelEn: 'Direct', icon: 'MessageCircle' },
  job_application: { label: 'درخواست شغلی', labelEn: 'Job Application', icon: 'Briefcase' },
};

// Relationship status display info
export const RELATIONSHIP_STATUS_INFO: Record<RelationshipStatus, { label: string; labelEn: string; color: string }> = {
  connected: { label: 'متصل', labelEn: 'Connected', color: 'green' },
  pending_sent: { label: 'در انتظار', labelEn: 'Pending', color: 'yellow' },
  pending_received: { label: 'درخواست جدید', labelEn: 'New Request', color: 'blue' },
  guest: { label: 'مهمان', labelEn: 'Guest', color: 'gray' },
  none: { label: '', labelEn: '', color: 'gray' },
};
