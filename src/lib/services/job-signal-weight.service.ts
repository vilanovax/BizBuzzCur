/**
 * Job Signal Weight Schema Service
 *
 * Translates job context and expectations into weighted work-style signals.
 * These weights determine which personality signals matter most for matching.
 *
 * Architecture:
 * - Stateless: No DB writes, can be cached
 * - Two sources: "derived" (from Phase 1) and "explicit" (from Phase 2)
 * - Explicit always overrides derived
 * - Default weight for unspecified signals: 0.3
 *
 * Weight scale:
 * - 0.0: Signal irrelevant for this role
 * - 0.3: Default, minor consideration
 * - 0.5: Moderately important
 * - 0.7: Important
 * - 1.0: Critical for success
 */

import type { SignalId } from '@/modules/personality-engine/contracts/signal.schema';
import type {
  JobAd,
  JobAdWithDetails,
  TeamContext,
  LocationType,
  WorkstyleExpectations,
  TeamSnapshot,
} from '@/types/job';

/**
 * A single signal weight with metadata
 */
export interface SignalWeight {
  /** Signal identifier */
  signalId: SignalId;
  /** Weight importance (0-1) */
  weight: number;
  /** Expected value direction (-1 to 1), if known */
  expectedValue?: number;
  /** Where this weight came from */
  source: 'explicit' | 'derived' | 'default';
  /** Why this weight was assigned */
  reason?: string;
}

/**
 * Complete signal weight map for a job
 */
export interface JobSignalWeightMap {
  /** Job ID */
  jobId: string;
  /** All signal weights */
  weights: SignalWeight[];
  /** Whether explicit (Phase 2) data was used */
  hasExplicitWeights: boolean;
  /** Derived context used */
  derivedContext?: {
    archetype?: string;
    teamContext?: TeamContext;
    locationType?: LocationType;
    teamSize?: number;
  };
}

/**
 * Default weight for signals not explicitly specified
 */
const DEFAULT_WEIGHT = 0.3;

/**
 * All signal IDs for iteration
 */
const ALL_SIGNALS: SignalId[] = [
  'structure_preference',
  'pace_preference',
  'detail_orientation',
  'task_approach',
  'collaboration_style',
  'communication_style',
  'conflict_approach',
  'leadership_tendency',
  'decision_style',
  'risk_tolerance',
  'change_adaptability',
  'achievement_drive',
  'recognition_need',
  'autonomy_need',
  'social_energy',
  'noise_tolerance',
  'routine_preference',
];

/**
 * Team context → signal weight mappings
 *
 * Solo: High autonomy, low collaboration
 * Small team: Balance of both
 * Cross-functional: High collaboration, communication
 */
const TEAM_CONTEXT_WEIGHTS: Record<TeamContext, Partial<Record<SignalId, { weight: number; expectedValue: number }>>> = {
  solo: {
    autonomy_need: { weight: 0.9, expectedValue: 0.7 },
    collaboration_style: { weight: 0.5, expectedValue: -0.5 },
    social_energy: { weight: 0.4, expectedValue: -0.3 },
    structure_preference: { weight: 0.6, expectedValue: 0.3 },
    leadership_tendency: { weight: 0.3, expectedValue: -0.2 },
  },
  small_team: {
    collaboration_style: { weight: 0.7, expectedValue: 0.4 },
    communication_style: { weight: 0.6, expectedValue: 0.2 },
    conflict_approach: { weight: 0.5, expectedValue: 0 },
    autonomy_need: { weight: 0.5, expectedValue: 0.3 },
    social_energy: { weight: 0.5, expectedValue: 0.3 },
  },
  cross_functional: {
    collaboration_style: { weight: 0.9, expectedValue: 0.7 },
    communication_style: { weight: 0.8, expectedValue: 0.5 },
    change_adaptability: { weight: 0.7, expectedValue: 0.5 },
    conflict_approach: { weight: 0.6, expectedValue: 0.3 },
    social_energy: { weight: 0.6, expectedValue: 0.5 },
    task_approach: { weight: 0.5, expectedValue: -0.3 }, // Parallel tasks
  },
};

