/**
 * Test Scorer
 *
 * Calculates raw scores from test answers.
 */

import type { TestResult, Answer } from '../contracts/personality.input';
import { DiscTest } from '../domain/disc.domain';
import { HollandTest } from '../domain/holland.domain';
import type { TestDefinition, Question } from '../domain/types';

export interface ScoringResult {
  success: boolean;
  /** Raw scores per dimension (0 to maxPossible) */
  scores: Record<string, number>;
  /** Normalized scores per dimension (0 to 1) */
  normalizedScores: Record<string, number>;
  /** Overall confidence in the results */
  confidence: number;
  /** Total questions in the test */
  totalQuestions: number;
  /** Error message if success is false */
  error?: string;
}

/**
 * Get test definition by type
 */
function getTestDefinition(testType: string): TestDefinition | null {
  switch (testType) {
    case 'disc':
      return DiscTest;
    case 'holland':
      return HollandTest;
    default:
      return null;
  }
}

/**
 * Score a completed test
 */
export function scoreTest(testResult: TestResult): ScoringResult {
  const definition = getTestDefinition(testResult.testType);

  if (!definition) {
    return {
      success: false,
      scores: {},
      normalizedScores: {},
      confidence: 0,
      totalQuestions: 0,
      error: `Unknown test type: ${testResult.testType}`,
    };
  }

  // Check minimum questions
  if (testResult.answers.length < definition.minimumQuestions) {
    return {
      success: false,
      scores: {},
      normalizedScores: {},
      confidence: 0,
      totalQuestions: definition.questions.length,
      error: `Not enough answers: ${testResult.answers.length}/${definition.minimumQuestions} required`,
    };
  }

  // Initialize scores for each dimension
  const scores: Record<string, number> = {};
  const maxScores: Record<string, number> = {};

  for (const dim of definition.dimensions) {
    scores[dim.id] = 0;
    maxScores[dim.id] = 0;
  }

  // Build question lookup
  const questionMap = new Map<string, Question>();
  for (const q of definition.questions) {
    questionMap.set(q.id, q);
  }

  // Process answers
  let answeredCount = 0;

  for (const answer of testResult.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    answeredCount++;

    for (const dim of question.dimensions) {
      const weight = dim.weights[answer.value];
      if (typeof weight === 'number') {
        scores[dim.dimensionId] += weight;
      }

      // Calculate max possible for this dimension from this question
      const maxWeight = Math.max(...Object.values(dim.weights).filter((w): w is number => typeof w === 'number'));
      maxScores[dim.dimensionId] += maxWeight;
    }
  }

  // Normalize scores to 0-1 range
  const normalizedScores: Record<string, number> = {};
  for (const dim of definition.dimensions) {
    if (maxScores[dim.id] > 0) {
      normalizedScores[dim.id] = scores[dim.id] / maxScores[dim.id];
    } else {
      normalizedScores[dim.id] = 0;
    }
  }

  // Calculate confidence based on completion rate
  const completionRate = answeredCount / definition.questions.length;
  const confidence = calculateConfidence(completionRate, testResult.answers);

  return {
    success: true,
    scores,
    normalizedScores,
    confidence,
    totalQuestions: definition.questions.length,
  };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(completionRate: number, answers: Answer[]): number {
  // Base confidence from completion rate
  let confidence = completionRate;

  // Reduce confidence if there are very fast answers (potential random clicking)
  const fastAnswers = answers.filter(
    (a) => a.responseTimeMs !== undefined && a.responseTimeMs < 1000
  );
  if (fastAnswers.length > answers.length * 0.3) {
    confidence *= 0.7; // 30% penalty for too many fast answers
  }

  // Cap at 1.0
  return Math.min(1.0, confidence);
}
