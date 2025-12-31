/**
 * Domain Types
 *
 * Shared types for test definitions.
 */

/**
 * A dimension being measured by a test
 */
export interface Dimension {
  /** Unique identifier */
  id: string;
  /** Internal name (not for display) */
  name: string;
  /** Description of what this dimension measures */
  description: string;
}

/**
 * A single question in a test
 */
export interface Question {
  /** Unique identifier */
  id: string;
  /** Question text (can be localized by adapters) */
  text: string;
  /** Which dimensions this question contributes to */
  dimensions: {
    dimensionId: string;
    /** How much each answer value contributes to this dimension */
    weights: Record<string | number, number>;
  }[];
}

/**
 * A complete test definition
 */
export interface TestDefinition {
  /** Test type identifier */
  type: string;
  /** Current version */
  version: string;
  /** All dimensions measured */
  dimensions: Dimension[];
  /** All questions */
  questions: Question[];
  /** Minimum questions needed for valid results */
  minimumQuestions: number;
}
