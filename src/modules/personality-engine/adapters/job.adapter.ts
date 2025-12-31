/**
 * Job Adapter
 *
 * Transforms job-related data between BizBuzz and the engine.
 * Used for job matching and relevance explanations.
 */

import type { Signal, SignalId } from '../contracts/signal.schema';

/**
 * Job requirements expressed as signal expectations
 */
export interface JobSignalRequirement {
  signalId: SignalId;
  /** Expected value direction (-1 to 1) */
  expectedValue: number;
  /** How important this requirement is (0-1) */
  weight: number;
  /** Why this matters for the job */
  reason?: string;
}

/**
 * Result of matching a candidate to a job
 */
export interface JobMatchResult {
  /** Overall match score (0-100) */
  overallScore: number;
  /** Individual signal matches */
  signalMatches: SignalMatch[];
  /** Top reasons why this is a good match */
  strengthReasons: string[];
  /** Potential areas of friction */
  frictionReasons: string[];
  /** Confidence in the match (0-1) */
  confidence: number;
}

export interface SignalMatch {
  signalId: SignalId;
  /** Candidate's signal value */
  candidateValue: number;
  /** Job's expected value */
  expectedValue: number;
  /** How well they match (0-100) */
  matchScore: number;
  /** Weight of this signal for the job */
  weight: number;
}

/**
 * Job types with default signal requirements
 */
export type JobArchetype =
  | 'leadership'
  | 'creative'
  | 'analytical'
  | 'support'
  | 'sales'
  | 'operations';

/**
 * Default signal requirements for job archetypes
 */
const JOB_ARCHETYPES: Record<JobArchetype, JobSignalRequirement[]> = {
  leadership: [
    { signalId: 'leadership_tendency', expectedValue: 0.7, weight: 1.0 },
    { signalId: 'decision_style', expectedValue: 0.3, weight: 0.7 },
    { signalId: 'risk_tolerance', expectedValue: 0.4, weight: 0.6 },
    { signalId: 'communication_style', expectedValue: 0.5, weight: 0.5 },
  ],
  creative: [
    { signalId: 'structure_preference', expectedValue: -0.5, weight: 0.8 },
    { signalId: 'autonomy_need', expectedValue: 0.6, weight: 0.7 },
    { signalId: 'risk_tolerance', expectedValue: 0.4, weight: 0.5 },
    { signalId: 'routine_preference', expectedValue: -0.6, weight: 0.6 },
  ],
  analytical: [
    { signalId: 'decision_style', expectedValue: 0.7, weight: 1.0 },
    { signalId: 'detail_orientation', expectedValue: 0.6, weight: 0.8 },
    { signalId: 'structure_preference', expectedValue: 0.5, weight: 0.6 },
    { signalId: 'task_approach', expectedValue: 0.4, weight: 0.5 },
  ],
  support: [
    { signalId: 'collaboration_style', expectedValue: 0.7, weight: 1.0 },
    { signalId: 'conflict_approach', expectedValue: -0.4, weight: 0.7 },
    { signalId: 'communication_style', expectedValue: -0.3, weight: 0.6 },
    { signalId: 'social_energy', expectedValue: 0.5, weight: 0.5 },
  ],
  sales: [
    { signalId: 'social_energy', expectedValue: 0.7, weight: 1.0 },
    { signalId: 'risk_tolerance', expectedValue: 0.5, weight: 0.7 },
    { signalId: 'achievement_drive', expectedValue: 0.6, weight: 0.8 },
    { signalId: 'communication_style', expectedValue: 0.4, weight: 0.6 },
  ],
  operations: [
    { signalId: 'structure_preference', expectedValue: 0.7, weight: 1.0 },
    { signalId: 'detail_orientation', expectedValue: 0.6, weight: 0.8 },
    { signalId: 'routine_preference', expectedValue: 0.5, weight: 0.7 },
    { signalId: 'pace_preference', expectedValue: 0.3, weight: 0.5 },
  ],
};

/**
 * Adapter for job-related transformations
 */
export const JobAdapter = {
  /**
   * Get default signal requirements for a job archetype
   */
  getArchetypeRequirements(archetype: JobArchetype): JobSignalRequirement[] {
    return JOB_ARCHETYPES[archetype] || [];
  },

  /**
   * Match a candidate's signals against job requirements
   */
  matchCandidateToJob(
    candidateSignals: Signal[],
    requirements: JobSignalRequirement[]
  ): JobMatchResult {
    const signalMap = new Map(candidateSignals.map((s) => [s.id, s]));
    const signalMatches: SignalMatch[] = [];
    const strengthReasons: string[] = [];
    const frictionReasons: string[] = [];

    let totalWeight = 0;
    let weightedScore = 0;
    let totalConfidence = 0;

    for (const req of requirements) {
      const candidateSignal = signalMap.get(req.signalId);
      if (!candidateSignal) continue;

      const matchScore = calculateMatchScore(
        candidateSignal.value,
        req.expectedValue
      );

      signalMatches.push({
        signalId: req.signalId,
        candidateValue: candidateSignal.value,
        expectedValue: req.expectedValue,
        matchScore,
        weight: req.weight,
      });

      // Confidence-adjusted scoring:
      // High confidence (>0.7) = full weight
      // Medium confidence (0.4-0.7) = 80% weight
      // Low confidence (<0.4) = 60% weight
      const confidenceMultiplier =
        candidateSignal.confidence >= 0.7 ? 1.0 :
        candidateSignal.confidence >= 0.4 ? 0.8 : 0.6;

      weightedScore += matchScore * req.weight * confidenceMultiplier;
      totalWeight += req.weight * confidenceMultiplier;
      totalConfidence += candidateSignal.confidence;

      // Generate reasons
      if (matchScore >= 70) {
        const reason = generateStrengthReason(req.signalId, matchScore);
        if (reason) strengthReasons.push(reason);
      } else if (matchScore < 40) {
        const reason = generateFrictionReason(req.signalId, matchScore);
        if (reason) frictionReasons.push(reason);
      }
    }

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const confidence = signalMatches.length > 0 ? totalConfidence / signalMatches.length : 0;

    return {
      overallScore,
      signalMatches,
      strengthReasons: strengthReasons.slice(0, 3),
      frictionReasons: frictionReasons.slice(0, 2),
      confidence,
    };
  },

  /**
   * Generate a "Why this job?" explanation
   *
   * Microcopy rules:
   * - Never expose exact percentages to users
   * - Human-readable, professional tone
   * - Focus on fit, not scores
   */
  generateMatchExplanation(matchResult: JobMatchResult): string {
    if (matchResult.overallScore >= 80) {
      return matchResult.strengthReasons[0] || 'سبک کاری شما با این نقش همخوانی بالایی دارد';
    }
    if (matchResult.overallScore >= 60) {
      return matchResult.strengthReasons[0] || 'ویژگی‌های کاری شما با نیازهای این نقش همخوانی دارد';
    }
    if (matchResult.overallScore >= 40) {
      return 'این موقعیت می‌تواند تجربه جدیدی برای شما باشد';
    }
    return 'این موقعیت می‌تواند چالش‌های رشد جدیدی برای شما ایجاد کند';
  },
};

