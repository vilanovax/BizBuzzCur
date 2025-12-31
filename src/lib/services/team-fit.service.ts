/**
 * Team-Fit Aggregation Service
 *
 * Provides aggregated, team-level insights based on abstract work-style signals.
 *
 * This is NOT:
 * - Individual profiling
 * - Scoring people
 * - Automated hiring decisions
 *
 * This IS:
 * - Team composition insight tool
 * - Decision-support for hiring managers
 * - Aggregated and non-judgmental
 *
 * Privacy & Ethics Guardrails:
 * - No individual exposure
 * - No sensitive inference
 * - No psychological claims
 * - Must comply with fair hiring practices
 */

import type { Signal, SignalId, SignalCategory } from '@/modules/personality-engine/contracts/signal.schema';

/**
 * Minimum team size required for aggregation
 * Below this threshold, we show "limited data" notice
 */
const MIN_TEAM_SIZE = 3;

/**
 * Threshold for considering a signal as "dominant" in the team
 */
const DOMINANT_THRESHOLD = 0.3;

/**
 * Threshold for considering a signal as a "gap"
 */
const GAP_THRESHOLD = -0.2;

/**
 * Job context for team fit analysis
 */
export interface TeamFitJobContext {
  roleTitle?: string;
  teamSize?: 'solo' | 'small' | 'medium' | 'large';
  collaborationLevel?: 'low' | 'medium' | 'high';
  workMode?: 'remote' | 'onsite' | 'hybrid';
}

/**
 * Team member's aggregated signals (anonymized)
 */
export interface TeamMemberSignals {
  signals: Signal[];
  role?: string;
}

/**
 * Result of team-fit analysis
 * This is what hiring teams see
 */
export interface TeamFitResult {
  /** Whether we have enough data for meaningful insights */
  hasTeamData: boolean;
  /** Top-line team overview (one calm sentence) */
  teamOverview: string;
  /** Aggregated team strengths (2-3 max) */
  teamStrengths: string[];
  /** Balance areas, NOT weaknesses (0-2 max) */
  teamGaps: string[];
  /** How candidate may complement the team */
  candidateContribution: string;
  /** Confidence note (only if data is limited) */
  confidenceNote?: string;
  /** Team size used for analysis */
  teamSizeAnalyzed: number;
}

/**
 * Aggregated signal statistics for a team
 */
interface AggregatedSignal {
  id: SignalId;
  category: SignalCategory;
  /** Mean value across team (-1 to 1) */
  mean: number;
  /** Standard deviation (0 = uniform, high = diverse) */
  stdDev: number;
  /** Average confidence across team */
  avgConfidence: number;
  /** Number of team members with this signal */
  sampleSize: number;
}

/**
 * Signal descriptions for team context (Persian)
 */
