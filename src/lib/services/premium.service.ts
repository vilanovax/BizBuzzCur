/**
 * Premium Service
 *
 * Handles premium tier checks and feature access.
 *
 * Core Principle:
 * - Free users must experience value
 * - Premium unlocks deeper insights, not basic functionality
 */

import sql from '@/lib/db';
import {
  TIER_LIMITS,
  TIER_FEATURES,
  type PremiumTier,
  type PremiumStatus,
  type PremiumFeature,
  type PremiumLimits,
} from '@/types/premium';

/**
 * Get premium status for a company
 */
export async function getCompanyPremiumStatus(companyId: string): Promise<PremiumStatus> {
  try {
    // Check if company has premium subscription
    // For now, we check a premium_tier column on companies table
    // In production, this would integrate with a billing system
    const [company] = await sql<{
      premium_tier: PremiumTier | null;
      premium_expires_at: string | null;
      premium_trial_ends_at: string | null;
    }[]>`
      SELECT
        COALESCE(premium_tier, 'free') as premium_tier,
        premium_expires_at,
        premium_trial_ends_at
      FROM companies
      WHERE id = ${companyId}
    `;

    if (!company) {
      return getDefaultPremiumStatus();
    }

    const tier = (company.premium_tier as PremiumTier) || 'free';
    const now = new Date();

    // Check if subscription is expired
    let isActive = true;
    if (company.premium_expires_at) {
      const expiresAt = new Date(company.premium_expires_at);
      isActive = expiresAt > now;
    }

    // Check if in trial
    let isInTrial = false;
    if (company.premium_trial_ends_at) {
      const trialEnds = new Date(company.premium_trial_ends_at);
      isInTrial = trialEnds > now;
    }

    // If expired and not in trial, revert to free
    const effectiveTier = isActive || isInTrial ? tier : 'free';

    return {
      tier: effectiveTier,
      isActive: isActive || isInTrial,
      expiresAt: company.premium_expires_at,
      trialEndsAt: company.premium_trial_ends_at,
      isInTrial,
      features: TIER_FEATURES[effectiveTier],
      limits: TIER_LIMITS[effectiveTier],
    };
  } catch (error) {
    console.error('Premium status error:', error);
    return getDefaultPremiumStatus();
  }
}

/**
 * Default premium status (free tier)
 */
function getDefaultPremiumStatus(): PremiumStatus {
  return {
    tier: 'free',
    isActive: true,
    expiresAt: null,
    trialEndsAt: null,
    isInTrial: false,
    features: TIER_FEATURES.free,
    limits: TIER_LIMITS.free,
  };
}

/**
 * Check if a company has access to a specific feature
 */
export async function hasFeatureAccess(
  companyId: string,
  feature: PremiumFeature
): Promise<boolean> {
  const status = await getCompanyPremiumStatus(companyId);
  return status.features.includes(feature);
}

/**
 * Get usage limits for a company
 */
export async function getCompanyLimits(companyId: string): Promise<PremiumLimits> {
  const status = await getCompanyPremiumStatus(companyId);
  return status.limits;
}

/**
 * Check if company can post more jobs
 */
export async function canPostMoreJobs(companyId: string): Promise<{
  canPost: boolean;
  currentCount: number;
  limit: number;
}> {
  const limits = await getCompanyLimits(companyId);

  // Get current active job count
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM job_ads
    WHERE company_id = ${companyId}
      AND status IN ('published', 'draft')
  `;

  const currentCount = parseInt(result?.count || '0', 10);
  const limit = limits.activeJobs;

  // -1 means unlimited
  const canPost = limit === -1 || currentCount < limit;

  return {
    canPost,
    currentCount,
    limit: limit === -1 ? Infinity : limit,
  };
}

/**
 * Get insights depth for candidate matching
 */
export async function getCandidateInsightsDepth(
  companyId: string
): Promise<'basic' | 'expanded'> {
  const limits = await getCompanyLimits(companyId);
  return limits.candidateInsightsDepth;
}

/**
 * Get insights depth for team fit
 */
export async function getTeamFitDepth(
  companyId: string
): Promise<'summary' | 'detailed' | 'full'> {
  const limits = await getCompanyLimits(companyId);
  return limits.teamFitDepth;
}

/**
 * Filter candidate insights based on premium tier
 * Free tier gets basic insights, premium gets expanded
 */
export function filterCandidateInsights<T extends {
  strengths: string[];
  considerations: string[];
  confidenceNote?: string;
}>(
  insights: T,
  depth: 'basic' | 'expanded'
): T {
  if (depth === 'expanded') {
    return insights; // Full access
  }

  // Basic: limit to 2 strengths, 1 consideration, no confidence notes
  return {
    ...insights,
    strengths: insights.strengths.slice(0, 2),
    considerations: insights.considerations.slice(0, 1),
    confidenceNote: undefined,
  };
}

/**
 * Filter team fit insights based on premium tier
 */
export function filterTeamFitInsights<T extends {
  teamStrengths: string[];
  teamGaps: string[];
  confidenceNote?: string;
}>(
  insights: T,
  depth: 'summary' | 'detailed' | 'full'
): T {
  if (depth === 'full') {
    return insights; // Full access
  }

  if (depth === 'detailed') {
    // Detailed: full strengths/gaps, no confidence deep dive
    return {
      ...insights,
      teamStrengths: insights.teamStrengths.slice(0, 3),
      teamGaps: insights.teamGaps.slice(0, 2),
    };
  }

  // Summary: limited to overview only
  return {
    ...insights,
    teamStrengths: insights.teamStrengths.slice(0, 1),
    teamGaps: [], // No gaps in summary
    confidenceNote: undefined,
  };
}

/**
 * Record premium feature usage for analytics
 */
export async function recordFeatureUsage(
  companyId: string,
  feature: PremiumFeature,
  userId: string
): Promise<void> {
  try {
    // This would integrate with analytics
    // For now, just log it
    console.log(`Premium feature usage: ${feature} by company ${companyId}, user ${userId}`);
  } catch (error) {
    // Silently ignore - analytics shouldn't break the app
  }
}

/**
 * Get upgrade recommendation based on usage
 */
export async function getUpgradeRecommendation(
  companyId: string
): Promise<{
  shouldShow: boolean;
  reason?: string;
  suggestedTier?: PremiumTier;
}> {
  const status = await getCompanyPremiumStatus(companyId);

  // Already on professional or above, no recommendation
  if (status.tier === 'professional' || status.tier === 'enterprise') {
    return { shouldShow: false };
  }

  // Check usage patterns
  const [usage] = await sql<{
    total_applications: string;
    total_jobs: string;
  }[]>`
    SELECT
      (SELECT COUNT(*) FROM job_applications ja
       JOIN job_ads j ON j.id = ja.job_id
       WHERE j.company_id = ${companyId}) as total_applications,
      (SELECT COUNT(*) FROM job_ads WHERE company_id = ${companyId}) as total_jobs
  `;

  const totalApplications = parseInt(usage?.total_applications || '0', 10);
  const totalJobs = parseInt(usage?.total_jobs || '0', 10);

  // Show upgrade after meaningful usage (5+ applications reviewed)
  if (totalApplications >= 5 && status.tier === 'free') {
    return {
      shouldShow: true,
      reason: 'applications_reviewed',
      suggestedTier: 'starter',
    };
  }

  // Show upgrade when approaching job limit
  if (totalJobs >= status.limits.activeJobs && status.tier === 'free') {
    return {
      shouldShow: true,
      reason: 'job_limit_approaching',
      suggestedTier: 'starter',
    };
  }

  return { shouldShow: false };
}
