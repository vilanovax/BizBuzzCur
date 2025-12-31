/**
 * Analytics Tracker
 *
 * Async, non-blocking event tracking utility.
 * All tracking calls are fire-and-forget - they never block the UI.
 */

import type {
  EventName,
  EventSource,
  EntryApp,
  EventProperties,
  OnboardingEventProperties,
  DomainEventProperties,
  SpecializationEventProperties,
  SkillEventProperties,
  ProfileEventProperties,
  JobEventProperties,
  WorkstyleEventProperties,
} from '@/types/analytics';

// Session ID for correlating events
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
}

// Entry app detection from URL or storage
function getEntryApp(): EntryApp {
  if (typeof window === 'undefined') return 'bizbuzz';

  // Check URL params first
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  if (source === 'carbarg') return 'carbarg';

  // Check localStorage for persisted entry app
  const stored = localStorage.getItem('bizbuzz_entry_app');
  if (stored === 'carbarg') return 'carbarg';

  return 'bizbuzz';
}

// Persist entry app for future events
export function setEntryApp(app: EntryApp): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bizbuzz_entry_app', app);
  }
}

/**
 * Core tracking function - async and non-blocking
 */
async function trackEvent(
  eventName: EventName,
  properties: Partial<EventProperties>
): Promise<void> {
  // Fire and forget - never await in the calling code
  try {
    const baseProperties = {
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      entry_app: properties.entry_app || getEntryApp(),
      source: properties.source || 'unknown',
      ...properties,
    };

    // Use navigator.sendBeacon for guaranteed delivery (if available)
    const payload = JSON.stringify({
      event_name: eventName,
      properties: baseProperties,
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/events', payload);
    } else {
      // Fallback to fetch with keepalive
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently ignore errors - analytics should never break the app
      });
    }
  } catch {
    // Silently ignore errors
  }
}

// ============================================
// ONBOARDING EVENTS
// ============================================

export function trackOnboardingStarted(
  userId: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('onboarding_started', {
    user_id: userId,
    source,
  } as OnboardingEventProperties);
}

export function trackOnboardingSkipped(
  userId: string,
  step: string,
  stepIndex: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('onboarding_skipped', {
    user_id: userId,
    source,
    step,
    step_index: stepIndex,
  } as OnboardingEventProperties);
}

export function trackOnboardingCompleted(
  userId: string,
  totalSteps: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('onboarding_completed', {
    user_id: userId,
    source,
    total_steps: totalSteps,
  } as OnboardingEventProperties);
}

export function trackOnboardingStepViewed(
  userId: string,
  step: string,
  stepIndex: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('onboarding_step_viewed', {
    user_id: userId,
    source,
    step,
    step_index: stepIndex,
  } as OnboardingEventProperties);
}

// ============================================
// DOMAIN EVENTS
// ============================================

export function trackDomainSuggested(
  userId: string,
  domainId: string,
  domainSlug: string,
  reason: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('domain_suggested', {
    user_id: userId,
    source,
    domain_id: domainId,
    domain_slug: domainSlug,
    suggestion_reason: reason,
  } as DomainEventProperties);
}

export function trackDomainSelected(
  userId: string,
  domainId: string,
  domainSlug: string,
  wasSuggested: boolean,
  source: EventSource = 'onboarding'
): void {
  trackEvent('domain_selected', {
    user_id: userId,
    source,
    domain_id: domainId,
    domain_slug: domainSlug,
    was_suggested: wasSuggested,
  } as DomainEventProperties);
}

export function trackDomainSkipped(
  userId: string,
  suggestedDomainId: string | null,
  source: EventSource = 'onboarding'
): void {
  trackEvent('domain_skipped', {
    user_id: userId,
    source,
    suggested_domain_id: suggestedDomainId || undefined,
  } as DomainEventProperties);
}

// ============================================
// SPECIALIZATION EVENTS
// ============================================

export function trackSpecializationSelected(
  userId: string,
  specializationId: string,
  domainId: string,
  count: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('specialization_selected', {
    user_id: userId,
    source,
    specialization_id: specializationId,
    domain_id: domainId,
    count,
  } as SpecializationEventProperties);
}

export function trackSpecializationRemoved(
  userId: string,
  specializationId: string,
  count: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('specialization_removed', {
    user_id: userId,
    source,
    specialization_id: specializationId,
    count,
  } as SpecializationEventProperties);
}

export function trackSpecializationSkipped(
  userId: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('specialization_skipped', {
    user_id: userId,
    source,
  } as SpecializationEventProperties);
}

