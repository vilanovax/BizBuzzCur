// Conversation types
export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  context_type: ConversationContextType | null;
  context_id: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

export type ConversationContextType = 'profile_share' | 'event' | 'meeting' | 'connection' | 'direct' | 'job_application';

export interface ConversationWithDetails extends Conversation {
  other_participant: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  attachments: MessageAttachment[];
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'contact_card' | 'welcome' | 'system';

export interface MessageAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
  description?: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// Conversation participant
export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  last_read_message_id: string | null;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  notifications_enabled: boolean;
  joined_at: string;
}

// Guest session types
export interface GuestSession {
  id: string;
  session_token: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  first_profile_viewed: string | null;
  first_event_attended: string | null;
  device_info: DeviceInfo;
  converted_to_user_id: string | null;
  converted_at: string | null;
  created_at: string;
  last_active_at: string;
  expires_at: string;
}

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  language?: string;
}

// Profile visitor types
export interface ProfileVisitor {
  id: string;
  profile_id: string;
  visitor_user_id: string | null;
  visitor_guest_id: string | null;
  source: VisitorSource | null;
  referrer: string | null;
  visited_at: string;
}

export type VisitorSource = 'direct' | 'qr_scan' | 'share_link' | 'event' | 'search' | 'referral';

export interface ProfileVisitorWithDetails extends ProfileVisitor {
  visitor_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  visitor_guest?: {
    id: string;
    name: string | null;
  };
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  action_url: string | null;
  action_data: Record<string, unknown>;
  related_user_id: string | null;
  related_profile_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string;
}

export type NotificationType =
  | 'new_message'
  | 'connection_request'
  | 'connection_accepted'
  | 'profile_view'
  | 'event_reminder'
  | 'event_invitation'
  | 'system'
  | 'job_application'
  | 'application_status'
  | 'job_match';

export interface NotificationWithRelated extends Notification {
  related_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// Welcome message types
export interface ProfileWelcomeMessage {
  id: string;
  profile_id: string;
  message: string;
  attachments: WelcomeAttachment[];
  is_active: boolean;
  send_delay_seconds: number;
  only_for_guests: boolean;
  only_from_events: boolean;
  created_at: string;
  updated_at: string;
}

export interface WelcomeAttachment {
  type: 'file' | 'link';
  url: string;
  name: string;
  description?: string;
}

// Connection types (extending existing)
export interface ConnectionRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  message: string | null;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface ConnectionRequestWithUser extends ConnectionRequest {
  requester: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    headline?: string;
  };
}

// Visitor type for public profile page
export type VisitorType = 'guest' | 'logged_in' | 'connected';

export interface ProfileViewContext {
  visitorType: VisitorType;
  visitorUserId?: string;
  guestSessionId?: string;
  connectionStatus?: ConnectionStatus | null;
  isConnected: boolean;
}
