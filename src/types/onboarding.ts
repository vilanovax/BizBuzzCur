// Onboarding Types
// Flow: Welcome → Why → Domain → Specialization → Skills → Done

export type OnboardingStep =
  | 'welcome'
  | 'why'
  | 'domain'
  | 'specialization'
  | 'skills'
  | 'done';

export type EntrySource = 'bizbuzz' | 'carbarg' | 'direct' | 'unknown';

export interface OnboardingState {
  currentStep: OnboardingStep;
  isCompleted: boolean;
  isSkipped: boolean;
  entrySource: EntrySource;

  // Selections
  selectedDomainId: string | null;
  selectedSpecializationIds: string[];
  selectedSkills: Array<{
    skillId: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;

  // Smart suggestions
  suggestedDomainId: string | null;
  suggestionReason: string | null;
}

export interface OnboardingSignals {
  entryApp?: string;          // Which app referred user
  templateViewed?: string[];  // Templates user looked at
  skillsSearched?: string[];  // Skills user searched for
  eventContext?: string;      // Event they came from
  emailDomain?: string;       // Company email domain
}

// Domain suggestions based on entry source
export const DOMAIN_SUGGESTIONS: Record<EntrySource, { domainSlug: string; reason: string } | null> = {
  carbarg: {
    domainSlug: 'finance',
    reason: 'با توجه به ورود از Carbarg'
  },
  bizbuzz: null,
  direct: null,
  unknown: null,
};

// Onboarding progress stored in user record
export interface UserOnboardingProgress {
  onboarding_completed: boolean;
  onboarding_skipped_at: string | null;
  onboarding_completed_at: string | null;
  entry_source: EntrySource | null;
}
