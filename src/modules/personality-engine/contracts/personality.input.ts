/**
 * Personality Engine Input Contract
 *
 * Defines the structure of data coming INTO the engine.
 * This is the only way to provide data to the engine.
 */

/**
 * Supported test types
 */
export type TestType = 'disc' | 'holland';

/**
 * A single answer to a personality question
 */
export interface Answer {
  /** Question identifier */
  questionId: string;
  /** Selected value (interpretation depends on test type) */
  value: number | string;
  /** Optional: time taken to answer in milliseconds */
  responseTimeMs?: number;
}

/**
 * A completed test with all answers
 */
export interface TestResult {
  /** Type of test taken */
  testType: TestType;
  /** Version of the test (for backwards compatibility) */
  testVersion: string;
  /** All answers provided */
  answers: Answer[];
  /** When the test was completed */
  completedAt: string; // ISO date string
}

/**
 * Main input to the personality engine
 */
export interface PersonalityInput {
  /**
   * Unique identifier for this analysis session
   * Used for idempotency and caching
   */
  sessionId: string;

  /**
   * Test results to analyze
   * Can include multiple tests (e.g., both DISC and Holland)
   */
  testResults: TestResult[];

  /**
   * Optional context to influence signal generation
   * This is abstract - adapters translate BizBuzz context to this format
   */
  context?: {
    /** Purpose of the analysis (affects which signals are prioritized) */
    purpose?: 'job_matching' | 'team_fit' | 'profile_insight' | 'general';
    /** Locale for any localized output */
    locale?: string;
  };
}

/**
 * Validation helpers
 */
export function isValidTestType(type: string): type is TestType {
  return type === 'disc' || type === 'holland';
}

export function isValidInput(input: unknown): input is PersonalityInput {
  if (!input || typeof input !== 'object') return false;
  const obj = input as Record<string, unknown>;

  if (typeof obj.sessionId !== 'string') return false;
  if (!Array.isArray(obj.testResults)) return false;

  return obj.testResults.every((result) => {
    if (!result || typeof result !== 'object') return false;
    const r = result as Record<string, unknown>;
    return (
      isValidTestType(r.testType as string) &&
      typeof r.testVersion === 'string' &&
      Array.isArray(r.answers)
    );
  });
}
