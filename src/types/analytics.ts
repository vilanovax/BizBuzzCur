// Analytics Event Types
// Structured event tracking for user behavior

export type EventSource = 'onboarding' | 'profile_builder' | 'identity_page' | 'dashboard';
export type EntryApp = 'bizbuzz' | 'carbarg' | 'direct' | 'unknown';

// Event names - structured and consistent
export type OnboardingEventName =
  | 'onboarding_started'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  | 'onboarding_step_viewed'
  | 'onboarding_step_skipped';

export type DomainEventName =
  | 'domain_suggested'
  | 'domain_selected'
  | 'domain_skipped'
  | 'domain_changed';

export type SpecializationEventName =
  | 'specialization_selected'
  | 'specialization_removed'
  | 'specialization_skipped';

export type SkillEventName =
  | 'skill_searched'
  | 'skill_added'
  | 'skill_removed'
  | 'skill_level_changed'
  | 'skill_skipped';

export type ProfileEventName =
  | 'profile_created'
  | 'profile_updated'
  | 'profile_deleted'
  | 'profile_viewed'
  | 'profile_shared';

export type EventName =
  | OnboardingEventName
  | DomainEventName
  | SpecializationEventName
  | SkillEventName
  | ProfileEventName;

// Base event properties (required for all events)
export interface BaseEventProperties {
  user_id: string;
  source: EventSource;
  entry_app: EntryApp;
  timestamp: string;
  session_id?: string;
}

// Event-specific properties
export interface OnboardingEventProperties extends BaseEventProperties {
  step?: string;
  step_index?: number;
  total_steps?: number;
  time_spent_ms?: number;
}

export interface DomainEventProperties extends BaseEventProperties {
  domain_id?: string;
  domain_slug?: string;
  domain_name?: string;
  suggested_domain_id?: string;
  suggestion_reason?: string;
  was_suggested?: boolean;
}

export interface SpecializationEventProperties extends BaseEventProperties {
  specialization_id?: string;
  specialization_slug?: string;
  domain_id?: string;
  count?: number;
}

export interface SkillEventProperties extends BaseEventProperties {
  skill_id?: string;
  skill_slug?: string;
  skill_name?: string;
  skill_category?: string;
  level?: string;
  search_query?: string;
  was_suggested?: boolean;
  count?: number;
}

export interface ProfileEventProperties extends BaseEventProperties {
  profile_id?: string;
  profile_type?: string;
  template_id?: string;
}

// Union type for all event properties
export type EventProperties =
  | OnboardingEventProperties
  | DomainEventProperties
  | SpecializationEventProperties
  | SkillEventProperties
  | ProfileEventProperties;

// Complete event structure
export interface AnalyticsEvent {
  id?: string;
  event_name: EventName;
  properties: EventProperties;
  created_at?: string;
}

// Batch event structure for bulk inserts
export interface EventBatch {
  events: AnalyticsEvent[];
}