const TEAM_SIGNAL_DESCRIPTIONS: Record<SignalId, {
  highTeam: string;
  lowTeam: string;
  candidateHigh: string;
  candidateLow: string;
}> = {
  // Work Style
  structure_preference: {
    highTeam: 'تیم به ساختار و فرآیندهای مشخص علاقه‌مند است',
    lowTeam: 'تیم انعطاف‌پذیر و سازگار با تغییرات است',
    candidateHigh: 'علاقه به کار ساختارمند که می‌تواند نظم تیم را تقویت کند',
    candidateLow: 'انعطاف‌پذیری که می‌تواند تنوع رویکرد را به تیم بیاورد',
  },
  pace_preference: {
    highTeam: 'تیم در محیط‌های پرسرعت موفق عمل می‌کند',
    lowTeam: 'تیم رویکرد متین و پایدار دارد',
    candidateHigh: 'سرعت عمل که می‌تواند انرژی تیم را افزایش دهد',
    candidateLow: 'رویکرد متین که می‌تواند عمق تحلیل را افزایش دهد',
  },
  detail_orientation: {
    highTeam: 'تیم به جزئیات و دقت توجه زیادی دارد',
    lowTeam: 'تیم تمرکز استراتژیک و کلان‌نگر دارد',
    candidateHigh: 'توجه به جزئیات که می‌تواند کیفیت خروجی را بالا ببرد',
    candidateLow: 'نگاه کلان که می‌تواند دید استراتژیک به تیم اضافه کند',
  },
  task_approach: {
    highTeam: 'تیم به تمرکز روی یک کار تا اتمام علاقه‌مند است',
    lowTeam: 'تیم توانایی مدیریت چند کار همزمان را دارد',
    candidateHigh: 'تمرکز عمیق که می‌تواند به پروژه‌های پیچیده کمک کند',
    candidateLow: 'چندوظیفگی که می‌تواند انعطاف تیم را افزایش دهد',
  },

  // Collaboration
  collaboration_style: {
    highTeam: 'تیم به همکاری نزدیک و کار گروهی علاقه‌مند است',
    lowTeam: 'تیم به کار مستقل و اتکا به خود گرایش دارد',
    candidateHigh: 'روحیه تیمی که می‌تواند همبستگی گروه را تقویت کند',
    candidateLow: 'توانایی کار مستقل که می‌تواند بار تیم را سبک کند',
  },
  communication_style: {
    highTeam: 'تیم سبک ارتباطی مستقیم و صریح دارد',
    lowTeam: 'تیم سبک ارتباطی دیپلماتیک و ملایم دارد',
    candidateHigh: 'ارتباط صریح که می‌تواند شفافیت را افزایش دهد',
    candidateLow: 'دیپلماسی که می‌تواند تعاملات را نرم‌تر کند',
  },
  conflict_approach: {
    highTeam: 'تیم به مواجهه مستقیم با چالش‌ها گرایش دارد',
    lowTeam: 'تیم به حفظ هماهنگی و جلوگیری از تنش گرایش دارد',
    candidateHigh: 'رویکرد مستقیم که می‌تواند مسائل را سریع‌تر حل کند',
    candidateLow: 'رویکرد هماهنگ‌کننده که می‌تواند آرامش تیم را حفظ کند',
  },
  leadership_tendency: {
    highTeam: 'تیم دارای افراد با گرایش رهبری است',
    lowTeam: 'تیم دارای افراد حمایت‌کننده و پشتیبان است',
    candidateHigh: 'گرایش رهبری که می‌تواند هدایت پروژه‌ها را تقویت کند',
    candidateLow: 'حمایتگری که می‌تواند به رهبران فعلی کمک کند',
  },

  // Decision Making
  decision_style: {
    highTeam: 'تیم رویکرد تحلیلی و داده‌محور دارد',
    lowTeam: 'تیم به تجربه و شهود اتکا می‌کند',
    candidateHigh: 'تحلیلگری که می‌تواند تصمیم‌گیری را مستندتر کند',
    candidateLow: 'شهود و تجربه که می‌تواند سرعت تصمیم را بالا ببرد',
  },
  risk_tolerance: {
    highTeam: 'تیم آمادگی پذیرش ریسک و چالش‌های جدید را دارد',
    lowTeam: 'تیم رویکرد محتاطانه و محافظه‌کار دارد',
    candidateHigh: 'جسارت که می‌تواند نوآوری را تشویق کند',
    candidateLow: 'احتیاط که می‌تواند ریسک‌های غیرضروری را کاهش دهد',
  },
  change_adaptability: {
    highTeam: 'تیم انعطاف بالا در مواجهه با تغییرات دارد',
    lowTeam: 'تیم به ثبات و پایداری علاقه‌مند است',
    candidateHigh: 'انعطاف‌پذیری که می‌تواند در تحولات کمک‌کننده باشد',
    candidateLow: 'ثبات که می‌تواند تداوم فرآیندها را تضمین کند',
  },

  // Motivation
  achievement_drive: {
    highTeam: 'تیم تمرکز قوی روی نتایج و دستاوردها دارد',
    lowTeam: 'تیم به فرآیند و کیفیت کار توجه دارد',
    candidateHigh: 'نتیجه‌گرایی که می‌تواند سرعت تحویل را بالا ببرد',
    candidateLow: 'فرآیندمحوری که می‌تواند کیفیت را تضمین کند',
  },
  recognition_need: {
    highTeam: 'تیم به بازخورد و قدردانی آشکار واکنش مثبت نشان می‌دهد',
    lowTeam: 'تیم انگیزه درونی قوی دارد',
    candidateHigh: 'نیاز به قدردانی که با فرهنگ تیم هماهنگ است',
    candidateLow: 'انگیزه درونی که می‌تواند ثبات عملکرد را حفظ کند',
  },
  autonomy_need: {
    highTeam: 'تیم به استقلال در کار علاقه‌مند است',
    lowTeam: 'تیم به راهنمایی و همکاری نزدیک گرایش دارد',
    candidateHigh: 'استقلال‌طلبی که با فرهنگ تیم هماهنگ است',
    candidateLow: 'آمادگی برای هماهنگی نزدیک با سایر اعضا',
  },

  // Environment
  social_energy: {
    highTeam: 'تیم از تعاملات اجتماعی انرژی می‌گیرد',
    lowTeam: 'تیم به تمرکز و آرامش نیاز دارد',
    candidateHigh: 'انرژی اجتماعی که می‌تواند روحیه تیم را بالا ببرد',
    candidateLow: 'تمرکز که می‌تواند عمق کار را افزایش دهد',
  },
  noise_tolerance: {
    highTeam: 'تیم در محیط‌های پویا و شلوغ موفق است',
    lowTeam: 'تیم محیط آرام و متمرکز را ترجیح می‌دهد',
    candidateHigh: 'سازگاری با محیط پویا که با تیم هماهنگ است',
    candidateLow: 'ترجیح تمرکز که می‌تواند کیفیت کار را بالا ببرد',
  },
  routine_preference: {
    highTeam: 'تیم به نظم و برنامه‌ریزی علاقه‌مند است',
    lowTeam: 'تیم به تنوع و تجربیات جدید علاقه‌مند است',
    candidateHigh: 'نظم‌دوستی که می‌تواند پایداری فرآیندها را تقویت کند',
    candidateLow: 'تنوع‌طلبی که می‌تواند ایده‌های جدید به تیم بیاورد',
  },
};

