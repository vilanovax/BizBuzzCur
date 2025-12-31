/**
 * Test Domain Definitions
 *
 * Each test defines:
 * - Questions
 * - Dimensions being measured
 * - Scoring rules
 */

export { DiscTest, DISC_DIMENSIONS, type DiscDimension } from './disc.domain';
export { HollandTest, HOLLAND_DIMENSIONS, type HollandDimension } from './holland.domain';
export type { TestDefinition, Question, Dimension } from './types';