/**
 * Location type → signal weight mappings
 *
 * Remote: High autonomy, self-structure
 * Onsite: Higher social energy, lower autonomy need
 * Hybrid: Balanced, high adaptability
 */
const LOCATION_TYPE_WEIGHTS: Record<LocationType, Partial<Record<SignalId, { weight: number; expectedValue: number }>>> = {
  remote: {
    autonomy_need: { weight: 0.8, expectedValue: 0.6 },
    structure_preference: { weight: 0.7, expectedValue: 0.5 },
    communication_style: { weight: 0.6, expectedValue: 0.3 },
    social_energy: { weight: 0.4, expectedValue: -0.2 },
    routine_preference: { weight: 0.5, expectedValue: 0.3 },
  },
  onsite: {
    social_energy: { weight: 0.6, expectedValue: 0.4 },
    noise_tolerance: { weight: 0.5, expectedValue: 0.3 },
    collaboration_style: { weight: 0.5, expectedValue: 0.3 },
    autonomy_need: { weight: 0.4, expectedValue: 0 },
  },
  hybrid: {
    change_adaptability: { weight: 0.7, expectedValue: 0.5 },
    autonomy_need: { weight: 0.6, expectedValue: 0.4 },
    structure_preference: { weight: 0.5, expectedValue: 0.3 },
    social_energy: { weight: 0.5, expectedValue: 0.2 },
  },
};

/**
 * Title keyword → archetype mapping for signal derivation
 */
const TITLE_ARCHETYPE_KEYWORDS: Record<string, string> = {
  // Leadership
  'مدیر': 'leadership',
  'manager': 'leadership',
  'lead': 'leadership',
  'head': 'leadership',
  'director': 'leadership',
  'سرپرست': 'leadership',
  'vp': 'leadership',
  'cto': 'leadership',
  'ceo': 'leadership',

  // Creative
  'طراح': 'creative',
  'designer': 'creative',
  'creative': 'creative',
  'ux': 'creative',
  'ui': 'creative',
  'artist': 'creative',
  'گرافیک': 'creative',

  // Analytical
  'تحلیل': 'analytical',
  'analyst': 'analytical',
  'data': 'analytical',
  'research': 'analytical',
  'scientist': 'analytical',
  'engineer': 'analytical',
  'developer': 'analytical',
  'توسعه': 'analytical',
  'برنامه': 'analytical',

  // Sales
  'فروش': 'sales',
  'sales': 'sales',
  'business development': 'sales',
  'account': 'sales',
  'بازاریابی': 'sales',
  'marketing': 'sales',

  // Support
  'پشتیبان': 'support',
  'support': 'support',
  'customer': 'support',
  'hr': 'support',
  'منابع انسانی': 'support',

  // Operations
  'عملیات': 'operations',
  'operations': 'operations',
  'admin': 'operations',
  'coordinator': 'operations',
};

/**
 * Archetype → signal weight mappings
 */
