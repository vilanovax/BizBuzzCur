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

  // Utility
  setEntryApp,
};

export default analytics;
