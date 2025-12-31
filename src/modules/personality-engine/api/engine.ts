/**
 * Personality Engine - Main API
 *
 * This is the single entry point for all personality analysis.
 * Stateless, pure functions, JSON in/out.
 */

import type {
  PersonalityInput,
  PersonalityOutput,
  TestType,
} from '../contracts';
import {
  isValidInput,
  isValidTestType,
} from '../contracts/personality.input';
import {
  createErrorOutput,
  createSuccessOutput,
  ISSUE_CODES,
  type AnalysisIssue,
  type AnalysisMetadata,
  type ProcessedTest,
} from '../contracts/personality.output';
import type { Signal } from '../contracts/signal.schema';
import { scoreTest } from '../scoring';
import { generateSignals } from '../signals';

const ENGINE_VERSION = '1.0.0';

/**
 * Main personality engine interface
 */
export const PersonalityEngine = {
  /**
   * Analyze personality test results and generate behavioral signals
   *
   * @param input - Test results and context
   * @returns Behavioral signals with confidence scores
   */
  analyze(input: unknown): PersonalityOutput {
    // Validate input
    if (!isValidInput(input)) {
      const sessionId = (input as Record<string, unknown>)?.sessionId;
      return createErrorOutput(typeof sessionId === 'string' ? sessionId : 'unknown', [
        {
          severity: 'error',
          code: ISSUE_CODES.INVALID_INPUT,
          message: 'Invalid input format',
        },
      ]);
    }

    const issues: AnalysisIssue[] = [];
    const processedTests: ProcessedTest[] = [];
    const allScores: Map<TestType, Record<string, number>> = new Map();

    // Process each test
    for (const testResult of input.testResults) {
      // Validate test type
      if (!isValidTestType(testResult.testType)) {
        issues.push({
          severity: 'warning',
          code: ISSUE_CODES.UNKNOWN_TEST_TYPE,
          message: `Unknown test type: ${testResult.testType}`,
          testType: testResult.testType,
        });
        continue;
      }

      // Score the test
      const scoringResult = scoreTest(testResult);

      if (!scoringResult.success) {
        issues.push({
          severity: 'warning',
          code: ISSUE_CODES.SCORING_ERROR,
          message: scoringResult.error || 'Scoring failed',
          testType: testResult.testType,
        });
        continue;
      }

      // Track processed test
      processedTests.push({
        testType: testResult.testType,
        testVersion: testResult.testVersion,
        questionsAnswered: testResult.answers.length,
        totalQuestions: scoringResult.totalQuestions,
        isComplete: testResult.answers.length >= scoringResult.totalQuestions,
        rawScores: scoringResult.scores,
      });

      // Add low confidence warning if applicable
      if (scoringResult.confidence < 0.5) {
        issues.push({
          severity: 'warning',
          code: ISSUE_CODES.LOW_CONFIDENCE,
          message: `Low confidence in ${testResult.testType} results`,
          testType: testResult.testType,
        });
      }

      allScores.set(testResult.testType, scoringResult.scores);
    }

    // Check if we have any valid tests
    if (processedTests.length === 0) {
      return createErrorOutput(input.sessionId, [
        {
          severity: 'error',
          code: ISSUE_CODES.TOO_FEW_ANSWERS,
          message: 'No valid tests to analyze',
        },
        ...issues,
      ]);
    }

    // Generate signals from all scores
    const signals = generateSignals(allScores, input.context?.purpose);

    // Build metadata
    const metadata: AnalysisMetadata = {
      analysisId: crypto.randomUUID(),
      sessionId: input.sessionId,
      analyzedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      testsProcessed: processedTests,
    };

    // Create output
    const output = createSuccessOutput(metadata, signals);

    // Add issues if any
    if (issues.length > 0) {
      output.status = 'partial';
      output.issues = issues;
    }

    return output;
  },

  /**
   * Get metadata about a specific signal
   * Useful for adapters that need to generate human-readable descriptions
   */
  getSignalMetadata(signalId: string) {
    const { SIGNAL_METADATA } = require('../contracts/signal.schema');
    return SIGNAL_METADATA[signalId] || null;
  },

  /**
   * Get all available signal metadata
   */
  getAllSignalMetadata() {
    const { SIGNAL_METADATA } = require('../contracts/signal.schema');
    return SIGNAL_METADATA;
  },

  /**
   * Get engine version
   */
  getVersion(): string {
    return ENGINE_VERSION;
  },
};
