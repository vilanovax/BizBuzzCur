/**
 * Scoring Layer Tests
 */

import { scoreTest } from '../scoring';
import type { TestResult } from '../contracts/personality.input';

describe('Scoring Layer', () => {
  describe('scoreTest - DISC', () => {
    it('should score a complete DISC test', () => {
      const testResult: TestResult = {
        testType: 'disc',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: [
          // D vs S questions - all choosing D (value: 1)
          { questionId: 'disc_1', value: 1 },
          { questionId: 'disc_2', value: 1 },
          { questionId: 'disc_3', value: 1 },
          { questionId: 'disc_4', value: 1 },
          { questionId: 'disc_5', value: 1 },
          // I vs C questions - all choosing C (value: 2)
          { questionId: 'disc_6', value: 2 },
          { questionId: 'disc_7', value: 2 },
          { questionId: 'disc_8', value: 2 },
          { questionId: 'disc_9', value: 2 },
          { questionId: 'disc_10', value: 2 },
          // More D questions
          { questionId: 'disc_11', value: 1 },
          { questionId: 'disc_12', value: 1 },
        ],
      };

      const result = scoreTest(testResult);

      expect(result.success).toBe(true);
      expect(result.scores).toHaveProperty('D');
      expect(result.scores).toHaveProperty('I');
      expect(result.scores).toHaveProperty('S');
      expect(result.scores).toHaveProperty('C');
      expect(result.scores.D).toBeGreaterThan(0);
      expect(result.scores.C).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should fail with too few answers', () => {
      const testResult: TestResult = {
        testType: 'disc',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: [
          { questionId: 'disc_1', value: 1 },
          { questionId: 'disc_2', value: 1 },
        ],
      };

      const result = scoreTest(testResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough answers');
    });

    it('should normalize scores to 0-1 range', () => {
      const testResult: TestResult = {
        testType: 'disc',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: Array.from({ length: 15 }, (_, i) => ({
          questionId: `disc_${i + 1}`,
          value: 1,
        })),
      };

      const result = scoreTest(testResult);

      expect(result.success).toBe(true);
      Object.values(result.normalizedScores).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('scoreTest - Holland', () => {
    it('should score a complete Holland test', () => {
      const testResult: TestResult = {
        testType: 'holland',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: [
          // Realistic questions - high scores
          { questionId: 'holland_r1', value: 5 },
          { questionId: 'holland_r2', value: 5 },
          { questionId: 'holland_r3', value: 5 },
          { questionId: 'holland_r4', value: 5 },
          // Investigative - mixed
          { questionId: 'holland_i1', value: 3 },
          { questionId: 'holland_i2', value: 4 },
          { questionId: 'holland_i3', value: 3 },
          { questionId: 'holland_i4', value: 4 },
          // Artistic - low
          { questionId: 'holland_a1', value: 1 },
          { questionId: 'holland_a2', value: 2 },
          { questionId: 'holland_a3', value: 1 },
          { questionId: 'holland_a4', value: 2 },
          // Social - medium
          { questionId: 'holland_s1', value: 3 },
          { questionId: 'holland_s2', value: 3 },
          { questionId: 'holland_s3', value: 3 },
          { questionId: 'holland_s4', value: 3 },
          // Enterprising
          { questionId: 'holland_e1', value: 4 },
          { questionId: 'holland_e2', value: 4 },
        ],
      };

      const result = scoreTest(testResult);

      expect(result.success).toBe(true);
      expect(result.scores).toHaveProperty('R');
      expect(result.scores).toHaveProperty('I');
      expect(result.scores).toHaveProperty('A');
      expect(result.scores).toHaveProperty('S');
      expect(result.scores).toHaveProperty('E');
      expect(result.scores).toHaveProperty('C');
      // R should be highest
      expect(result.normalizedScores.R).toBeGreaterThan(result.normalizedScores.A);
    });
  });

  describe('confidence calculation', () => {
    it('should reduce confidence for fast answers', () => {
      const normalAnswers: TestResult = {
        testType: 'disc',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: Array.from({ length: 15 }, (_, i) => ({
          questionId: `disc_${i + 1}`,
          value: 1,
          responseTimeMs: 3000, // Normal response time
        })),
      };

      const fastAnswers: TestResult = {
        testType: 'disc',
        testVersion: '1.0.0',
        completedAt: new Date().toISOString(),
        answers: Array.from({ length: 15 }, (_, i) => ({
          questionId: `disc_${i + 1}`,
          value: 1,
          responseTimeMs: 500, // Fast response time
        })),
      };

      const normalResult = scoreTest(normalAnswers);
      const fastResult = scoreTest(fastAnswers);

      expect(normalResult.confidence).toBeGreaterThan(fastResult.confidence);
    });
  });
});
