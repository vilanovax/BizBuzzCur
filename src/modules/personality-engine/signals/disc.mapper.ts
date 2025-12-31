/**
 * DISC to Signals Mapper
 *
 * Maps DISC dimension scores to behavioral signals.
 *
 * DISC Dimensions:
 * - D (Dominance): Direct, results-oriented
 * - I (Influence): Outgoing, enthusiastic
 * - S (Steadiness): Patient, reliable
 * - C (Conscientiousness): Analytical, precise
 */

import type { Signal, SignalId } from '../contracts/signal.schema';
import { toBipolarScale, clamp } from '../scoring/normalizer';

/**
 * Map DISC scores to behavioral signals
 */
export function discToSignals(
  scores: Record<string, number>,
  baseConfidence: number
): Signal[] {
  const D = scores['D'] || 0;
  const I = scores['I'] || 0;
  const S = scores['S'] || 0;
  const C = scores['C'] || 0;

  const signals: Signal[] = [];

  // Leadership Tendency: D (leading) vs S (supporting)
  signals.push({
    id: 'leadership_tendency',
    category: 'collaboration',
    value: clamp(toBipolarScale(S, D), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Communication Style: I (diplomatic/expressive) vs D (direct)
  signals.push({
    id: 'communication_style',
    category: 'collaboration',
    value: clamp(toBipolarScale(I, D), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Collaboration Style: I+S (team-oriented) vs D+C (independent)
  const teamOriented = (I + S) / 2;
  const independent = (D + C) / 2;
  signals.push({
    id: 'collaboration_style',
    category: 'collaboration',
    value: clamp(toBipolarScale(independent, teamOriented), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Conflict Approach: S (harmonizing) vs D (confrontational)
  signals.push({
    id: 'conflict_approach',
    category: 'collaboration',
    value: clamp(toBipolarScale(S, D), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Decision Style: C (analytical) vs I (intuitive)
  signals.push({
    id: 'decision_style',
    category: 'decision_making',
    value: clamp(toBipolarScale(I, C), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Risk Tolerance: D+I (bold) vs S+C (cautious)
  const bold = (D + I) / 2;
  const cautious = (S + C) / 2;
  signals.push({
    id: 'risk_tolerance',
    category: 'decision_making',
    value: clamp(toBipolarScale(cautious, bold), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Change Adaptability: I (embraces) vs S (stability)
  signals.push({
    id: 'change_adaptability',
    category: 'decision_making',
    value: clamp(toBipolarScale(S, I), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Pace Preference: D+I (fast) vs S+C (steady)
  signals.push({
    id: 'pace_preference',
    category: 'work_style',
    value: clamp(toBipolarScale(cautious, bold), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Structure Preference: C (structured) vs I (flexible)
  signals.push({
    id: 'structure_preference',
    category: 'work_style',
    value: clamp(toBipolarScale(I, C), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Detail Orientation: C (detail) vs D (big picture)
  signals.push({
    id: 'detail_orientation',
    category: 'work_style',
    value: clamp(toBipolarScale(D, C), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Achievement Drive: D (results) vs S (process)
  signals.push({
    id: 'achievement_drive',
    category: 'motivation',
    value: clamp(toBipolarScale(S, D), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Recognition Need: I (public) vs C (private)
  signals.push({
    id: 'recognition_need',
    category: 'motivation',
    value: clamp(toBipolarScale(C, I), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Autonomy Need: D (independence) vs S (guidance)
  signals.push({
    id: 'autonomy_need',
    category: 'motivation',
    value: clamp(toBipolarScale(S, D), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  // Social Energy: I (social) vs C (solitude)
  signals.push({
    id: 'social_energy',
    category: 'environment',
    value: clamp(toBipolarScale(C, I), -1, 1),
    confidence: baseConfidence,
    sources: ['disc'],
  });

  return signals;
}
