/**
 * Org-Level Intelligence Service
 *
 * Provides aggregated, department- and unit-level insights
 * about work styles, collaboration patterns, and team balance.
 *
 * Privacy & Ethics:
 * - No individual exposure
 * - No sensitive attribute inference
 * - No monitoring language
 * - No longitudinal tracking of individuals
 *
 * Aggregation Rules:
 * - Aggregate by unit only
 * - Use distributions or dominant tendencies
 * - Never expose outliers or individual deviations
 * - Enforce minimum sample size
 */

import type { Signal, SignalId, SignalCategory } from '@/modules/personality-engine/contracts/signal.schema';
import {
  MIN_UNIT_SAMPLE_SIZE,
  type OrgIntelligenceResult,
  type UnitSummary,
  type WorkStyleTendency,
  type CollaborationPattern,
  type CrossUnitPattern,
  type HiringImplication,
  type OrgContext,
} from '@/types/org-intelligence';

/**
 * Member signal data for a unit
 */
interface UnitMemberData {
  unitId: string;
  unitName: string;
  signals: Signal[];
}

/**
 * Aggregated signal statistics
 */
interface AggregatedSignalStats {
  id: SignalId;
  category: SignalCategory;
  mean: number;
  stdDev: number;
  sampleSize: number;
}

/**
 * Signal category to Persian tendency descriptions
 */
const TENDENCY_DESCRIPTIONS: Record<SignalCategory, {
  high: string;
  low: string;
}> = {
  work_style: {
    high: 'گرایش به کار ساختارمند و منظم',
    low: 'گرایش به انعطاف‌پذیری و سازگاری',
  },
  collaboration: {
    high: 'تمایل به همکاری نزدیک و تعامل تیمی',
    low: 'تمایل به کار مستقل و خوداتکایی',
  },
  decision_making: {
    high: 'رویکرد تحلیلی و داده‌محور در تصمیم‌گیری',
    low: 'رویکرد شهودی و تجربه‌محور در تصمیم‌گیری',
  },
  motivation: {
    high: 'انگیزه قوی برای دستیابی به نتایج و اهداف',
    low: 'تمرکز بر فرآیند و کیفیت کار',
  },
  environment: {
    high: 'ترجیح محیط پویا و پرانرژی',
    low: 'ترجیح محیط آرام و متمرکز',
  },
  growth: {
    high: 'علاقه به یادگیری و رشد مداوم',
    low: 'تمرکز بر تخصص و تعمیق دانش فعلی',
  },
};

/**
 * Collaboration pattern descriptions
 */
const COLLABORATION_PATTERNS: Record<string, CollaborationPattern> = {
  team_oriented: {
    description: 'این واحد به همکاری نزدیک و تعامل تیمی گرایش دارد',
    type: 'teamwork',
  },
  independent: {
    description: 'این واحد به کار مستقل و خوداتکایی گرایش دارد',
    type: 'teamwork',
  },
  direct_communication: {
    description: 'سبک ارتباطی مستقیم و صریح در این واحد غالب است',
    type: 'communication',
  },
  diplomatic: {
    description: 'سبک ارتباطی دیپلماتیک و ملایم در این واحد غالب است',
    type: 'communication',
  },
  analytical_decision: {
    description: 'تصمیم‌گیری در این واحد عمدتاً تحلیلی و داده‌محور است',
    type: 'decision',
  },
  intuitive_decision: {
    description: 'تصمیم‌گیری در این واحد بیشتر بر شهود و تجربه متکی است',
    type: 'decision',
  },
  distributed_leadership: {
    description: 'رهبری در این واحد توزیع‌شده و مشارکتی است',
    type: 'leadership',
  },
  centralized_leadership: {
    description: 'رهبری در این واحد متمرکز و هدایت‌شده است',
    type: 'leadership',
  },
};

/**
 * Aggregate signals for a group of members
 */
