/**
 * Share Decision Engine Service
 *
 * «الان کدوم Version رو کجا Share کنم؟»
 *
 * This is the intelligence core of BizBuzz.
 * The engine analyzes context and recommends the best version to share.
 *
 * Decision Flow:
 * ShareContext → Version Filtering → Version Scoring → Decision + Explainability
 */

import sql from '@/lib/db';
import { getProfileVersions } from './profile-version.service';
import { calculateProfileScore } from './profile-score.service';
import type { ProfileVersion, ProfileVersionContext } from '@/types/profile-version';
import type { ProfileScore } from '@/types/profile-score';
import type {
  ShareContext,
  ShareDecision,
  ShareDecisionResponse,
  NoVersionFallback,
  DecisionReason,
  ActionItem,
  AlternativeVersion,
  VersionScoreBreakdown,
  ConfidenceLevel,
  ShareIntent,
  AudienceType,
} from '@/types/share-decision';
import {
  SCORE_WEIGHTS,
  INTENT_TO_CONTEXT,
  AUDIENCE_TO_CONTEXT,
  getConfidenceLevel,
} from '@/types/share-decision';

// =============================================================================
// MAIN DECISION FUNCTION
// =============================================================================

/**
 * Get share decision for a profile
 * This is the main entry point for the Share Decision Engine
 */
export async function getShareDecision(
  profileId: string,
  profileSlug: string,
  context: ShareContext
): Promise<ShareDecisionResponse> {
  // Get all versions for this profile
  const versions = await getProfileVersions(profileId);

  if (versions.length === 0) {
    return createNoVersionFallback(context, profileId);
  }

  // Get profile score (uses the unified Profile Score service)
  const profileScore = await calculateProfileScore(profileId);

  // Convert to completeness data format for backward compatibility
  const completenessData = convertProfileScoreToCompletenessData(profileScore);

  // Score all versions
  const scoredVersions = versions.map((version) => ({
    version,
    breakdown: scoreVersion(version, context, completenessData),
  }));

  // Sort by total score descending
  scoredVersions.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  const bestMatch = scoredVersions[0];
  const confidence = Math.round(bestMatch.breakdown.totalScore * 100);

  // Check if we have a good enough match
  if (confidence < 20) {
    return createNoVersionFallback(context, profileId);
  }

  // Generate share URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizbuzz.me';
  const shareUrl = bestMatch.version.slug
    ? `${appUrl}/${profileSlug}/${bestMatch.version.slug}`
    : `${appUrl}/${profileSlug}`;

  // Build decision with profile score suggestions
  const decision: ShareDecision & { hasRecommendation: true } = {
    hasRecommendation: true,
    recommendedVersionId: bestMatch.version.id,
    recommendedVersionName: bestMatch.version.name,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    reasons: generateReasons(bestMatch.version, bestMatch.breakdown, context),
    alternatives: scoredVersions
      .slice(1, 4)
      .map((sv) => createAlternative(sv.version, sv.breakdown, bestMatch.breakdown)),
    suggestions: generateSuggestionsFromProfileScore(bestMatch.version, profileScore),
    shareUrl,
  };

  return decision;
}

/**
 * Convert ProfileScore to CompletenessData for backward compatibility
 */
function convertProfileScoreToCompletenessData(profileScore: ProfileScore): CompletenessData {
  return {
    hasPhoto: profileScore.completenessBreakdown.basics >= 7,
    hasHeadline: profileScore.completenessBreakdown.basics >= 14,
    hasBio: profileScore.completenessBreakdown.basics >= 20,
    hasExperience: profileScore.completenessBreakdown.experience > 0,
    hasEducation: profileScore.completenessBreakdown.education > 0,
    hasSkills: profileScore.completenessBreakdown.skills > 0,
    skillCount: Math.round(profileScore.completenessBreakdown.skills / 4), // Reverse calculate
    experienceCount: Math.round(profileScore.completenessBreakdown.experience / 12.5),
    overallScore: profileScore.completeness / 100,
  };
}

/**
 * Generate suggestions from ProfileScore service
 */
function generateSuggestionsFromProfileScore(
  version: ProfileVersion,
  profileScore: ProfileScore
): ActionItem[] {
  // Use top suggestions from profile score
  // Map profile-score suggestion types to share-decision ActionItem types
  return profileScore.suggestions.slice(0, 3).map((s) => ({
    type: s.type as ActionItem['type'], // 'add' | 'improve' | 'highlight'
    message: s.message,
    targetBlock: s.target,
  }));
}

// =============================================================================
// VERSION SCORING
// =============================================================================

