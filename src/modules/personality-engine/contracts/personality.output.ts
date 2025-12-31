/**
 * Personality Engine Output Contract
 *
 * Defines the structure of data coming OUT of the engine.
 * This is the only format consumers will receive.
 */

import type { Signal, SignalCategory } from './signal.schema';
import type { TestType } from './personality.input';

/**
 * Status of the analysis
 */
export type AnalysisStatus = 'success' | 'partial' | 'error';

/**
 * Information about a processed test
 */
export interface ProcessedTest {
  /** Type of test that was processed */
  testType: TestType;
  /** Version of the test */
  testVersion: string;
  /** Number of questions answered */
  questionsAnswered: number;
  /** Total questions in the test */
  totalQuestions: number;
  /** Whether the test was fully completed */
  isComplete: boolean;
  /** Test-specific raw scores (internal, not for display) */
  rawScores: Record<string, number>;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  /** Unique identifier for this analysis */
  analysisId: string;
  /** Session ID from input */
  sessionId: string;
  /** When analysis was performed */
  analyzedAt: string; // ISO date string
  /** Engine version used */
  engineVersion: string;
  /** Which tests were processed */
  testsProcessed: ProcessedTest[];
}

/**
 * Signal group for easier consumption
 */
export interface SignalGroup {
  /** Category of signals in this group */
  category: SignalCategory;
  /** All signals in this category */
  signals: Signal[];
  /** Average confidence for this category */
  averageConfidence: number;
}

/**
 * Main output from the personality engine
 */
export interface PersonalityOutput {
  /**
   * Status of the analysis
   * - success: All tests processed successfully
   * - partial: Some tests had issues but signals were generated
   * - error: Analysis failed
   */
  status: AnalysisStatus;

  /**
   * Analysis metadata
   */
  metadata: AnalysisMetadata;

  /**
   * All generated signals (flat list)
   */
  signals: Signal[];

  /**
   * Signals grouped by category (for easier consumption)
   */
  signalGroups: SignalGroup[];

  /**
   * Overall confidence score (0.0 to 1.0)
   * Weighted average of all signal confidences
   */
  overallConfidence: number;

  /**
   * Errors or warnings encountered during analysis
   */
  issues?: AnalysisIssue[];
}

/**
 * An issue encountered during analysis
 */
export interface AnalysisIssue {
  /** Issue severity */
  severity: 'warning' | 'error';
  /** Issue code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Which test caused the issue (if applicable) */
  testType?: TestType;
}

/**
 * Error codes for common issues
 */
export const ISSUE_CODES = {
  // Input issues
  INVALID_INPUT: 'INVALID_INPUT',
  UNKNOWN_TEST_TYPE: 'UNKNOWN_TEST_TYPE',
  INVALID_TEST_VERSION: 'INVALID_TEST_VERSION',

  // Completion issues
  INCOMPLETE_TEST: 'INCOMPLETE_TEST',
  TOO_FEW_ANSWERS: 'TOO_FEW_ANSWERS',

  // Processing issues
  SCORING_ERROR: 'SCORING_ERROR',
  SIGNAL_GENERATION_ERROR: 'SIGNAL_GENERATION_ERROR',

  // Confidence issues
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  INCONSISTENT_ANSWERS: 'INCONSISTENT_ANSWERS',
} as const;

/**
 * Factory function to create a successful output
 */
export function createSuccessOutput(
  metadata: AnalysisMetadata,
  signals: Signal[]
): PersonalityOutput {
  const signalGroups = groupSignalsByCategory(signals);
  const overallConfidence = calculateOverallConfidence(signals);

  return {
    status: 'success',
    metadata,
    signals,
    signalGroups,
    overallConfidence,
  };
}

/**
 * Factory function to create an error output
 */
export function createErrorOutput(
  sessionId: string,
  issues: AnalysisIssue[]
): PersonalityOutput {
  return {
    status: 'error',
    metadata: {
      analysisId: crypto.randomUUID(),
      sessionId,
      analyzedAt: new Date().toISOString(),
      engineVersion: '1.0.0',
      testsProcessed: [],
    },
    signals: [],
    signalGroups: [],
    overallConfidence: 0,
    issues,
  };
}

/**
 * Helper to group signals by category
 */
function groupSignalsByCategory(signals: Signal[]): SignalGroup[] {
  const groups = new Map<SignalCategory, Signal[]>();

  for (const signal of signals) {
    const existing = groups.get(signal.category) || [];
    existing.push(signal);
    groups.set(signal.category, existing);
  }

  return Array.from(groups.entries()).map(([category, categorySignals]) => ({
    category,
    signals: categorySignals,
    averageConfidence:
      categorySignals.reduce((sum, s) => sum + s.confidence, 0) /
      categorySignals.length,
  }));
}

/**
 * Helper to calculate overall confidence
 */
function calculateOverallConfidence(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  return signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
}