function aggregateSignals(members: UnitMemberData[]): Map<SignalCategory, AggregatedSignalStats[]> {
  const categorySignals = new Map<SignalCategory, Map<SignalId, { values: number[]; category: SignalCategory }>>();

  // Collect all signals by category
  for (const member of members) {
    for (const signal of member.signals) {
      if (!categorySignals.has(signal.category)) {
        categorySignals.set(signal.category, new Map());
      }
      const catMap = categorySignals.get(signal.category)!;
      if (!catMap.has(signal.id)) {
        catMap.set(signal.id, { values: [], category: signal.category });
      }
      catMap.get(signal.id)!.values.push(signal.value);
    }
  }

  // Calculate statistics per category
  const result = new Map<SignalCategory, AggregatedSignalStats[]>();

  for (const [category, signalMap] of categorySignals) {
    const stats: AggregatedSignalStats[] = [];
    for (const [id, data] of signalMap) {
      const n = data.values.length;
      if (n === 0) continue;

      const mean = data.values.reduce((a, b) => a + b, 0) / n;
      const variance = data.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      stats.push({
        id,
        category: data.category,
        mean,
        stdDev,
        sampleSize: n,
      });
    }
    result.set(category, stats);
  }

  return result;
}

/**
 * Valid tendency categories (excludes 'growth' which doesn't have a mapping)
 */
type TendencyCategory = 'work_style' | 'collaboration' | 'decision_making' | 'motivation' | 'environment';

const VALID_TENDENCY_CATEGORIES: TendencyCategory[] = [
  'work_style', 'collaboration', 'decision_making', 'motivation', 'environment'
];

/**
 * Generate tendencies from aggregated signals
 */
function generateTendencies(
  aggregated: Map<SignalCategory, AggregatedSignalStats[]>
): WorkStyleTendency[] {
  const tendencies: WorkStyleTendency[] = [];

  for (const [category, stats] of aggregated) {
    // Skip categories not in tendency mapping
    if (!VALID_TENDENCY_CATEGORIES.includes(category as TendencyCategory)) continue;

    // Get dominant signal for this category
    const dominant = stats.reduce((best, curr) => {
      const currStrength = Math.abs(curr.mean) * (curr.sampleSize / 10);
      const bestStrength = best ? Math.abs(best.mean) * (best.sampleSize / 10) : 0;
      return currStrength > bestStrength ? curr : best;
    }, null as AggregatedSignalStats | null);

    if (!dominant || Math.abs(dominant.mean) < 0.2) continue;

    const descriptions = TENDENCY_DESCRIPTIONS[category];
    if (!descriptions) continue;

    tendencies.push({
      description: dominant.mean > 0 ? descriptions.high : descriptions.low,
      category: category as TendencyCategory,
      strength: Math.abs(dominant.mean) > 0.5 ? 'strong' : 'moderate',
    });
  }

  // Return top 3 tendencies
  return tendencies
    .sort((a, b) => (b.strength === 'strong' ? 1 : 0) - (a.strength === 'strong' ? 1 : 0))
    .slice(0, 3);
}

/**
 * Generate collaboration pattern from signals
 */
function generateCollaborationPattern(
  aggregated: Map<SignalCategory, AggregatedSignalStats[]>
): CollaborationPattern | undefined {
  const collaborationStats = aggregated.get('collaboration');
  const decisionStats = aggregated.get('decision_making');

  if (!collaborationStats && !decisionStats) return undefined;

  // Check collaboration style
  const collabSignal = collaborationStats?.find(s => s.id === 'collaboration_style');
  if (collabSignal && Math.abs(collabSignal.mean) > 0.3) {
    return collabSignal.mean > 0
      ? COLLABORATION_PATTERNS.team_oriented
      : COLLABORATION_PATTERNS.independent;
  }

  // Check decision style
  const decisionSignal = decisionStats?.find(s => s.id === 'decision_style');
  if (decisionSignal && Math.abs(decisionSignal.mean) > 0.3) {
    return decisionSignal.mean > 0
      ? COLLABORATION_PATTERNS.analytical_decision
      : COLLABORATION_PATTERNS.intuitive_decision;
  }

  // Check communication style
  const commSignal = collaborationStats?.find(s => s.id === 'communication_style');
  if (commSignal && Math.abs(commSignal.mean) > 0.3) {
    return commSignal.mean > 0
      ? COLLABORATION_PATTERNS.direct_communication
      : COLLABORATION_PATTERNS.diplomatic;
  }

  return undefined;
}

/**
 * Analyze a single unit
 */
