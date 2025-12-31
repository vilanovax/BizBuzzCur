/**
 * Score Normalizer
 *
 * Utilities for normalizing and transforming scores.
 */

/**
 * Normalize a value from one range to another
 */
export function normalizeValue(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number = 0,
  toMax: number = 1
): number {
  if (fromMax === fromMin) return toMin;
  return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
}

/**
 * Normalize scores to 0-1 range
 */
export function normalizeScores(
  scores: Record<string, number>,
  maxScores: Record<string, number>
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(scores)) {
    const max = maxScores[key] || 1;
    normalized[key] = max > 0 ? value / max : 0;
  }

  return normalized;
}

/**
 * Convert normalized scores (0-1) to bipolar scale (-1 to 1)
 * Used when comparing two opposing dimensions
 */
export function toBipolarScale(score1: number, score2: number): number {
  // score1 strong = negative, score2 strong = positive
  return score2 - score1;
}

/**
 * Clamp a value to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
