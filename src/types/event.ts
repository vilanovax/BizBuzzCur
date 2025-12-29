// Event Types - Simplified to two main types
export type EventType = 'focused_event' | 'networking_event';

// Legacy types for migration compatibility
export type LegacyEventType = 'conference' | 'meetup' | 'workshop' | 'expo' | 'webinar' | 'seminar' | 'meeting' | 'hangout' | 'interview' | 'consultation';

export type LocationType = 'in_person' | 'online' | 'hybrid';
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled' | 'archived';
export type EventVisibility = 'public' | 'unlisted' | 'private';
export type AttendeeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlist';
export type RSVPStatus = 'pending' | 'accepted' | 'maybe' | 'declined';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed' | 'not_required';
export type AttendeeRole = 'organizer' | 'presenter' | 'attendee' | 'observer';

// Event Feature Modules - can be enabled/disabled per event
export interface EventFeatures {
  // Core features (always available)
  welcome_message: boolean;
  participants_list: boolean;
  context_profile: boolean;
  event_chat: boolean;

  // Focused Event specific
  notes: boolean;
  attachments: boolean;
  summary: boolean;
  agenda: boolean;

  // Networking Event specific
  networking_tools: boolean;
  status_visibility: boolean; // "Open to work", "Hiring", etc.
  job_board: boolean;
  matchmaking: boolean;
  analytics: boolean;
  check_in: boolean;
}

// Default features for each event type
export const FOCUSED_EVENT_FEATURES: EventFeatures = {
  welcome_message: true,
  participants_list: true,
  context_profile: true,
  event_chat: true,
  notes: true,
  attachments: true,
  summary: true,
  agenda: true,
  networking_tools: false,
  status_visibility: false,
  job_board: false,
  matchmaking: false,
  analytics: false,
  check_in: false,
};

export const NETWORKING_EVENT_FEATURES: EventFeatures = {
  welcome_message: true,
  participants_list: true,
  context_profile: true,
  event_chat: true,
  notes: false,
  attachments: false,
  summary: true,
  agenda: false,
  networking_tools: true,
  status_visibility: true,
  job_board: true,
  matchmaking: true,
  analytics: true,
  check_in: true,
};

// Event Type Configuration
export const EVENT_TYPE_CONFIG = {
  focused_event: {
    label: 'ایونت هدف‌محور',
    labelEn: 'Focused Event',
    description: 'جلسه، ورکشاپ، تعامل محدود',
    descriptionEn: 'Meeting, workshop, limited interaction',
    icon: 'Target',
    color: '#2563eb',
    defaultFeatures: FOCUSED_EVENT_FEATURES,
    maxAttendeesDefault: 20,
    examples: ['جلسه شرکت', 'ورکشاپ کوچک', 'معرفی محصول', 'جلسه مشاوره'],
  },
  networking_event: {
    label: 'ایونت شبکه‌سازی',
    labelEn: 'Networking Event',
    description: 'سمینار، نمایشگاه، شبکه‌سازی گسترده',
    descriptionEn: 'Seminar, expo, large-scale networking',
    icon: 'Users',
    color: '#059669',
    defaultFeatures: NETWORKING_EVENT_FEATURES,
    maxAttendeesDefault: null, // No limit by default
    examples: ['سمینار', 'وبینار', 'کنفرانس', 'نمایشگاه'],
  },
};

// Main Event Interface
export interface Event {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  description: string | null;
  event_type: EventType;

  // Category (for more granular classification within type)
  category: string | null; // 'meeting', 'workshop', 'seminar', 'conference', etc.

  // Date & Time
  start_date: string;
  end_date: string | null;
  timezone: string;

  // Location
  location_type: LocationType;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  map_url: string | null;
  online_link: string | null;
  online_platform: string | null; // zoom, meet, teams, etc.

  // Media
  banner_url: string | null;
  logo_url: string | null;
  images: string[];

  // Capacity & Pricing
  max_attendees: number | null;
  is_free: boolean;
  price: number;
  currency: string;

  // Registration Settings
  auto_approve: boolean;
  requires_approval: boolean;
  allow_waitlist: boolean;
  registration_deadline: string | null;

  // Status
  status: EventStatus;
  visibility: EventVisibility;
  is_invite_only: boolean;

  // Features Configuration
  features: EventFeatures;

  // Theme
  theme_color: string;