function analyzeUnit(
  unitId: string,
  unitName: string,
  members: UnitMemberData[]
): UnitSummary {
  const memberCount = members.length;
  const hasEnoughData = memberCount >= MIN_UNIT_SAMPLE_SIZE;

  if (!hasEnoughData) {
    return {
      unitId,
      unitName,
      memberCount,
      hasEnoughData: false,
      tendencies: [],
      confidenceNote: `حداقل ${MIN_UNIT_SAMPLE_SIZE} عضو با پروفایل کاری برای تحلیل لازم است.`,
    };
  }

  const aggregated = aggregateSignals(members);
  const tendencies = generateTendencies(aggregated);
  const collaborationPattern = generateCollaborationPattern(aggregated);

  return {
    unitId,
    unitName,
    memberCount,
    hasEnoughData: true,
    tendencies,
    collaborationPattern,
    confidenceNote: memberCount < 10
      ? 'این بینش‌ها بر اساس نمونه محدود هستند.'
      : undefined,
  };
}

/**
 * Generate cross-unit patterns
 */
function generateCrossUnitPatterns(
  unitSummaries: UnitSummary[]
): CrossUnitPattern[] {
  const patterns: CrossUnitPattern[] = [];
  const validUnits = unitSummaries.filter(u => u.hasEnoughData && u.tendencies.length > 0);

  if (validUnits.length < 2) return [];

  // Find similarities
  const categoryGroups = new Map<string, string[]>();
  for (const unit of validUnits) {
    for (const tendency of unit.tendencies) {
      const key = `${tendency.category}_${tendency.description}`;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, []);
      }
      categoryGroups.get(key)!.push(unit.unitName);
    }
  }

  // Report similarities (2+ units with same tendency)
  for (const [, unitNames] of categoryGroups) {
    if (unitNames.length >= 2 && unitNames.length < validUnits.length) {
      patterns.push({
        description: `${unitNames.join(' و ')} الگوهای کاری مشابهی دارند`,
        unitNames,
        type: 'similarity',
      });
    }
  }

  // Find differences (contrasting work styles)
  const workStyleUnits = validUnits.filter(u =>
    u.tendencies.some(t => t.category === 'work_style')
  );
  if (workStyleUnits.length >= 2) {
    const structured = workStyleUnits.filter(u =>
      u.tendencies.some(t => t.description.includes('ساختارمند'))
    );
    const flexible = workStyleUnits.filter(u =>
      u.tendencies.some(t => t.description.includes('انعطاف'))
    );

    if (structured.length > 0 && flexible.length > 0) {
      patterns.push({
        description: `برخی واحدها به ساختار و برخی به انعطاف گرایش دارند که می‌تواند مکمل باشد`,
        unitNames: [...structured.map(u => u.unitName), ...flexible.map(u => u.unitName)],
        type: 'complement',
      });
    }
  }

  return patterns.slice(0, 3);
}

/**
 * Generate hiring implications from org patterns
 */
function generateHiringImplications(
  unitSummaries: UnitSummary[],
  crossUnitPatterns: CrossUnitPattern[]
): HiringImplication[] {
  const implications: HiringImplication[] = [];
  const validUnits = unitSummaries.filter(u => u.hasEnoughData);

  // Check for units with strong single tendencies (might need balance)
  for (const unit of validUnits) {
    const strongTendencies = unit.tendencies.filter(t => t.strength === 'strong');
    if (strongTendencies.length >= 2) {
      // Unit has strong homogeneity - might benefit from diversity
      const category = strongTendencies[0].category;
      if (category === 'work_style') {
        implications.push({
          description: `${unit.unitName} ممکن است از استخدام افراد با سبک‌های کاری متنوع‌تر بهره ببرد`,
          unitNames: [unit.unitName],
          priority: 'consideration',
        });
      } else if (category === 'collaboration') {
        implications.push({
          description: `${unit.unitName} می‌تواند از افراد با سبک‌های همکاری متفاوت استفاده کند`,
          unitNames: [unit.unitName],
          priority: 'suggestion',
        });
      }
    }
  }

  // Check for complementary hiring across units
  if (crossUnitPatterns.some(p => p.type === 'complement')) {
    implications.push({
      description: 'تنوع سبک‌های کاری بین واحدها می‌تواند نقطه قوت سازمان باشد',
      priority: 'suggestion',
    });
  }

  return implications.slice(0, 3);
}

/**
 * Generate org overview summary
 */
