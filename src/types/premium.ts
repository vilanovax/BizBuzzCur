/**
 * Premium Types & Constants
 *
 * Premium is NOT about locking basic functionality.
 * Premium is about unlocking clarity, speed, and confidence in hiring decisions.
 *
 * Core Principle:
 * - Free users must experience value
 * - Premium users get deeper insights, better signals, faster decisions
 * - If Premium feels mandatory, it is wrong
 * - If Premium feels obviously helpful, it is right
 */

/**
 * Premium tier levels
 */
export type PremiumTier = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Premium feature categories
 */
export type PremiumFeatureCategory =
  | 'hiring_insights'   // "Why this candidate?" depth
  | 'team_intelligence' // Team-fit aggregation depth
  | 'hiring_kpi'        // Trend visibility
  | 'job_performance'   // Job posting analytics
  | 'bias_guard';       // Bias awareness summaries

/**
 * Individual premium features
 */
export type PremiumFeature =
  // Hiring Insights
  | 'candidate_insights_basic'      // Free: basic "Why this candidate?"
  | 'candidate_insights_expanded'   // Premium: more context
  | 'team_fit_summary'              // Free: summary only
  | 'team_fit_detailed'             // Premium: patterns, balance areas
  | 'confidence_notes_detailed'     // Premium: more clarity

  // Hiring KPI
  | 'kpi_current'                   // Free: current metrics only
  | 'kpi_trends'                    // Premium: trends over time
  | 'kpi_comparisons'               // Premium: role comparisons

  // Job Performance
  | 'job_application_count'         // Free: application count
  | 'job_alignment_insights'        // Premium: candidate alignment patterns
  | 'job_conversion_analysis'       // Premium: which roles convert faster

  // Team Intelligence
  | 'team_summary'                  // Free: basic team summary
  | 'team_org_patterns'             // Premium: org-level insights
  | 'team_department_patterns'      // Premium: department patterns
  | 'team_balance_views'            // Premium: balance visualization

  // Limits
  | 'active_jobs_1'                 // Free: 1 active job
  | 'active_jobs_5'                 // Starter: 5 active jobs
  | 'active_jobs_unlimited';        // Professional+: unlimited

/**
 * Premium subscription status
 */
export interface PremiumStatus {
  /** Current tier */
  tier: PremiumTier;
  /** Whether subscription is active */
  isActive: boolean;
  /** Subscription end date (if applicable) */
  expiresAt?: string | null;
  /** Trial end date (if in trial) */
  trialEndsAt?: string | null;
  /** Whether currently in trial */
  isInTrial: boolean;
  /** Features available at this tier */
  features: PremiumFeature[];
  /** Limits at this tier */
  limits: PremiumLimits;
}

/**
 * Usage limits per tier
 */
export interface PremiumLimits {
  /** Maximum active job postings */
  activeJobs: number;
  /** Maximum companies (for user-level, future) */
  companies: number;
  /** Team fit insights depth */
  teamFitDepth: 'summary' | 'detailed' | 'full';
  /** Candidate insights depth */
  candidateInsightsDepth: 'basic' | 'expanded';
  /** KPI visibility */
  kpiVisibility: 'current' | 'trends' | 'full';
}

/**
 * Default limits per tier
 */
export const TIER_LIMITS: Record<PremiumTier, PremiumLimits> = {
  free: {
    activeJobs: 1,
    companies: 1,
    teamFitDepth: 'summary',
    candidateInsightsDepth: 'basic',
    kpiVisibility: 'current',
  },
  starter: {
    activeJobs: 5,
    companies: 1,
    teamFitDepth: 'detailed',
    candidateInsightsDepth: 'expanded',
    kpiVisibility: 'trends',
  },
  professional: {
    activeJobs: -1, // unlimited
    companies: 3,
    teamFitDepth: 'full',
    candidateInsightsDepth: 'expanded',
    kpiVisibility: 'full',
  },
  enterprise: {
    activeJobs: -1,
    companies: -1,
    teamFitDepth: 'full',
    candidateInsightsDepth: 'expanded',
    kpiVisibility: 'full',
  },
};

/**
 * Features available per tier
 */