  // QR Code
  qr_code_url: string | null;

  // Welcome Message
  welcome_message: string | null;
  welcome_attachments: EventAttachment[];

  // Analytics
  view_count: number;
  registration_count: number;
  attendance_count: number;

  // Custom Fields
  custom_fields: EventCustomField[];

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;

  // Relations (optional, when joined)
  organizer?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  speakers?: EventSpeaker[];
  tickets?: EventTicket[];
  attendees_preview?: EventAttendee[];
}

export interface EventAttachment {
  id?: string;
  type: 'file' | 'link';
  url: string;
  name: string;
  description?: string;
  size?: number;
}

export interface EventCustomField {
  id?: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'email' | 'phone' | 'url';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  photo_url: string | null;
  registration_data: Record<string, unknown>;
  status: AttendeeStatus;
  rsvp_status: RSVPStatus | null;
  role: AttendeeRole;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  ticket_code: string | null;
  qr_code_url: string | null;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  payment_id: string | null;
  notes: string | null;
  registered_at: string;
  updated_at: string;

  // For networking events - attendee's status
  networking_status: string | null; // 'open_to_work', 'hiring', 'looking_for_partner', etc.

  // User relation (when joined)
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  sold_count: number;
  is_available: boolean;
  sale_start_date: string | null;
  sale_end_date: string | null;
  display_order: number;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  photo_url: string | null;
  social_links: Record<string, string>;
  display_order: number;
}

// Event Documents (for Focused Events)
export interface EventDocument {
  id: string;
  event_id: string;
  type: 'agenda' | 'minutes' | 'presentation' | 'attachment' | 'other';
  title: string;
  description: string | null;
  file_url: string | null;
  content: string | null; // For inline content
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// Event Notes (for Focused Events - collaborative notes)
export interface EventNote {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  is_shared: boolean; // Visible to all attendees or just organizer
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// Event Discussion (Chat messages within event)
export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  attachments: EventAttachment[];
  reply_to_id: string | null;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// Networking Status Options
export const NETWORKING_STATUS_OPTIONS = [
  { value: 'open_to_work', label: 'آماده همکاری', labelEn: 'Open to Work', icon: 'Briefcase' },
  { value: 'hiring', label: 'در حال استخدام', labelEn: 'Hiring', icon: 'UserPlus' },
  { value: 'looking_for_partner', label: 'جستجوی شریک', labelEn: 'Looking for Partner', icon: 'Users' },
  { value: 'looking_for_investor', label: 'جستجوی سرمایه‌گذار', labelEn: 'Looking for Investor', icon: 'DollarSign' },
  { value: 'offering_services', label: 'ارائه خدمات', labelEn: 'Offering Services', icon: 'Package' },
  { value: 'learning', label: 'در حال یادگیری', labelEn: 'Learning', icon: 'BookOpen' },
  { value: 'networking', label: 'شبکه‌سازی', labelEn: 'Networking', icon: 'Network' },
];

// Input Types
export interface CreateEventInput {
  title: string;
  description?: string;
  event_type: EventType;
  category?: string;
  start_date: string;
  end_date?: string;
  timezone?: string;
  location_type: LocationType;
  venue_name?: string;
  address?: string;
  city?: string;
  country?: string;
  online_link?: string;
  online_platform?: string;
  max_attendees?: number;
  is_free?: boolean;
  price?: number;
  currency?: string;
  visibility?: EventVisibility;
  is_invite_only?: boolean;
  features?: Partial<EventFeatures>;
  theme_color?: string;
  welcome_message?: string;
  custom_fields?: EventCustomField[];
  banner_url?: string;
  welcome_attachments?: EventAttachment[];
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
  banner_url?: string;
  logo_url?: string;
  welcome_attachments?: EventAttachment[];
}

export interface RegisterAttendeeInput {
  event_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  registration_data?: Record<string, unknown>;
  ticket_id?: string;
  networking_status?: string;
}

export interface EventCheckInInput {
  event_id: string;
  ticket_code?: string;
  attendee_id?: string;
}

export interface EventCheckInResponse {
  success: boolean;
  attendee?: EventAttendee;
  error?: string;
}

// Event Summary (for completed events)
export interface EventSummary {
  id: string;
  event_id: string;
  summary: string;
  key_takeaways: string[];
  action_items: { text: string; assignee?: string; due_date?: string }[];
  attachments: EventAttachment[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