function generateOrgOverview(
  unitSummaries: UnitSummary[],
  totalMembers: number
): string {
  const validUnits = unitSummaries.filter(u => u.hasEnoughData);

  if (validUnits.length === 0) {
    return 'اطلاعات کافی برای تحلیل سازمانی موجود نیست.';
  }

  // Count dominant categories across units
  const categoryCounts = new Map<string, number>();
  for (const unit of validUnits) {
    for (const tendency of unit.tendencies) {
      const key = tendency.category;
      categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
    }
  }

  // Find most common category
  let dominantCategory = '';
  let maxCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCount) {
      dominantCategory = cat;
      maxCount = count;
    }
  }

  const categoryDescriptions: Record<string, string> = {
    work_style: 'سبک‌های کاری ساختارمند',
    collaboration: 'همکاری تیمی',
    decision_making: 'تصمیم‌گیری تحلیلی',
    motivation: 'تمرکز بر نتایج',
    environment: 'محیط پویا',
  };

  const desc = categoryDescriptions[dominantCategory] || 'سبک‌های کاری متنوع';

  if (validUnits.length === 1) {
    return `بر اساس ${totalMembers} عضو، سازمان گرایش به ${desc} دارد.`;
  }

  return `در سطح سازمان، تیم‌ها به ${desc} گرایش دارند، با برخی تنوع بین واحدها.`;
}

/**
 * Main function: Analyze org-level intelligence
 *
 * IMPORTANT: This does NOT expose individual data.
 * All insights are aggregated at the unit level.
 */
export function analyzeOrgIntelligence(
  membersByUnit: Map<string, UnitMemberData[]>,
  context: OrgContext
): OrgIntelligenceResult {
  // Analyze each unit
  const unitSummaries: UnitSummary[] = [];
  let totalMembers = 0;

  for (const [unitKey, members] of membersByUnit) {
    if (members.length === 0) continue;

    const unitId = members[0].unitId;
    const unitName = members[0].unitName;
    totalMembers += members.length;

    const summary = analyzeUnit(unitId, unitName, members);
    unitSummaries.push(summary);
  }

  const unitsWithData = unitSummaries.filter(u => u.hasEnoughData).length;

  // Check if we have enough org data
  if (totalMembers < MIN_UNIT_SAMPLE_SIZE || unitsWithData === 0) {
    return {
      hasOrgData: false,
      orgOverview: 'بینش‌های سازمانی با رشد تیم‌ها نمایش داده خواهند شد.',
      unitSummaries,
      crossUnitPatterns: [],
      hiringImplications: [],
      confidenceNote: `حداقل ${MIN_UNIT_SAMPLE_SIZE} عضو با پروفایل کاری برای تحلیل لازم است.`,
      totalMembersAnalyzed: totalMembers,
      unitsWithData: 0,
    };
  }

  // Generate cross-unit patterns
  const crossUnitPatterns = generateCrossUnitPatterns(unitSummaries);

  // Generate hiring implications
  const hiringImplications = generateHiringImplications(unitSummaries, crossUnitPatterns);

  // Generate org overview
  const orgOverview = generateOrgOverview(unitSummaries, totalMembers);

  // Confidence note if partial data
  let confidenceNote: string | undefined;
  if (unitsWithData < unitSummaries.length) {
    confidenceNote = 'برخی واحدها داده کافی ندارند و در تحلیل لحاظ نشده‌اند.';
  }

  return {
    hasOrgData: true,
    orgOverview,
    unitSummaries,
    crossUnitPatterns,
    hiringImplications,
    confidenceNote,
    totalMembersAnalyzed: totalMembers,
    unitsWithData,
  };
}

/**
 * Build member data from raw database results
 */
export function buildMemberData(
  members: Array<{
    user_id: string;
    department_id: string | null;
    department_name: string | null;
    personality_signals: Signal[] | string | null;
  }>
): Map<string, UnitMemberData[]> {
  const result = new Map<string, UnitMemberData[]>();

  for (const member of members) {
    const unitId = member.department_id || 'default';
    const unitName = member.department_name || 'سازمان';

    // Parse signals
    let signals: Signal[] = [];
    if (member.personality_signals) {
      try {
        signals = typeof member.personality_signals === 'string'
          ? JSON.parse(member.personality_signals)
          : member.personality_signals;
      } catch {
        signals = [];
      }
    }

    if (signals.length === 0) continue;

    if (!result.has(unitId)) {
      result.set(unitId, []);
    }

    result.get(unitId)!.push({
      unitId,
      unitName,
      signals,
    });
  }

  return result;
}
