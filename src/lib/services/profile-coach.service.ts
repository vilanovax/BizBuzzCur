/**
 * AI Profile Coach Service
 *
 * Built on: Versioning + Share Decisions + Analytics + Profile Scores
 *
 * Coach answers:
 * «الان مهم‌ترین کاری که می‌تونی برای قوی‌تر شدن هویتت انجام بدی چیه؟ و چرا؟»
 *
 * Core Logic:
 * - Low Strength? → Fix weakest block
 * - High Share but Low Engagement? → Adjust emphasis / hide noise
 * - High Engagement? → Reinforce winning signals
 *
 * Key Principle: ONE clear recommendation at a time, with evidence.
 */

import { v4 as uuidv4 } from 'uuid';
import { calculateProfileScore } from './profile-score.service';
import { getProfileVersions } from './profile-version.service';
import type { ProfileScore, ScoreSuggestion, ProfileBlock } from '@/types/profile-score';
import type { ProfileVersion, ProfileVersionContext } from '@/types/profile-version';
import type {
  CoachInput,
  CoachResponse,
  CoachAdvice,
  CoachEvidence,
  CoachRecommendedAction,
  CoachGoal,
  CoachMode,
  CoachTrigger,
  CoachPriority,
  WeeklyCoachReport,
} from '@/types/profile-coach';
import {
  GOAL_FOCUS_AREAS,
  CONTEXT_FOCUS_AREAS,
  PRIORITY_THRESHOLDS,
} from '@/types/profile-coach';
import { PROFILE_BLOCK_LABELS } from '@/types/profile-score';

// =============================================================================
// MAIN COACH FUNCTION
// =============================================================================

/**
 * Get coach advice for a profile
 */