const ARCHETYPE_WEIGHTS: Record<string, Partial<Record<SignalId, { weight: number; expectedValue: number }>>> = {
  leadership: {
    leadership_tendency: { weight: 1.0, expectedValue: 0.7 },
    decision_style: { weight: 0.8, expectedValue: 0.4 },
    risk_tolerance: { weight: 0.7, expectedValue: 0.4 },
    communication_style: { weight: 0.7, expectedValue: 0.4 },
    conflict_approach: { weight: 0.6, expectedValue: 0.3 },
    achievement_drive: { weight: 0.6, expectedValue: 0.5 },
  },
  creative: {
    structure_preference: { weight: 0.8, expectedValue: -0.5 },
    autonomy_need: { weight: 0.8, expectedValue: 0.6 },
    risk_tolerance: { weight: 0.6, expectedValue: 0.4 },
    routine_preference: { weight: 0.7, expectedValue: -0.5 },
    detail_orientation: { weight: 0.5, expectedValue: 0.3 },
    change_adaptability: { weight: 0.6, expectedValue: 0.4 },
  },
  analytical: {
    decision_style: { weight: 1.0, expectedValue: 0.7 },
    detail_orientation: { weight: 0.9, expectedValue: 0.6 },
    structure_preference: { weight: 0.7, expectedValue: 0.5 },
    task_approach: { weight: 0.6, expectedValue: 0.4 },
    pace_preference: { weight: 0.5, expectedValue: 0 },
  },
  support: {
    collaboration_style: { weight: 1.0, expectedValue: 0.7 },
    conflict_approach: { weight: 0.8, expectedValue: -0.3 },
    communication_style: { weight: 0.7, expectedValue: -0.2 },
    social_energy: { weight: 0.7, expectedValue: 0.5 },
    autonomy_need: { weight: 0.4, expectedValue: -0.2 },
  },
  sales: {
    social_energy: { weight: 1.0, expectedValue: 0.7 },
    risk_tolerance: { weight: 0.8, expectedValue: 0.5 },
    achievement_drive: { weight: 0.9, expectedValue: 0.7 },
    communication_style: { weight: 0.7, expectedValue: 0.4 },
    change_adaptability: { weight: 0.6, expectedValue: 0.4 },
  },
  operations: {
    structure_preference: { weight: 1.0, expectedValue: 0.7 },
    detail_orientation: { weight: 0.9, expectedValue: 0.6 },
    routine_preference: { weight: 0.8, expectedValue: 0.5 },
    pace_preference: { weight: 0.6, expectedValue: 0.3 },
    task_approach: { weight: 0.5, expectedValue: 0.4 },
  },
};

/**
 * Infer archetype from job title
 */
function inferArchetypeFromTitle(title: string): string | undefined {
  const lowerTitle = title.toLowerCase();

  for (const [keyword, archetype] of Object.entries(TITLE_ARCHETYPE_KEYWORDS)) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return archetype;
    }
  }

  return undefined;
}

/**
 * Convert Phase 2 workstyle expectations to signal weights
 *
 * WorkstyleExpectations fields (1-5 scale):
 * - autonomy → autonomy_need
 * - collaboration → collaboration_style
 * - pace → pace_preference
 * - structure → structure_preference
 */
function convertWorkstyleToWeights(
  workstyle: WorkstyleExpectations
): Partial<Record<SignalId, SignalWeight>> {
  const weights: Partial<Record<SignalId, SignalWeight>> = {};

  // Autonomy (1=low autonomy needed, 5=high autonomy needed)
  if (workstyle.autonomy !== undefined) {
    const normalized = (workstyle.autonomy - 3) / 2; // Convert 1-5 to -1 to 1
    weights.autonomy_need = {
      signalId: 'autonomy_need',
      weight: 0.8,
      expectedValue: normalized,
      source: 'explicit',
      reason: 'از تنظیمات استقلال کاری',
    };
  }

  // Collaboration (1=independent, 5=highly collaborative)
  if (workstyle.collaboration !== undefined) {
    const normalized = (workstyle.collaboration - 3) / 2;
    weights.collaboration_style = {
      signalId: 'collaboration_style',
      weight: 0.8,
      expectedValue: normalized,
      source: 'explicit',
      reason: 'از تنظیمات همکاری تیمی',
    };
    // Also affects social energy
    weights.social_energy = {
      signalId: 'social_energy',
      weight: 0.6,
      expectedValue: normalized * 0.8,
      source: 'explicit',
      reason: 'از سطح همکاری مورد انتظار',
    };
  }

  // Pace (1=slow/steady, 5=fast-paced)
  if (workstyle.pace !== undefined) {
    const normalized = (workstyle.pace - 3) / 2;
    weights.pace_preference = {
      signalId: 'pace_preference',
      weight: 0.7,
      expectedValue: normalized,
      source: 'explicit',
      reason: 'از سرعت کار مورد انتظار',
    };
    // Fast pace often means lower routine preference
    if (workstyle.pace >= 4) {
      weights.routine_preference = {
        signalId: 'routine_preference',
        weight: 0.5,
        expectedValue: -0.3,
        source: 'explicit',
        reason: 'محیط پرسرعت معمولاً با تنوع همراه است',
      };
    }
  }

  // Structure (1=flexible, 5=structured)
  if (workstyle.structure !== undefined) {
    const normalized = (workstyle.structure - 3) / 2;
    weights.structure_preference = {
      signalId: 'structure_preference',
      weight: 0.8,
      expectedValue: normalized,
      source: 'explicit',
      reason: 'از سطح ساختار مورد انتظار',
    };
  }

  return weights;
}