/**
 * Aggregate team signals
 * Returns statistical summary per signal type
 */
function aggregateTeamSignals(teamMembers: TeamMemberSignals[]): AggregatedSignal[] {
  const signalGroups: Record<SignalId, { values: number[]; confidences: number[]; category: SignalCategory }> = {} as Record<SignalId, { values: number[]; confidences: number[]; category: SignalCategory }>;

  // Collect all signal values
  for (const member of teamMembers) {
    for (const signal of member.signals) {
      if (!signalGroups[signal.id]) {
        signalGroups[signal.id] = { values: [], confidences: [], category: signal.category };
      }
      signalGroups[signal.id].values.push(signal.value);
      signalGroups[signal.id].confidences.push(signal.confidence);
    }
  }

  // Calculate statistics for each signal
  const aggregated: AggregatedSignal[] = [];

  for (const [id, group] of Object.entries(signalGroups)) {
    const n = group.values.length;
    if (n === 0) continue;

    const mean = group.values.reduce((a, b) => a + b, 0) / n;
    const variance = group.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const avgConfidence = group.confidences.reduce((a, b) => a + b, 0) / n;

    aggregated.push({
      id: id as SignalId,
      category: group.category,
      mean,
      stdDev,
      avgConfidence,
      sampleSize: n,
    });
  }

  return aggregated;
}

/**
 * Find dominant team traits (high positive mean)
 */
