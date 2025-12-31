/**
 * Holland (RIASEC) to Signals Mapper
 *
 * Maps Holland dimension scores to behavioral signals.
 *
 * Holland Dimensions:
 * - R (Realistic): Practical, hands-on
 * - I (Investigative): Analytical, curious
 * - A (Artistic): Creative, expressive
 * - S (Social): Helping, cooperative
 * - E (Enterprising): Persuasive, competitive
 * - C (Conventional): Organized, structured
 */

import type { Signal } from '../contracts/signal.schema';
import { toBipolarScale, clamp } from '../scoring/normalizer';

/**
 * Map Holland scores to behavioral signals
 */
export function hollandToSignals(
  scores: Record<string, number>,
  baseConfidence: number
): Signal[] {
  const R = scores['R'] || 0;
  const I = scores['I'] || 0;
  const A = scores['A'] || 0;
  const S = scores['S'] || 0;
  const E = scores['E'] || 0;
  const C = scores['C'] || 0;

  const signals: Signal[] = [];

  // Collaboration Style: S (team) vs R (independent)
  signals.push({
    id: 'collaboration_style',
    category: 'collaboration',
    value: clamp(toBipolarScale(R, S), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Leadership Tendency: E (leading) vs S (supporting)
  signals.push({
    id: 'leadership_tendency',
    category: 'collaboration',
    value: clamp(toBipolarScale(S, E), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Decision Style: I (analytical) vs A (intuitive)
  signals.push({
    id: 'decision_style',
    category: 'decision_making',
    value: clamp(toBipolarScale(A, I), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Risk Tolerance: E+A (bold/creative) vs C+R (cautious/practical)
  const bold = (E + A) / 2;
  const cautious = (C + R) / 2;
  signals.push({
    id: 'risk_tolerance',
    category: 'decision_making',
    value: clamp(toBipolarScale(cautious, bold), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Structure Preference: C (structured) vs A (flexible)
  signals.push({
    id: 'structure_preference',
    category: 'work_style',
    value: clamp(toBipolarScale(A, C), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Detail Orientation: I+C (detail) vs E (big picture)
  const detailFocus = (I + C) / 2;
  signals.push({
    id: 'detail_orientation',
    category: 'work_style',
    value: clamp(toBipolarScale(E, detailFocus), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Task Approach: C (sequential) vs A (parallel/creative)
  signals.push({
    id: 'task_approach',
    category: 'work_style',
    value: clamp(toBipolarScale(A, C), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Achievement Drive: E (results) vs S (process/people)
  signals.push({
    id: 'achievement_drive',
    category: 'motivation',
    value: clamp(toBipolarScale(S, E), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Autonomy Need: A+I (independence) vs S+C (structure/guidance)
  const independent = (A + I) / 2;
  const structured = (S + C) / 2;
  signals.push({
    id: 'autonomy_need',
    category: 'motivation',
    value: clamp(toBipolarScale(structured, independent), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Social Energy: S+E (social) vs R+I (solitary)
  const social = (S + E) / 2;
  const solitary = (R + I) / 2;
  signals.push({
    id: 'social_energy',
    category: 'environment',
    value: clamp(toBipolarScale(solitary, social), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  // Routine Preference: C+R (routine) vs A+E (variety)
  const routine = (C + R) / 2;
  const variety = (A + E) / 2;
  signals.push({
    id: 'routine_preference',
    category: 'environment',
    value: clamp(toBipolarScale(variety, routine), -1, 1),
    confidence: baseConfidence,
    sources: ['holland'],
  });

  return signals;
}