interface CompletenessData {
  hasPhoto: boolean;
  hasHeadline: boolean;
  hasBio: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  skillCount: number;
  experienceCount: number;
  overallScore: number;
}

/**
 * Score a version based on the share context
 */
function scoreVersion(
  version: ProfileVersion,
  context: ShareContext,
  completeness: CompletenessData
): VersionScoreBreakdown {
  const contextFit = calculateContextFit(version, context);
  const signalRelevance = calculateSignalRelevance(version, context);
  const completenessScore = calculateCompletenessScore(version, completeness);
  const trustScore = calculateTrustScore(version, completeness);

  const totalScore =
    contextFit * SCORE_WEIGHTS.contextFit +
    signalRelevance * SCORE_WEIGHTS.signalRelevance +
    completenessScore * SCORE_WEIGHTS.completeness +
    trustScore * SCORE_WEIGHTS.trustScore;

  return {
    versionId: version.id,
    contextFit,
    signalRelevance,
    completeness: completenessScore,
    trustScore,
    totalScore,
  };
}

/**
 * Calculate context fit score (0-1)
 * How well does the version's context match the share intent?
 */
function calculateContextFit(version: ProfileVersion, context: ShareContext): number {
  let score = 0;

  // Check intent match
  const preferredContexts = INTENT_TO_CONTEXT[context.intent] || [];
  const intentIndex = preferredContexts.indexOf(version.context);
  if (intentIndex === 0) {
    score += 0.6; // Perfect match
  } else if (intentIndex > 0) {
    score += 0.4; // Secondary match
  }

  // Check audience match (if provided)
  if (context.audienceType) {
    const audienceContexts = AUDIENCE_TO_CONTEXT[context.audienceType] || [];
    const audienceIndex = audienceContexts.indexOf(version.context);
    if (audienceIndex === 0) {
      score += 0.4;
    } else if (audienceIndex > 0) {
      score += 0.2;
    }
  } else {
    // No audience specified, give partial credit
    score += 0.2;
  }

  // Bonus for default version when context is 'public'
  if (version.is_default && version.context === 'public') {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Calculate signal relevance score (0-1)
 * How relevant are the emphasized items for this context?
 */
function calculateSignalRelevance(version: ProfileVersion, context: ShareContext): number {
  let score = 0.5; // Base score

  // Check emphasis rules
  const emphasisRules = version.emphasis_rules || [];
  if (emphasisRules.length > 0) {
    // More emphasis rules = more curated = better
    score += Math.min(0.3, emphasisRules.length * 0.1);
  }

  // Check visibility rules
  const visibilityRules = version.visibility_rules || [];
  const hasHiddenBlocks = visibilityRules.some((r) => r.mode === 'hide');
  const hasLimitedBlocks = visibilityRules.some((r) => r.mode === 'limited');

  // Hiding/limiting content shows intentional curation
  if (hasHiddenBlocks || hasLimitedBlocks) {
    score += 0.2;
  }

  // Context-specific bonuses
  if (context.intent === 'pitch' && version.context === 'investor') {
    score += 0.2;
  }
  if (context.intent === 'collaborate' && version.context === 'team') {
    score += 0.2;
  }
  if (context.audienceType === 'recruiter' && version.context === 'job') {
    score += 0.2;
  }

  return Math.min(1, score);
}

/**
 * Calculate completeness score (0-1)
 * How complete is the profile for this version's context?
 */
function calculateCompletenessScore(
  version: ProfileVersion,
  completeness: CompletenessData
): number {
  // Base on overall completeness
  let score = completeness.overallScore;

  // Adjust based on what's hidden
  const visibilityRules = version.visibility_rules || [];
  const hiddenBlocks = visibilityRules
    .filter((r) => r.mode === 'hide')
    .map((r) => r.block);

  // If incomplete sections are hidden, that's smart!
  if (!completeness.hasEducation && hiddenBlocks.includes('education')) {
    score += 0.1;
  }
  if (completeness.skillCount < 3 && hiddenBlocks.includes('skills')) {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Calculate trust score (0-1)
 * Based on profile completeness and version usage
 */
function calculateTrustScore(version: ProfileVersion, completeness: CompletenessData): number {
  let score = 0;

  // Photo adds trust
  if (completeness.hasPhoto) score += 0.3;

  // Complete bio adds trust
  if (completeness.hasBio) score += 0.2;

  // Experience adds trust
  if (completeness.hasExperience) score += 0.2;

  // Version has been used before (view count)
  if (version.view_count > 0) {
    score += Math.min(0.3, version.view_count * 0.05);
  }

  return Math.min(1, score);
}

// =============================================================================
// PROFILE COMPLETENESS (Now using ProfileScore service)
// =============================================================================
// Note: Profile completeness data is now obtained from the unified ProfileScore service
// via convertProfileScoreToCompletenessData() function above.

// =============================================================================
// REASON GENERATION (Explainability)
// =============================================================================

/**
 * Generate reasons for the recommendation
 */
function generateReasons(
  version: ProfileVersion,
  breakdown: VersionScoreBreakdown,
  context: ShareContext
): DecisionReason[] {
  const reasons: DecisionReason[] = [];

  // Context match reason
  if (breakdown.contextFit >= 0.6) {
    reasons.push({
      type: 'context_match',
      message: getContextMatchMessage(version.context, context.intent),
    });
  }

  // Signal strength reason
  if (breakdown.signalRelevance >= 0.6) {
    reasons.push({
      type: 'signal_strength',
      message: getSignalStrengthMessage(version),
    });
  }

  // Simplicity reason (if content is hidden)
  const hiddenCount = (version.visibility_rules || []).filter(
    (r) => r.mode === 'hide'
  ).length;
  if (hiddenCount > 0) {
    reasons.push({
      type: 'simplicity',
      message: 'اطلاعات غیرمرتبط حذف شده تا سریع‌تر دیده شوید',
    });
  }

  // Trust reason
  if (breakdown.trustScore >= 0.6) {
    reasons.push({
      type: 'trust',
      message: 'این نسخه اعتمادسازی بهتری دارد',
    });
  }

  // Ensure at least one reason
  if (reasons.length === 0) {
    reasons.push({
      type: 'context_match',
      message: 'این نسخه برای این موقعیت مناسب‌تر است',
    });
  }

  return reasons.slice(0, 3); // Max 3 reasons
}

/**
 * Get context match message
 */
function getContextMatchMessage(
  versionContext: ProfileVersionContext,
  intent: ShareIntent
): string {
  const messages: Record<ProfileVersionContext, Record<ShareIntent, string>> = {
    public: {
      introduce: 'این نسخه برای معرفی عمومی طراحی شده',
      network: 'نسخه عمومی برای شبکه‌سازی اولیه مناسب است',
      collaborate: 'این نسخه دید کلی خوبی می‌ده',
      pitch: 'نسخه عمومی پایه خوبی برای ارائه است',
      discover: 'این نسخه برای دیده شدن بهینه شده',
    },
    network: {
      introduce: 'تمرکز روی ارتباط‌سازی اولیه',
      network: 'این نسخه برای شبکه‌سازی طراحی شده',
      collaborate: 'مهارت‌های مشارکتی پررنگ شده‌اند',
      pitch: 'ارتباطات حرفه‌ای برجسته شده‌اند',
      discover: 'اطلاعات کلیدی برای ارتباط‌سازی نمایش داده می‌شود',
    },
    team: {
      introduce: 'این نسخه برای معرفی به تیم‌ها طراحی شده',
      network: 'پروژه‌های تیمی پررنگ شده‌اند',
      collaborate: 'تمرکز روی همکاری و کار تیمی',
      pitch: 'توانایی‌های تیمی برجسته شده‌اند',
      discover: 'مهارت‌های مشارکتی نمایش داده می‌شود',
    },
    investor: {
      introduce: 'این نسخه برای سرمایه‌گذاران طراحی شده',
      network: 'دستاوردهای کلیدی پررنگ شده‌اند',
      collaborate: 'سوابق اجرایی برجسته شده‌اند',
      pitch: 'این نسخه برای ارائه به سرمایه‌گذار بهینه شده',
      discover: 'تجربیات رهبری نمایش داده می‌شود',
    },
    job: {
      introduce: 'سوابق حرفه‌ای پررنگ شده‌اند',
      network: 'مهارت‌های شغلی برجسته شده‌اند',
      collaborate: 'تجربیات کاری مرتبط نمایش داده می‌شود',
      pitch: 'دستاوردهای حرفه‌ای پررنگ شده‌اند',
      discover: 'این نسخه برای فرصت‌های شغلی بهینه شده',
    },
    custom: {
      introduce: 'این نسخه سفارشی شماست',
      network: 'تنظیمات سفارشی شما اعمال شده',
      collaborate: 'محتوای انتخابی شما نمایش داده می‌شود',
      pitch: 'ارائه سفارشی شما',
      discover: 'نمایش سفارشی شما',
    },
  };

  return messages[versionContext]?.[intent] || 'این نسخه برای این موقعیت مناسب است';
}

/**
 * Get signal strength message
 */
function getSignalStrengthMessage(version: ProfileVersion): string {
  const emphasisRules = version.emphasis_rules || [];
  const hasSkillEmphasis = emphasisRules.some((r) => r.targetType === 'skill');
  const hasExperienceEmphasis = emphasisRules.some((r) => r.targetType === 'experience');
  const hasProjectEmphasis = emphasisRules.some((r) => r.targetType === 'project');

  if (hasProjectEmphasis) {
    return 'پروژه‌های کلیدی پررنگ شده‌اند';
  }
  if (hasSkillEmphasis) {
    return 'مهارت‌های مهم برجسته شده‌اند';
  }
  if (hasExperienceEmphasis) {
    return 'تجربیات مرتبط پررنگ شده‌اند';
  }

  return 'سیگنال‌های قوی شما برجسته شده‌اند';
}

// =============================================================================
// SUGGESTION GENERATION (Now using ProfileScore service)
// =============================================================================
// Note: Suggestions are now generated from the unified ProfileScore service
// via generateSuggestionsFromProfileScore() function above.

// =============================================================================
// ALTERNATIVE VERSIONS
// =============================================================================

/**
 * Create alternative version info
 */
function createAlternative(
  version: ProfileVersion,
  breakdown: VersionScoreBreakdown,
  bestBreakdown: VersionScoreBreakdown
): AlternativeVersion {
  let whyNot: string | undefined;

  if (breakdown.contextFit < bestBreakdown.contextFit - 0.2) {
    whyNot = 'تطابق کمتر با موقعیت';
  } else if (breakdown.completeness < bestBreakdown.completeness - 0.2) {
    whyNot = 'کامل‌تر نیست';
  } else if (breakdown.signalRelevance < bestBreakdown.signalRelevance - 0.2) {
    whyNot = 'سیگنال‌های کمتر مرتبط';
  }

  return {
    versionId: version.id,
    versionName: version.name,
    score: Math.round(breakdown.totalScore * 100),
    whyNot,
  };
}

// =============================================================================
// FALLBACK (No suitable version)
// =============================================================================

/**
 * Create fallback response when no suitable version exists
 */
function createNoVersionFallback(
  context: ShareContext,
  profileId: string
): NoVersionFallback {
  const suggestedContext = getSuggestedContext(context);

  return {
    hasRecommendation: false,
    suggestedContext,
    createVersionUrl: `/dashboard/profiles/${profileId}/versions/new?context=${suggestedContext}`,
    message: getNoVersionMessage(context.intent),
  };
}

/**
 * Get suggested context based on share intent
 */
function getSuggestedContext(context: ShareContext): string {
  // Priority: audience > intent
  if (context.audienceType) {
    const audienceContexts = AUDIENCE_TO_CONTEXT[context.audienceType];
    if (audienceContexts?.length > 0) {
      return audienceContexts[0];
    }
  }

  const intentContexts = INTENT_TO_CONTEXT[context.intent];
  return intentContexts?.[0] || 'public';
}

/**
 * Get message for no version fallback
 */
function getNoVersionMessage(intent: ShareIntent): string {
  const messages: Record<ShareIntent, string> = {
    introduce: 'برای معرفی بهتر، یک نسخه مناسب بسازید',
    network: 'برای شبکه‌سازی مؤثر، یک نسخه شبکه‌سازی بسازید',
    collaborate: 'برای همکاری، یک نسخه تیمی بسازید',
    pitch: 'برای ارائه به سرمایه‌گذار، یک نسخه مخصوص بسازید',
    discover: 'برای دیده شدن بهتر، یک نسخه عمومی بسازید',
  };

  return messages[intent] || 'نسخه مناسبی یافت نشد';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all versions with scores for a profile
 * Useful for showing all options to user
 */
export async function getAllVersionsWithScores(
  profileId: string,
  context: ShareContext
): Promise<Array<{ version: ProfileVersion; score: number; breakdown: VersionScoreBreakdown }>> {
  const versions = await getProfileVersions(profileId);
  const profileScore = await calculateProfileScore(profileId);
  const completeness = convertProfileScoreToCompletenessData(profileScore);

  return versions.map((version) => {
    const breakdown = scoreVersion(version, context, completeness);
    return {
      version,
      score: Math.round(breakdown.totalScore * 100),
      breakdown,
    };
  });
}

/**
 * Quick share - get the best version for a simple share
 * Uses 'introduce' intent and 'link' channel as defaults
 */
export async function getQuickShareDecision(
  profileId: string,
  profileSlug: string
): Promise<ShareDecisionResponse> {
  return getShareDecision(profileId, profileSlug, {
    intent: 'introduce',
    channel: 'link',
  });
}