function findTeamStrengths(aggregated: AggregatedSignal[]): string[] {
  const strengths: string[] = [];

  // Sort by mean value (descending) with confidence weighting
  const sorted = [...aggregated]
    .filter(s => s.avgConfidence > 0.4) // Only consider confident signals
    .sort((a, b) => (b.mean * b.avgConfidence) - (a.mean * a.avgConfidence));

  for (const signal of sorted.slice(0, 3)) {
    if (signal.mean > DOMINANT_THRESHOLD) {
      const desc = TEAM_SIGNAL_DESCRIPTIONS[signal.id];
      if (desc) {
        strengths.push(desc.highTeam);
      }
    } else if (signal.mean < -DOMINANT_THRESHOLD) {
      const desc = TEAM_SIGNAL_DESCRIPTIONS[signal.id];
      if (desc) {
        strengths.push(desc.lowTeam);
      }
    }
  }

  return strengths.slice(0, 3);
}

/**
 * Find areas where team diversity is low (potential gaps)
 * Uses soft language - these are NOT weaknesses
 */
function findTeamGaps(aggregated: AggregatedSignal[]): string[] {
  const gaps: string[] = [];

  // Look for signals with low diversity (low stdDev) and extreme mean
  // This suggests everyone is similar in this area
  const homogeneous = aggregated
    .filter(s => s.stdDev < 0.3 && Math.abs(s.mean) > 0.4 && s.avgConfidence > 0.4)
    .slice(0, 2);

  for (const signal of homogeneous) {
    const desc = TEAM_SIGNAL_DESCRIPTIONS[signal.id];
    if (desc) {
      // Suggest the opposite pole as a gap
      if (signal.mean > 0) {
        gaps.push(`تنوع کمتر در ${desc.lowTeam.replace('تیم ', '')}`);
      } else {
        gaps.push(`تنوع کمتر در ${desc.highTeam.replace('تیم ', '')}`);
      }
    }
  }

  return gaps.slice(0, 2);
}

/**
 * Generate candidate contribution insight
 * Explains how candidate may complement the team
 */
function generateCandidateContribution(
  candidateSignals: Signal[],
  teamAggregated: AggregatedSignal[],
  roleContext: string
): string {
  const contributions: string[] = [];

  // Find where candidate differs from team average
  for (const candidateSignal of candidateSignals) {
    if (candidateSignal.confidence < 0.5) continue;

    const teamSignal = teamAggregated.find(t => t.id === candidateSignal.id);
    if (!teamSignal) continue;

    const diff = candidateSignal.value - teamSignal.mean;
    const desc = TEAM_SIGNAL_DESCRIPTIONS[candidateSignal.id];
    if (!desc) continue;

    // Candidate brings something different
    if (diff > 0.4 && teamSignal.mean < 0.3) {
      contributions.push(desc.candidateHigh);
    } else if (diff < -0.4 && teamSignal.mean > -0.3) {
      contributions.push(desc.candidateLow);
    }
  }

  if (contributions.length === 0) {
    return `این متقاضی ویژگی‌های کاری مشابه با تیم فعلی دارد که می‌تواند هماهنگی را تسهیل کند.`;
  }

  // Return most significant contribution
  return contributions[0];
}

/**
 * Generate team overview summary
 */
function generateTeamOverview(
  teamStrengths: string[],
  teamGaps: string[],
  teamSize: number
): string {
  if (teamStrengths.length === 0) {
    return `تیم ${teamSize} نفره با ترکیب متنوع از سبک‌های کاری.`;
  }

  const mainStrength = teamStrengths[0].replace('تیم ', '');
  if (teamGaps.length > 0) {
    const mainGap = teamGaps[0].replace('تنوع کمتر در ', '');
    return `تیم فعلی ${mainStrength}، با فرصت تنوع بیشتر در ${mainGap}.`;
  }

  return `تیم فعلی ${mainStrength}.`;
}

/**
 * Main function: Analyze team fit for a candidate
 *
 * IMPORTANT: This does NOT recommend hiring decisions.
 * It provides context for human decision-making only.
 */