/**
 * Convert team snapshot to signal weights
 */
function convertTeamSnapshotToWeights(
  snapshot: TeamSnapshot
): Partial<Record<SignalId, SignalWeight>> {
  const weights: Partial<Record<SignalId, SignalWeight>> = {};

  // Team size affects collaboration and social energy
  if (snapshot.team_size !== undefined) {
    if (snapshot.team_size <= 2) {
      // Very small team / solo
      weights.autonomy_need = {
        signalId: 'autonomy_need',
        weight: 0.7,
        expectedValue: 0.5,
        source: 'explicit',
        reason: 'تیم کوچک نیاز به استقلال بیشتر دارد',
      };
    } else if (snapshot.team_size >= 10) {
      // Large team
      weights.collaboration_style = {
        signalId: 'collaboration_style',
        weight: 0.8,
        expectedValue: 0.6,
        source: 'explicit',
        reason: 'تیم بزرگ نیاز به همکاری بیشتر دارد',
      };
      weights.communication_style = {
        signalId: 'communication_style',
        weight: 0.7,
        expectedValue: 0.4,
        source: 'explicit',
        reason: 'تیم بزرگ نیاز به ارتباط مؤثر دارد',
      };
    }
  }

  // Works with multiple roles suggests cross-functional work
  if (snapshot.works_with && snapshot.works_with.length > 3) {
    weights.change_adaptability = {
      signalId: 'change_adaptability',
      weight: 0.6,
      expectedValue: 0.4,
      source: 'explicit',
      reason: 'کار با تیم‌های مختلف نیاز به انعطاف دارد',
    };
  }

  // Reports to someone suggests a supporting role
  if (snapshot.reports_to) {
    weights.leadership_tendency = {
      signalId: 'leadership_tendency',
      weight: 0.4,
      expectedValue: -0.2,
      source: 'explicit',
      reason: 'نقش گزارش‌دهی',
    };
  }

  return weights;
}

/**
 * Derive signal weights from Phase 1 data
 */
function deriveWeightsFromPhase1(
  job: Partial<JobAd> & { title: string }
): Map<SignalId, SignalWeight> {
  const weights = new Map<SignalId, SignalWeight>();

  // 1. Team context
  if (job.team_context) {
    const contextWeights = TEAM_CONTEXT_WEIGHTS[job.team_context];
    if (contextWeights) {
      for (const [signalId, config] of Object.entries(contextWeights)) {
        weights.set(signalId as SignalId, {
          signalId: signalId as SignalId,
          weight: config.weight,
          expectedValue: config.expectedValue,
          source: 'derived',
          reason: `از محیط کاری ${job.team_context}`,
        });
      }
    }
  }

  // 2. Location type
  if (job.location_type) {
    const locationWeights = LOCATION_TYPE_WEIGHTS[job.location_type];
    if (locationWeights) {
      for (const [signalId, config] of Object.entries(locationWeights)) {
        const existing = weights.get(signalId as SignalId);
        // Merge: take higher weight, average expected values
        if (existing) {
          weights.set(signalId as SignalId, {
            signalId: signalId as SignalId,
            weight: Math.max(existing.weight, config.weight),
            expectedValue: existing.expectedValue !== undefined && config.expectedValue !== undefined
              ? (existing.expectedValue + config.expectedValue) / 2
              : config.expectedValue ?? existing.expectedValue,
            source: 'derived',
            reason: `از ${existing.reason} و نوع حضور ${job.location_type}`,
          });
        } else {
          weights.set(signalId as SignalId, {
            signalId: signalId as SignalId,
            weight: config.weight,
            expectedValue: config.expectedValue,
            source: 'derived',
            reason: `از نوع حضور ${job.location_type}`,
          });
        }
      }
    }
  }

  // 3. Title-based archetype
  const archetype = inferArchetypeFromTitle(job.title);
  if (archetype) {
    const archetypeWeights = ARCHETYPE_WEIGHTS[archetype];
    if (archetypeWeights) {
      for (const [signalId, config] of Object.entries(archetypeWeights)) {
        const existing = weights.get(signalId as SignalId);
        // Archetype is lower priority, only add if not already set or if higher weight
        if (!existing || config.weight > existing.weight) {
          weights.set(signalId as SignalId, {
            signalId: signalId as SignalId,
            weight: config.weight,
            expectedValue: config.expectedValue,
            source: 'derived',
            reason: existing
              ? `${existing.reason} (تقویت شده با نقش ${archetype})`
              : `از نوع نقش ${archetype}`,
          });
        }
      }
    }
  }

  return weights;
}

