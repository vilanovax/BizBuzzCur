/**
 * Personality Engine
 *
 * A modular, extract-ready engine for generating behavioral and work-style signals.
 *
 * This engine:
 * - Generates behavioral signals from personality assessments
 * - Does NOT expose personality labels (no MBTI types, no DISC letters)
 * - Provides abstract, context-agnostic signals for consumption
 *
 * Architecture:
 * - /contracts - Input/output schemas (the API contract)
 * - /domain - Test definitions (DISC, Holland, etc.)
 * - /scoring - Raw score normalization and confidence calculation
 * - /signals - Signal generation from normalized scores
 * - /adapters - BizBuzz-specific integrations
 * - /api - Internal API surface
 * - /tests - Unit tests
 *
 * Usage:
 *   import { PersonalityEngine } from '@/modules/personality-engine';
 *   const result = PersonalityEngine.analyze(input);
 */

export { PersonalityEngine } from './api/engine';
export type {
  PersonalityInput,
  PersonalityOutput,
  Signal,
  SignalCategory,
  TestType,
} from './contracts';
