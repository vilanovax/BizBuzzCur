/**
 * Signal Generator
 *
 * Orchestrates signal generation from multiple test sources.
 * Handles merging and conflict resolution when multiple tests
 * contribute to the same signal.
 */

import type { Signal, SignalId } from '../contracts/signal.schema';
import type { TestType } from '../contracts/personality.input';
import { discToSignals } from './disc.mapper';
import { hollandToSignals } from './holland.mapper';

/**
 * Analysis purpose affects signal prioritization
 */
type AnalysisPurpose = 'job_matching' | 'team_fit' | 'profile_insight' | 'general';

/**
 * Generate signals from all available test scores
 */
export function generateSignals(
  allScores: Map<TestType, Record<string, number>>,
  purpose?: AnalysisPurpose
): Signal[] {
  const signalMap = new Map<SignalId, Signal[]>();

  // Generate signals from each test
  for (const [testType, scores] of allScores) {
    const testSignals = generateSignalsForTest(testType, scores);

    for (const signal of testSignals) {
      const existing = signalMap.get(signal.id) || [];
      existing.push(signal);
      signalMap.set(signal.id, existing);
    }
  }

  // Merge signals from multiple sources
  const mergedSignals: Signal[] = [];

  for (const [signalId, signals] of signalMap) {
    if (signals.length === 1) {
      mergedSignals.push(signals[0]);
    } else {
      mergedSignals.push(mergeSignals(signals));
    }
  }

  // Sort signals by category and confidence
  return sortSignals(mergedSignals, purpose);
}

/**
 * Generate signals for a specific test type
 */
function generateSignalsForTest(
  testType: TestType,
  scores: Record<string, number>
): Signal[] {
  // Calculate base confidence from score distribution
  const scoreValues = Object.values(scores);
  const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
  const baseConfidence = Math.min(1.0, avgScore + 0.3); // Boost confidence slightly

  switch (testType) {
    case 'disc':
      return discToSignals(scores, baseConfidence);
    case 'holland':
      return hollandToSignals(scores, baseConfidence);
    default:
      return [];
  }
}

/**
 * Merge multiple signals for the same signal ID
 * Uses weighted average based on confidence
 */
function mergeSignals(signals: Signal[]): Signal {
  if (signals.length === 0) {
    throw new Error('Cannot merge empty signals array');
  }

  if (signals.length === 1) {
    return signals[0];
  }

  // Calculate weighted average value
  let totalWeight = 0;
  let weightedSum = 0;
  const allSources: string[] = [];

  for (const signal of signals) {
    const weight = signal.confidence;
    weightedSum += signal.value * weight;
    totalWeight += weight;
    allSources.push(...signal.sources);
  }

  const mergedValue = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Increase confidence when multiple sources agree
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
  const agreement = calculateAgreement(signals);
  const mergedConfidence = Math.min(1.0, avgConfidence * (1 + agreement * 0.2));

  return {
    id: signals[0].id,
    category: signals[0].category,
    value: mergedValue,
    confidence: mergedConfidence,
    sources: [...new Set(allSources)], // Deduplicate sources
  };
}

/**
 * Calculate agreement between multiple signals (0-1)
 * Higher agreement = values are closer together
 */
function calculateAgreement(signals: Signal[]): number {
  if (signals.length < 2) return 1.0;

  const values = signals.map((s) => s.value);
  const maxDiff = Math.max(...values) - Math.min(...values);

  // Max possible difference is 2 (from -1 to 1)
  return 1 - maxDiff / 2;
}

/**
 * Sort signals by relevance to purpose
 */
function sortSignals(signals: Signal[], purpose?: AnalysisPurpose): Signal[] {
  // Define category priority based on purpose
  const categoryPriority: Record<AnalysisPurpose, string[]> = {
    job_matching: ['work_style', 'collaboration', 'motivation', 'decision_making', 'environment', 'growth'],
    team_fit: ['collaboration', 'environment', 'work_style', 'decision_making', 'motivation', 'growth'],
    profile_insight: ['motivation', 'work_style', 'collaboration', 'decision_making', 'environment', 'growth'],
    general: ['work_style', 'collaboration', 'decision_making', 'motivation', 'environment', 'growth'],
  };

  const priority = categoryPriority[purpose || 'general'];

  return signals.sort((a, b) => {
    // First sort by category priority
    const aPriority = priority.indexOf(a.category);
    const bPriority = priority.indexOf(b.category);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then by confidence (higher first)
    return b.confidence - a.confidence;
  });
}