/**
 * Get signal weights for a job
 *
 * Main entry point for this service.
 * Combines derived (Phase 1) and explicit (Phase 2) weights.
 *
 * @param job - Job data (can be partial JobAd or full JobAdWithDetails)
 * @returns Complete signal weight map
 */
export function getJobSignalWeights(
  job: Partial<JobAdWithDetails> & { id: string; title: string }
): JobSignalWeightMap {
  // Start with derived weights from Phase 1
  const derivedWeights = deriveWeightsFromPhase1(job);

  // Track if we have explicit weights
  let hasExplicitWeights = false;

  // Apply explicit weights from Phase 2 (override derived)
  if (job.workstyle_expectations) {
    hasExplicitWeights = true;
    const explicitWeights = convertWorkstyleToWeights(job.workstyle_expectations);
    for (const [signalId, weight] of Object.entries(explicitWeights)) {
      derivedWeights.set(signalId as SignalId, weight as SignalWeight);
    }
  }

  // Apply team snapshot weights
  if (job.team_snapshot) {
    hasExplicitWeights = true;
    const snapshotWeights = convertTeamSnapshotToWeights(job.team_snapshot);
    for (const [signalId, weight] of Object.entries(snapshotWeights)) {
      // Only override if explicit weight is higher or not set
      const existing = derivedWeights.get(signalId as SignalId);
      if (!existing || (weight as SignalWeight).source === 'explicit') {
        derivedWeights.set(signalId as SignalId, weight as SignalWeight);
      }
    }
  }

  // Fill in defaults for any missing signals
  const finalWeights: SignalWeight[] = ALL_SIGNALS.map((signalId) => {
    const existing = derivedWeights.get(signalId);
    if (existing) {
      return existing;
    }
    return {
      signalId,
      weight: DEFAULT_WEIGHT,
      source: 'default' as const,
    };
  });

  return {
    jobId: job.id,
    weights: finalWeights,
    hasExplicitWeights,
    derivedContext: {
      archetype: inferArchetypeFromTitle(job.title),
      teamContext: job.team_context || undefined,
      locationType: job.location_type || undefined,
      teamSize: job.team_snapshot?.team_size,
    },
  };
}

/**
 * Get weights as a simple map (for easier lookup)
 */
export function getWeightsAsMap(
  weightMap: JobSignalWeightMap
): Map<SignalId, SignalWeight> {
  return new Map(weightMap.weights.map((w) => [w.signalId, w]));
}

/**
 * Get only high-priority weights (weight >= 0.6)
 */
export function getHighPriorityWeights(
  weightMap: JobSignalWeightMap
): SignalWeight[] {
  return weightMap.weights.filter((w) => w.weight >= 0.6);
}

/**
 * Convert to JobSignalRequirement format for use with JobAdapter
 */
export function toJobSignalRequirements(
  weightMap: JobSignalWeightMap
): Array<{ signalId: SignalId; expectedValue: number; weight: number; reason?: string }> {
  return weightMap.weights
    .filter((w) => w.weight > DEFAULT_WEIGHT && w.expectedValue !== undefined)
    .map((w) => ({
      signalId: w.signalId,
      expectedValue: w.expectedValue!,
      weight: w.weight,
      reason: w.reason,
    }));
}
