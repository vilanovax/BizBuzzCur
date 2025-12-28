export type EventType = 'conference' | 'meetup' | 'workshop' | 'expo' | 'webinar' | 'seminar';
export type LocationType = 'in_person' | 'online' | 'hybrid';
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled' | 'archived';
export type EventVisibility = 'public' | 'unlisted' | 'private';
export type AttendeeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlist';
export type RSVPStatus = 'pending' | 'accepted' | 'maybe' | 'declined';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed' | 'not_required';

export interface Event {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  description: string | null;
  event_type: EventType;

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

  // QR Code
  qr_code_url: string | null;

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
}

export interface EventCustomField {
  id?: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
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
  registration_data: Record<string, unknown>;
  status: AttendeeStatus;
  rsvp_status: RSVPStatus | null;
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

export interface CreateEventInput {
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date?: string;
  timezone?: string;
  location_type: LocationType;
  venue_name?: string;
  address?: string;
  city?: string;
  country?: string;
  online_link?: string;
  max_attendees?: number;
  is_free?: boolean;
  price?: number;
  currency?: string;
  visibility?: EventVisibility;
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