export const TIER_FEATURES: Record<PremiumTier, PremiumFeature[]> = {
  free: [
    'candidate_insights_basic',
    'team_fit_summary',
    'kpi_current',
    'job_application_count',
    'team_summary',
    'active_jobs_1',
  ],
  starter: [
    'candidate_insights_basic',
    'candidate_insights_expanded',
    'team_fit_summary',
    'team_fit_detailed',
    'confidence_notes_detailed',
    'kpi_current',
    'kpi_trends',
    'job_application_count',
    'job_alignment_insights',
    'team_summary',
    'team_org_patterns',
    'active_jobs_5',
  ],
  professional: [
    'candidate_insights_basic',
    'candidate_insights_expanded',
    'team_fit_summary',
    'team_fit_detailed',
    'confidence_notes_detailed',
    'kpi_current',
    'kpi_trends',
    'kpi_comparisons',
    'job_application_count',
    'job_alignment_insights',
    'job_conversion_analysis',
    'team_summary',
    'team_org_patterns',
    'team_department_patterns',
    'team_balance_views',
    'active_jobs_unlimited',
  ],
  enterprise: [
    // All features
    'candidate_insights_basic',
    'candidate_insights_expanded',
    'team_fit_summary',
    'team_fit_detailed',
    'confidence_notes_detailed',
    'kpi_current',
    'kpi_trends',
    'kpi_comparisons',
    'job_application_count',
    'job_alignment_insights',
    'job_conversion_analysis',
    'team_summary',
    'team_org_patterns',
    'team_department_patterns',
    'team_balance_views',
    'active_jobs_unlimited',
  ],
};

/**
 * Premium upgrade context - when to show upgrade prompts
 */
export type UpgradeContext =
  | 'applications_reviewed'   // After reviewing 5+ applications
  | 'team_fit_viewed'         // After viewing team-fit insights
  | 'job_limit_reached'       // When trying to post more jobs
  | 'kpi_trends_requested'    // When trying to view trends
  | 'time_to_decision_slow';  // When time-to-decision exceeds threshold

/**
 * Premium CTA copy - outcome-focused, not feature-focused
 */
export const PREMIUM_CTA_COPY = {
  // Main CTAs (never use "Upgrade to Premium" or "Unlock features")
  primary: 'دریافت بینش‌های عمیق‌تر',
  secondary: 'تصمیم‌گیری با اطمینان بیشتر',
  tertiary: 'مشاهده الگوها، نه فقط پروفایل‌ها',

  // Context-specific CTAs
  teamFit: 'مشاهده الگوهای تیمی کامل',
  candidateInsights: 'دریافت تحلیل کامل‌تر',
  kpiTrends: 'مشاهده روند تصمیم‌گیری',
  jobPerformance: 'بهینه‌سازی آگهی‌ها',

  // Value propositions
  valueProps: [
    'درک بهتر هماهنگی کاندیدا با تیم',
    'تصمیم‌گیری سریع‌تر و مطمئن‌تر',
    'شناسایی الگوهای موفقیت استخدام',
  ],
};

/**
 * Tier labels (Persian)
 */
export const TIER_LABELS: Record<PremiumTier, string> = {
  free: 'رایگان',
  starter: 'استارتر',
  professional: 'حرفه‌ای',
  enterprise: 'سازمانی',
};

/**
 * Check if a feature is available for a tier
 */
export function hasFeature(tier: PremiumTier, feature: PremiumFeature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTier(feature: PremiumFeature): PremiumTier {
  const tiers: PremiumTier[] = ['free', 'starter', 'professional', 'enterprise'];
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(feature)) {
      return tier;
    }
  }
  return 'enterprise';
}

/**
 * Check if upgrade should be shown based on context
 * Premium prompts should appear after meaningful usage, not on first visit
 */
export function shouldShowUpgrade(
  context: UpgradeContext,
  stats: { applicationsReviewed?: number; timeToDecisionDays?: number }
): boolean {
  switch (context) {
    case 'applications_reviewed':
      return (stats.applicationsReviewed || 0) >= 5;
    case 'time_to_decision_slow':
      return (stats.timeToDecisionDays || 0) > 7;
    default:
      return true;
  }
}

/**
 * What Premium NEVER unlocks (ethics guardrails)
 * These are blocked at the type level for documentation
 */
export const PREMIUM_NEVER_UNLOCKS = [
  'individual_candidate_scores',
  'automated_hire_reject_recommendations',
  'personality_labels_or_rankings',
  'sensitive_attribute_inference',
] as const;