export async function getCoachAdvice(input: CoachInput): Promise<CoachResponse> {
  const { profileId, mode, trigger, userGoal, recentShareContext } = input;

  // Get profile data
  const profileScore = await calculateProfileScore(profileId);
  const versions = await getProfileVersions(profileId);

  // Determine focus areas based on context
  const focusAreas = determineFocusAreas(userGoal, recentShareContext?.intent);

  // Generate advice based on mode
  const advice = generateAdvice(profileScore, versions, focusAreas, mode, trigger);

  // Determine trend (simplified - would need historical data in production)
  const trend = determineTrend(profileScore);

  return {
    mode,
    trigger,
    advice,
    profileHealthSummary: {
      completeness: profileScore.completeness,
      strength: profileScore.strength,
      trend,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get instant coach advice (pre-share or post-share)
 */
export async function getInstantCoachAdvice(
  profileId: string,
  trigger: 'pre_share' | 'post_share',
  shareContext?: { intent: string; audienceType?: string; versionId?: string }
): Promise<CoachResponse> {
  return getCoachAdvice({
    profileId,
    mode: 'instant',
    trigger,
    recentShareContext: shareContext,
  });
}

/**
 * Get goal-based coach advice
 */
export async function getGoalBasedCoachAdvice(
  profileId: string,
  goal: CoachGoal
): Promise<CoachResponse> {
  return getCoachAdvice({
    profileId,
    mode: 'goal_based',
    trigger: 'goal_set',
    userGoal: goal,
  });
}

/**
 * Get weekly coach report (Premium)
 */
export async function getWeeklyCoachReport(
  profileId: string
): Promise<WeeklyCoachReport> {
  const profileScore = await calculateProfileScore(profileId);
  const versions = await getProfileVersions(profileId);

  // Calculate period
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  // Analyze strengths
  const strengths = analyzeStrengths(profileScore);

  // Analyze improvements
  const improvements = analyzeImprovements(profileScore);

  // Get top recommendation
  const focusAreas = determineFocusAreas('growth', undefined);
  const topRecommendation = generateAdvice(
    profileScore,
    versions,
    focusAreas,
    'weekly',
    'weekly_digest'
  );

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    strengths,
    improvements,
    topRecommendation,
    stats: {
      sharesThisWeek: 0, // Would need analytics data
      viewsThisWeek: 0,  // Would need analytics data
      strengthChange: 0, // Would need historical data
      completenessChange: 0,
    },
  };
}

// =============================================================================
// FOCUS AREA DETERMINATION
// =============================================================================

/**
 * Determine which areas to focus on
 */
function determineFocusAreas(
  goal?: CoachGoal,
  shareIntent?: string
): ProfileBlock[] {
  // Goal takes priority
  if (goal) {
    return GOAL_FOCUS_AREAS[goal];
  }

  // Map share intent to context
  if (shareIntent) {
    const contextMap: Record<string, ProfileVersionContext> = {
      introduce: 'public',
      network: 'network',
      collaborate: 'team',
      pitch: 'investor',
      discover: 'job',
    };
    const context = contextMap[shareIntent] || 'public';
    return CONTEXT_FOCUS_AREAS[context];
  }

  // Default: general growth
  return GOAL_FOCUS_AREAS.growth;
}

// =============================================================================
// ADVICE GENERATION
// =============================================================================

/**
 * Generate single advice based on profile state
 */
function generateAdvice(
  profileScore: ProfileScore,
  versions: ProfileVersion[],
  focusAreas: ProfileBlock[],
  mode: CoachMode,
  trigger: CoachTrigger
): CoachAdvice {
  // Decision tree logic
  const { completeness, strength, suggestions } = profileScore;

  // Find the best suggestion that matches focus areas
  let bestSuggestion: ScoreSuggestion | undefined;

  // First, try to find a suggestion in focus areas
  for (const area of focusAreas) {
    const match = suggestions.find((s) => s.target === area);
    if (match) {
      bestSuggestion = match;
      break;
    }
  }

  // If no match in focus areas, use the top suggestion
  if (!bestSuggestion && suggestions.length > 0) {
    bestSuggestion = suggestions[0];
  }

  // Generate advice based on the situation
  if (strength < 50) {
    // Low strength: Fix weakest block
    return createAdviceFromSuggestion(
      bestSuggestion || createDefaultSuggestion('headline'),
      'score',
      `قدرت پروفایل شما ${strength}٪ است - بهبود این بخش تأثیر زیادی داره`,
      determinePriority(bestSuggestion?.estimatedGain || 5, strength)
    );
  }

  if (completeness < 70) {
    // Low completeness: Add missing pieces
    return createAdviceFromSuggestion(
      bestSuggestion || createDefaultSuggestion('skills'),
      'score',
      `پروفایل شما ${completeness}٪ کامل است - تکمیل این بخش ضروریه`,
      determinePriority(bestSuggestion?.estimatedGain || 5, completeness)
    );
  }

  // Good profile: Reinforce or optimize
  if (bestSuggestion) {
    return createAdviceFromSuggestion(
      bestSuggestion,
      'context',
      'برای تأثیرگذاری بیشتر، این بهبود رو پیشنهاد می‌کنیم',
      'medium'
    );
  }

  // Excellent profile: Version optimization
  return createVersionAdvice(versions, strength);
}

/**
 * Create advice from a suggestion
 */
function createAdviceFromSuggestion(
  suggestion: ScoreSuggestion,
  evidenceSource: 'score' | 'analytics' | 'context',
  evidenceMessage: string,
  priority: CoachPriority
): CoachAdvice {
  return {
    id: uuidv4(),
    focusArea: suggestion.target,
    focusAreaLabel: PROFILE_BLOCK_LABELS[suggestion.target] || suggestion.target,
    priority,
    explanation: suggestion.message,
    recommendedAction: {
      type: suggestion.type,
      target: suggestion.target,
      targetLabel: PROFILE_BLOCK_LABELS[suggestion.target] || suggestion.target,
      expectedImpact: suggestion.estimatedGain,
    },
    evidence: [
      {
        source: evidenceSource,
        message: evidenceMessage,
      },
    ],
  };
}

/**
 * Create default suggestion when none available
 */
function createDefaultSuggestion(target: ProfileBlock): ScoreSuggestion {
  const defaults: Record<ProfileBlock, ScoreSuggestion> = {
    headline: {
      type: 'improve',
      target: 'headline',
      impact: 'high',
      estimatedGain: 7,
      message: 'تیتر واضح‌تر و حرفه‌ای‌تر بنویسید',
      priority: 1,
    },
    bio: {
      type: 'improve',
      target: 'bio',
      impact: 'medium',
      estimatedGain: 6,
      message: 'معرفی خود را بهتر و کامل‌تر کنید',
      priority: 2,
    },
    skills: {
      type: 'add',
      target: 'skills',
      impact: 'high',
      estimatedGain: 8,
      message: 'مهارت‌های بیشتری اضافه کنید',
      priority: 3,
    },
    photo: {
      type: 'add',
      target: 'photo',
      impact: 'high',
      estimatedGain: 7,
      message: 'عکس پروفایل حرفه‌ای اضافه کنید',
      priority: 1,
    },
    experience: {
      type: 'add',
      target: 'experience',
      impact: 'high',
      estimatedGain: 12,
      message: 'سوابق کاری خود را اضافه کنید',
      priority: 4,
    },
    projects: {
      type: 'add',
      target: 'projects',
      impact: 'medium',
      estimatedGain: 10,
      message: 'پروژه‌های نمونه اضافه کنید',
      priority: 5,
    },
    education: {
      type: 'add',
      target: 'education',
      impact: 'low',
      estimatedGain: 5,
      message: 'تحصیلات خود را اضافه کنید',
      priority: 6,
    },
    social: {
      type: 'add',
      target: 'social',
      impact: 'medium',
      estimatedGain: 5,
      message: 'لینک شبکه‌های اجتماعی اضافه کنید',
      priority: 7,
    },
    contact: {
      type: 'add',
      target: 'contact',
      impact: 'low',
      estimatedGain: 3,
      message: 'اطلاعات تماس اضافه کنید',
      priority: 8,
    },
    basics: {
      type: 'improve',
      target: 'basics',
      impact: 'high',
      estimatedGain: 10,
      message: 'اطلاعات پایه را تکمیل کنید',
      priority: 1,
    },
    activity: {
      type: 'improve',
      target: 'activity',
      impact: 'low',
      estimatedGain: 3,
      message: 'فعالیت بیشتری در پلتفرم داشته باشید',
      priority: 9,
    },
  };

  return defaults[target] || defaults.headline;
}

/**
 * Create advice for version optimization
 */
function createVersionAdvice(
  versions: ProfileVersion[],
  strength: number
): CoachAdvice {
  // Find the weakest version context
  const contextScores = versions.map((v) => ({
    version: v,
    viewCount: v.view_count,
  }));

  // Find least used version
  const leastUsed = contextScores.sort((a, b) => a.viewCount - b.viewCount)[0];

  if (leastUsed && leastUsed.viewCount === 0) {
    return {
      id: uuidv4(),
      focusArea: 'skills', // Generic
      focusAreaLabel: 'نسخه‌ها',
      priority: 'low',
      explanation: `نسخه "${leastUsed.version.name}" هنوز استفاده نشده - آیا این نسخه نیاز به بهبود داره؟`,
      recommendedAction: {
        type: 'improve',
        target: leastUsed.version.id,
        targetLabel: leastUsed.version.name,
        expectedImpact: 5,
      },
      evidence: [
        {
          source: 'analytics',
          message: 'این نسخه هنوز مشاهده‌ای نداشته',
        },
      ],
    };
  }

  // Profile is great!
  return {
    id: uuidv4(),
    focusArea: 'headline',
    focusAreaLabel: 'پروفایل',
    priority: 'low',
    explanation: 'پروفایل شما در وضعیت خوبی است! همین‌طور ادامه بده.',
    recommendedAction: {
      type: 'highlight',
      target: 'skills',
      targetLabel: 'مهارت‌ها',
      expectedImpact: 2,
    },
    evidence: [
      {
        source: 'score',
        message: `قدرت پروفایل: ${strength}٪`,
      },
    ],
  };
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze profile strengths
 */
function analyzeStrengths(
  profileScore: ProfileScore
): Array<{ area: ProfileBlock; message: string }> {
  const strengths: Array<{ area: ProfileBlock; message: string }> = [];
  const breakdown = profileScore.strengthBreakdown;

  if (breakdown.clarity >= 20) {
    strengths.push({
      area: 'headline',
      message: 'روایت شغلی واضح و حرفه‌ای',
    });
  }

  if (breakdown.depth >= 20) {
    strengths.push({
      area: 'experience',
      message: 'عمق تجربه و مهارت‌ها',
    });
  }

  if (breakdown.trust >= 12) {
    strengths.push({
      area: 'photo',
      message: 'اعتمادسازی خوب',
    });
  }

  if (breakdown.differentiation >= 12) {
    strengths.push({
      area: 'bio',
      message: 'تمایز و خاص بودن',
    });
  }

  return strengths.slice(0, 3);
}

/**
 * Analyze areas needing improvement
 */
function analyzeImprovements(
  profileScore: ProfileScore
): Array<{ area: ProfileBlock; message: string; priority: CoachPriority }> {
  const improvements: Array<{ area: ProfileBlock; message: string; priority: CoachPriority }> = [];
  const breakdown = profileScore.strengthBreakdown;

  if (breakdown.clarity < 15) {
    improvements.push({
      area: 'headline',
      message: 'وضوح روایت نیاز به بهبود دارد',
      priority: 'high',
    });
  }

  if (breakdown.depth < 15) {
    improvements.push({
      area: 'experience',
      message: 'عمق تجربه کافی نیست',
      priority: 'high',
    });
  }

  if (breakdown.trust < 10) {
    improvements.push({
      area: 'photo',
      message: 'اعتمادسازی ضعیف است',
      priority: 'medium',
    });
  }

  if (breakdown.differentiation < 10) {
    improvements.push({
      area: 'bio',
      message: 'تمایز شخصی ضعیف است',
      priority: 'medium',
    });
  }

  if (breakdown.consistency < 15) {
    improvements.push({
      area: 'skills',
      message: 'انسجام بین مهارت‌ها و تجربه‌ها',
      priority: 'low',
    });
  }

  return improvements.slice(0, 3);
}

/**
 * Determine priority based on impact and current score
 */
function determinePriority(impact: number, currentScore: number): CoachPriority {
  if (impact >= PRIORITY_THRESHOLDS.high.minImpact && currentScore <= PRIORITY_THRESHOLDS.high.maxStrength) {
    return 'high';
  }
  if (impact >= PRIORITY_THRESHOLDS.medium.minImpact && currentScore <= PRIORITY_THRESHOLDS.medium.maxStrength) {
    return 'medium';
  }
  return 'low';
}

/**
 * Determine trend (simplified)
 */
function determineTrend(profileScore: ProfileScore): 'up' | 'stable' | 'down' {
  // In production, this would compare with historical data
  // For now, return stable
  const avgScore = (profileScore.completeness + profileScore.strength) / 2;

  if (avgScore >= 70) return 'up';
  if (avgScore >= 40) return 'stable';
  return 'down';
}
