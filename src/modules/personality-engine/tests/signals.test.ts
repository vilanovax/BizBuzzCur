/**
 * Signal Generation Tests
 */

import { generateSignals } from '../signals';
import { discToSignals } from '../signals/disc.mapper';
import { hollandToSignals } from '../signals/holland.mapper';
import type { TestType } from '../contracts/personality.input';

describe('Signal Generation', () => {
  describe('discToSignals', () => {
    it('should generate signals from DISC scores', () => {
      const scores = { D: 0.8, I: 0.3, S: 0.2, C: 0.6 };
      const signals = discToSignals(scores, 0.8);

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.every((s) => s.sources.includes('disc'))).toBe(true);
      expect(signals.every((s) => s.confidence === 0.8)).toBe(true);
    });

    it('should map high D to positive leadership tendency', () => {
      const highD = { D: 0.9, I: 0.3, S: 0.1, C: 0.4 };
      const signals = discToSignals(highD, 0.8);

      const leadership = signals.find((s) => s.id === 'leadership_tendency');
      expect(leadership).toBeDefined();
      expect(leadership!.value).toBeGreaterThan(0);
    });

    it('should map high S to negative leadership tendency', () => {
      const highS = { D: 0.1, I: 0.3, S: 0.9, C: 0.4 };
      const signals = discToSignals(highS, 0.8);

      const leadership = signals.find((s) => s.id === 'leadership_tendency');
      expect(leadership).toBeDefined();
      expect(leadership!.value).toBeLessThan(0);
    });

    it('should generate all expected signal categories', () => {
      const scores = { D: 0.5, I: 0.5, S: 0.5, C: 0.5 };
      const signals = discToSignals(scores, 0.8);

      const categories = new Set(signals.map((s) => s.category));
      expect(categories.has('collaboration')).toBe(true);
      expect(categories.has('decision_making')).toBe(true);
      expect(categories.has('work_style')).toBe(true);
      expect(categories.has('motivation')).toBe(true);
      expect(categories.has('environment')).toBe(true);
    });
  });

  describe('hollandToSignals', () => {
    it('should generate signals from Holland scores', () => {
      const scores = { R: 0.8, I: 0.6, A: 0.3, S: 0.5, E: 0.7, C: 0.4 };
      const signals = hollandToSignals(scores, 0.7);

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.every((s) => s.sources.includes('holland'))).toBe(true);
    });

    it('should map high E to positive leadership tendency', () => {
      const highE = { R: 0.3, I: 0.4, A: 0.3, S: 0.2, E: 0.9, C: 0.4 };
      const signals = hollandToSignals(highE, 0.8);

      const leadership = signals.find((s) => s.id === 'leadership_tendency');
      expect(leadership).toBeDefined();
      expect(leadership!.value).toBeGreaterThan(0);
    });

    it('should map high S to positive collaboration style', () => {
      const highS = { R: 0.2, I: 0.4, A: 0.3, S: 0.9, E: 0.3, C: 0.4 };
      const signals = hollandToSignals(highS, 0.8);

      const collab = signals.find((s) => s.id === 'collaboration_style');
      expect(collab).toBeDefined();
      expect(collab!.value).toBeGreaterThan(0);
    });
  });

  describe('generateSignals - merging', () => {
    it('should merge signals from multiple test sources', () => {
      const discScores = { D: 0.8, I: 0.3, S: 0.2, C: 0.6 };
      const hollandScores = { R: 0.5, I: 0.6, A: 0.3, S: 0.2, E: 0.8, C: 0.5 };

      const allScores = new Map<TestType, Record<string, number>>([
        ['disc', discScores],
        ['holland', hollandScores],
      ]);

      const signals = generateSignals(allScores);

      // Leadership should be merged from both sources
      const leadership = signals.find((s) => s.id === 'leadership_tendency');
      expect(leadership).toBeDefined();
      expect(leadership!.sources).toContain('disc');
      expect(leadership!.sources).toContain('holland');
    });

    it('should increase confidence when sources agree', () => {
      // Both tests indicating high leadership
      const discScores = { D: 0.9, I: 0.3, S: 0.1, C: 0.4 };
      const hollandScores = { R: 0.5, I: 0.4, A: 0.3, S: 0.1, E: 0.9, C: 0.4 };

      const allScores = new Map<TestType, Record<string, number>>([
        ['disc', discScores],
        ['holland', hollandScores],
      ]);

      const signals = generateSignals(allScores);
      const leadership = signals.find((s) => s.id === 'leadership_tendency');

      // Confidence should be boosted
      expect(leadership!.confidence).toBeGreaterThan(0.7);
    });

    it('should sort signals by purpose priority', () => {
      const scores = new Map<TestType, Record<string, number>>([
        ['disc', { D: 0.5, I: 0.5, S: 0.5, C: 0.5 }],
      ]);

      const jobSignals = generateSignals(scores, 'job_matching');
      const teamSignals = generateSignals(scores, 'team_fit');

      // Job matching should prioritize work_style
      expect(jobSignals[0].category).toBe('work_style');

      // Team fit should prioritize collaboration
      expect(teamSignals[0].category).toBe('collaboration');
    });
  });

  describe('signal value bounds', () => {
    it('should keep all signal values within -1 to 1', () => {
      // Extreme scores
      const discScores = { D: 1.0, I: 0.0, S: 0.0, C: 1.0 };
      const hollandScores = { R: 1.0, I: 1.0, A: 0.0, S: 0.0, E: 1.0, C: 1.0 };

      const allScores = new Map<TestType, Record<string, number>>([
        ['disc', discScores],
        ['holland', hollandScores],
      ]);

      const signals = generateSignals(allScores);

      signals.forEach((signal) => {
        expect(signal.value).toBeGreaterThanOrEqual(-1);
        expect(signal.value).toBeLessThanOrEqual(1);
      });
    });
  });
});