// ============================================
// SKILL EVENTS
// ============================================

export function trackSkillSearched(
  userId: string,
  query: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('skill_searched', {
    user_id: userId,
    source,
    search_query: query,
  } as SkillEventProperties);
}

export function trackSkillAdded(
  userId: string,
  skillId: string,
  skillSlug: string,
  skillName: string,
  level: string,
  wasSuggested: boolean,
  count: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('skill_added', {
    user_id: userId,
    source,
    skill_id: skillId,
    skill_slug: skillSlug,
    skill_name: skillName,
    level,
    was_suggested: wasSuggested,
    count,
  } as SkillEventProperties);
}

export function trackSkillRemoved(
  userId: string,
  skillId: string,
  count: number,
  source: EventSource = 'onboarding'
): void {
  trackEvent('skill_removed', {
    user_id: userId,
    source,
    skill_id: skillId,
    count,
  } as SkillEventProperties);
}

export function trackSkillLevelChanged(
  userId: string,
  skillId: string,
  newLevel: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('skill_level_changed', {
    user_id: userId,
    source,
    skill_id: skillId,
    level: newLevel,
  } as SkillEventProperties);
}

export function trackSkillSkipped(
  userId: string,
  source: EventSource = 'onboarding'
): void {
  trackEvent('skill_skipped', {
    user_id: userId,
    source,
  } as SkillEventProperties);
}

// ============================================
// PROFILE EVENTS
// ============================================

export function trackProfileCreated(
  userId: string,
  profileId: string,
  profileType: string,
  templateId: string | null,
  source: EventSource = 'profile_builder'
): void {
  trackEvent('profile_created', {
    user_id: userId,
    source,
    profile_id: profileId,
    profile_type: profileType,
    template_id: templateId || undefined,
  } as ProfileEventProperties);
}

export function trackProfileUpdated(
  userId: string,
  profileId: string,
  source: EventSource = 'profile_builder'
): void {
  trackEvent('profile_updated', {
    user_id: userId,
    source,
    profile_id: profileId,
  } as ProfileEventProperties);
}

// ============================================
// JOB EVENTS - KPI Telemetry
// Decision-making telemetry, not vanity metrics.
// Track behavior, not personality.
// ============================================

/**
 * 1. job_detail_viewed
 * Triggered when job detail page loads.
 * Primary KPI funnel entry point.
 */
export function trackJobDetailViewed(
  jobId: string,
  jobSource: 'dashboard' | 'company' | 'event',
  hasPersonalitySignals: boolean
): void {
  trackEvent('job_detail_viewed', {
    user_id: 'anonymous', // Will be enriched by session
    source: 'job_detail',
    job_id: jobId,
    job_source: jobSource,
    has_personality_signals: hasPersonalitySignals,
  } as JobEventProperties);
}

/**
 * 2. why_this_job_shown
 * Triggered when explanation block is rendered.
 * Key for measuring explanation impact.
 */
export function trackWhyThisJobShown(
  jobId: string,
  explanationType: 'personality' | 'generic',
  reasonsCount: number,
  hasWarnings: boolean
): void {
  trackEvent('why_this_job_shown', {
    user_id: 'anonymous',
    source: 'job_detail',
    job_id: jobId,
    explanation_type: explanationType,
    reasons_count: reasonsCount,
    has_warnings: hasWarnings,
  } as JobEventProperties);
}

/**
 * 3. apply_clicked
 * Triggered on Apply button click.
 * Key conversion event.
 */
export function trackApplyClicked(
  jobId: string,
  explanationSeen: boolean,
  explanationType: 'personality' | 'generic'
): void {
  trackEvent('apply_clicked', {
    user_id: 'anonymous',
    source: 'job_detail',
    job_id: jobId,
    explanation_seen: explanationSeen,
    explanation_type: explanationType,
  } as JobEventProperties);
}

/**
 * 4. application_started
 * Triggered when job conversation is created.
 * Final funnel conversion.
 */
export function trackApplicationStarted(
  jobId: string,
  fromJobDetail: boolean = true
): void {
  trackEvent('application_started', {
    user_id: 'anonymous',
    source: 'job_detail',
    job_id: jobId,
    from_job_detail: fromJobDetail,
  } as JobEventProperties);
}

// ============================================
// LEGACY JOB EVENTS (Backward Compatibility)
// ============================================