/**
 * Calculate how well a candidate value matches the expected value
 * Returns 0-100
 *
 * Uses tiered matching:
 * - Exact match (within 0.2): 100
 * - Adjacent match (within 0.5): 70
 * - Moderate distance (within 1.0): 40
 * - Far: 20
 */
function calculateMatchScore(candidateValue: number, expectedValue: number): number {
  const distance = Math.abs(candidateValue - expectedValue);

  // Exact or very close match
  if (distance <= 0.2) {
    return 100;
  }

  // Adjacent - good enough
  if (distance <= 0.5) {
    return 70;
  }

  // Moderate distance - some alignment
  if (distance <= 1.0) {
    return 40;
  }

  // Far apart
  return 20;
}

/**
 * Generate a strength reason in Persian
 *
 * Microcopy rules:
 * - Never mention tests or algorithms
 * - Positive and encouraging
 * - Specific to work context
 * - Human-readable
 */
function generateStrengthReason(signalId: SignalId, score: number): string | null {
  // Context-aware reasons that feel natural
  const reasons: Record<SignalId, string> = {
    leadership_tendency: 'توانایی هدایت و الهام‌بخشی به تیم',
    collaboration_style: 'هماهنگی خوب با کار تیمی',
    decision_style: 'رویکرد تحلیلی در تصمیم‌گیری',
    risk_tolerance: 'آمادگی برای پذیرش چالش‌های جدید',
    structure_preference: 'علاقه به کار منظم و برنامه‌ریزی‌شده',
    achievement_drive: 'انگیزه قوی برای رسیدن به اهداف',
    social_energy: 'مهارت در تعامل و ارتباط مؤثر',
    autonomy_need: 'توانایی کار مستقل و خودمدیریتی',
    detail_orientation: 'دقت بالا و توجه به جزئیات',
    pace_preference: 'سازگاری با محیط پویا و پرسرعت',
    communication_style: 'سبک ارتباطی متناسب با نقش',
    conflict_approach: 'توانایی مدیریت سازنده تعارض',
    change_adaptability: 'انعطاف در برابر تغییرات',
    task_approach: 'رویکرد متناسب به انجام وظایف',
    recognition_need: 'انگیزه مناسب برای این محیط',
    noise_tolerance: 'سازگاری با محیط کاری',
    routine_preference: 'تطابق با ماهیت کار',
  };

  return reasons[signalId] || null;
}

/**
 * Generate a friction reason in Persian
 *
 * Microcopy rules:
 * - Frame as opportunity, not blocker
 * - Never judgmental
 * - Informational only
 * - Encourage growth mindset
 */
function generateFrictionReason(signalId: SignalId, score: number): string | null {
  // Reframed as growth opportunities, not negatives
  const reasons: Record<SignalId, string> = {
    leadership_tendency: 'فرصت توسعه مهارت‌های رهبری',
    collaboration_style: 'فرصت تجربه سبک همکاری جدید',
    decision_style: 'فرصت آشنایی با رویکرد تصمیم‌گیری متفاوت',
    risk_tolerance: 'فرصت توسعه در محیط با سطح ریسک متفاوت',
    structure_preference: 'فرصت تجربه ساختار کاری جدید',
    achievement_drive: 'فرصت کشف انگیزه‌های جدید',
    social_energy: 'فرصت توسعه در محیط با سطح تعامل متفاوت',
    autonomy_need: 'فرصت تجربه سطح استقلال متفاوت',
    detail_orientation: 'فرصت تمرین رویکرد جدید به جزئیات',
    pace_preference: 'فرصت تجربه ریتم کاری جدید',
    communication_style: 'فرصت توسعه سبک ارتباطی',
    conflict_approach: 'فرصت یادگیری رویکرد جدید به تعارض',
    change_adaptability: 'فرصت تقویت انعطاف‌پذیری',
    task_approach: 'فرصت تجربه رویکرد جدید به کار',
    recognition_need: 'فرصت سازگاری با سیستم قدردانی متفاوت',
    noise_tolerance: 'فرصت تجربه محیط کاری جدید',
    routine_preference: 'فرصت تجربه تنوع/ثبات متفاوت',
  };

  return reasons[signalId] || null;
}
