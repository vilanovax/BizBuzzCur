// Analytics Event Types
// Structured event tracking for user behavior

export type EventSource = 'onboarding' | 'profile_builder' | 'identity_page' | 'dashboard' | 'job_detail' | 'workstyle_test' | 'company' | 'event';
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

export type JobEventName =
  | 'job_detail_viewed'      // When job detail page loads
  | 'why_this_job_shown'     // When explanation block renders
  | 'apply_clicked'          // On Apply button click
  | 'application_started'    // When job conversation is created
  | 'job_viewed'             // Legacy - keep for backward compat
  | 'job_applied'            // Legacy
  | 'job_apply_started'      // Legacy
  | 'job_apply_cancelled';   // Legacy

export type WorkstyleEventName =
  | 'workstyle_test_started'
  | 'workstyle_test_completed'
  | 'workstyle_test_abandoned';

export type EventName =
  | OnboardingEventName
  | DomainEventName
  | SpecializationEventName
  | SkillEventName
  | ProfileEventName
  | JobEventName
  | WorkstyleEventName;

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

export interface JobEventProperties extends BaseEventProperties {
  job_id?: string;
  job_title?: string;
  company_id?: string;
  company_name?: string;
  domain_id?: string;
  /** Whether user has personality signals for matching */
  has_personality_signals?: boolean;
  /** Type of explanation shown: personality-based or generic */
  explanation_type?: 'personality' | 'generic';
  /** Whether explanation was visible when action taken */
  explanation_seen?: boolean;
  /** Number of reasons shown in explanation */
  reasons_count?: number;
  /** Whether warnings were shown */
  has_warnings?: boolean;
  /** Source of job view: dashboard, company page, or event page */
  job_source?: 'dashboard' | 'company' | 'event';
  /** Whether application came from job detail page */
  from_job_detail?: boolean;
  // Legacy fields (for backward compatibility)
  match_type?: 'personality' | 'skills' | 'domain' | 'generic';
  match_score?: number;
  time_on_page_ms?: number;
}

export interface WorkstyleEventProperties extends BaseEventProperties {
  test_type?: 'disc' | 'holland';
  questions_answered?: number;
  total_questions?: number;
  avg_response_time_ms?: number;
  signals_generated?: number;
}

// Union type for all event properties
export type EventProperties =
  | OnboardingEventProperties
  | DomainEventProperties
  | SpecializationEventProperties
  | SkillEventProperties
  | ProfileEventProperties
  | JobEventProperties
  | WorkstyleEventProperties;

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