export function trackJobViewed(
  userId: string | null,
  jobId: string,
  jobTitle: string,
  companyId: string,
  companyName: string,
  hasPersonalitySignals: boolean,
  matchType: 'personality' | 'skills' | 'domain' | 'generic',
  matchScore?: number
): void {
  trackEvent('job_viewed', {
    user_id: userId || 'anonymous',
    source: 'job_detail',
    job_id: jobId,
    job_title: jobTitle,
    company_id: companyId,
    company_name: companyName,
    has_personality_signals: hasPersonalitySignals,
    match_type: matchType,
    match_score: matchScore,
  } as JobEventProperties);
}

export function trackJobApplyStarted(
  userId: string,
  jobId: string,
  jobTitle: string,
  hasPersonalitySignals: boolean,
  matchType: 'personality' | 'skills' | 'domain' | 'generic'
): void {
  trackEvent('job_apply_started', {
    user_id: userId,
    source: 'job_detail',
    job_id: jobId,
    job_title: jobTitle,
    has_personality_signals: hasPersonalitySignals,
    match_type: matchType,
  } as JobEventProperties);
}

export function trackJobApplied(
  userId: string,
  jobId: string,
  jobTitle: string,
  companyId: string,
  hasPersonalitySignals: boolean,
  matchType: 'personality' | 'skills' | 'domain' | 'generic',
  matchScore?: number,
  timeOnPageMs?: number
): void {
  trackEvent('job_applied', {
    user_id: userId,
    source: 'job_detail',
    job_id: jobId,
    job_title: jobTitle,
    company_id: companyId,
    has_personality_signals: hasPersonalitySignals,
    match_type: matchType,
    match_score: matchScore,
    time_on_page_ms: timeOnPageMs,
  } as JobEventProperties);
}

export function trackJobApplyCancelled(
  userId: string,
  jobId: string,
  hasPersonalitySignals: boolean
): void {
  trackEvent('job_apply_cancelled', {
    user_id: userId,
    source: 'job_detail',
    job_id: jobId,
    has_personality_signals: hasPersonalitySignals,
  } as JobEventProperties);
}

// ============================================
// WORKSTYLE TEST EVENTS
// ============================================

export function trackWorkstyleTestStarted(
  userId: string,
  testType: 'disc' | 'holland'
): void {
  trackEvent('workstyle_test_started', {
    user_id: userId,
    source: 'workstyle_test',
    test_type: testType,
  } as WorkstyleEventProperties);
}

export function trackWorkstyleTestCompleted(
  userId: string,
  testType: 'disc' | 'holland',
  questionsAnswered: number,
  totalQuestions: number,
  avgResponseTimeMs: number,
  signalsGenerated: number
): void {
  trackEvent('workstyle_test_completed', {
    user_id: userId,
    source: 'workstyle_test',
    test_type: testType,
    questions_answered: questionsAnswered,
    total_questions: totalQuestions,
    avg_response_time_ms: avgResponseTimeMs,
    signals_generated: signalsGenerated,
  } as WorkstyleEventProperties);
}

export function trackWorkstyleTestAbandoned(
  userId: string,
  testType: 'disc' | 'holland',
  questionsAnswered: number,
  totalQuestions: number
): void {
  trackEvent('workstyle_test_abandoned', {
    user_id: userId,
    source: 'workstyle_test',
    test_type: testType,
    questions_answered: questionsAnswered,
    total_questions: totalQuestions,
  } as WorkstyleEventProperties);
}

// ============================================
// UTILITY EXPORTS
// ============================================

export const analytics = {
  // Onboarding
  trackOnboardingStarted,
  trackOnboardingSkipped,
  trackOnboardingCompleted,
  trackOnboardingStepViewed,

  // Domain
  trackDomainSuggested,
  trackDomainSelected,
  trackDomainSkipped,

  // Specialization
  trackSpecializationSelected,
  trackSpecializationRemoved,
  trackSpecializationSkipped,

  // Skills
  trackSkillSearched,
  trackSkillAdded,
  trackSkillRemoved,
  trackSkillLevelChanged,
  trackSkillSkipped,

  // Profile
  trackProfileCreated,
  trackProfileUpdated,

  // Jobs - KPI Telemetry (Primary)
  trackJobDetailViewed,
  trackWhyThisJobShown,
  trackApplyClicked,
  trackApplicationStarted,
  // Jobs - Legacy
  trackJobViewed,
  trackJobApplyStarted,
  trackJobApplied,
  trackJobApplyCancelled,

  // Workstyle Test
  trackWorkstyleTestStarted,
  trackWorkstyleTestCompleted,
  trackWorkstyleTestAbandoned,

  // Utility
  setEntryApp,
};

export default analytics;