export function analyzeTeamFit(
  candidateSignals: Signal[],
  teamMembers: TeamMemberSignals[],
  jobContext: TeamFitJobContext
): TeamFitResult {
  const teamSize = teamMembers.length;
  const roleContext = jobContext.roleTitle || 'این نقش';

  // Check minimum team size
  if (teamSize < MIN_TEAM_SIZE) {
    return {
      hasTeamData: false,
      teamOverview: `ترکیب تیم هنوز در حال شکل‌گیری است. مهارت‌ها و تجربیات را در نظر بگیرید.`,
      teamStrengths: [],
      teamGaps: [],
      candidateContribution: `اطلاعات کافی برای تحلیل تیمی موجود نیست.`,
      confidenceNote: 'بینش‌ها بر اساس داده‌های محدود هستند و باید به عنوان راهنمای کلی استفاده شوند.',
      teamSizeAnalyzed: teamSize,
    };
  }

  // Aggregate team signals
  const aggregated = aggregateTeamSignals(teamMembers);

  // Check if we have enough signal data
  const totalSignals = aggregated.reduce((sum, s) => sum + s.sampleSize, 0);
  if (totalSignals < teamSize * 3) {
    return {
      hasTeamData: false,
      teamOverview: `اطلاعات سبک کاری تیم ناقص است. مهارت‌ها و تجربیات را در نظر بگیرید.`,
      teamStrengths: [],
      teamGaps: [],
      candidateContribution: `برای تحلیل تطابق تیمی، اطلاعات بیشتری لازم است.`,
      confidenceNote: 'برخی اعضای تیم هنوز پروفایل کاری خود را تکمیل نکرده‌اند.',
      teamSizeAnalyzed: teamSize,
    };
  }

  // Generate insights
  const teamStrengths = findTeamStrengths(aggregated);
  const teamGaps = findTeamGaps(aggregated);
  const teamOverview = generateTeamOverview(teamStrengths, teamGaps, teamSize);

  // If candidate has no signals, provide skills-based fallback
  if (!candidateSignals || candidateSignals.length === 0) {
    return {
      hasTeamData: true,
      teamOverview,
      teamStrengths,
      teamGaps,
      candidateContribution: `متقاضی هنوز پروفایل سبک کاری ندارد. مهارت‌ها و تجربیات را در نظر بگیرید.`,
      confidenceNote: 'بینش‌های متقاضی محدود است - فقط اطلاعات تیم در دسترس است.',
      teamSizeAnalyzed: teamSize,
    };
  }

  const candidateContribution = generateCandidateContribution(
    candidateSignals,
    aggregated,
    roleContext
  );

  // Add confidence note if overall confidence is low
  const avgTeamConfidence = aggregated.reduce((sum, s) => sum + s.avgConfidence, 0) / aggregated.length;
  const avgCandidateConfidence = candidateSignals.reduce((sum, s) => sum + s.confidence, 0) / candidateSignals.length;

  let confidenceNote: string | undefined;
  if (avgTeamConfidence < 0.5 || avgCandidateConfidence < 0.5) {
    confidenceNote = 'بینش‌ها بر اساس داده‌های جمع‌آوری شده هستند و باید به عنوان راهنما استفاده شوند، نه معیار نهایی.';
  }

  return {
    hasTeamData: true,
    teamOverview,
    teamStrengths,
    teamGaps,
    candidateContribution,
    confidenceNote,
    teamSizeAnalyzed: teamSize,
  };
}

/**
 * Build job context from job details
 */
export function buildTeamFitJobContext(job: {
  title?: string;
  location_type?: string;
  company_size?: string;
}): TeamFitJobContext {
  let teamSize: TeamFitJobContext['teamSize'] = 'medium';
  if (job.company_size) {
    if (job.company_size.includes('1-10') || job.company_size.includes('small')) {
      teamSize = 'small';
    } else if (job.company_size.includes('51-200') || job.company_size.includes('201+') || job.company_size.includes('large')) {
      teamSize = 'large';
    }
  }

  return {
    roleTitle: job.title || 'این نقش',
    teamSize,
    workMode: (job.location_type as 'remote' | 'onsite' | 'hybrid') || 'onsite',
  };
}
