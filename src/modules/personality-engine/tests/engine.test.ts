/**
 * Personality Engine Integration Tests
 */

import { PersonalityEngine } from '../api/engine';
import type { PersonalityInput, TestResult } from '../contracts/personality.input';

describe('PersonalityEngine', () => {
  describe('analyze', () => {
    it('should successfully analyze a valid DISC test', () => {
      const input: PersonalityInput = {
        sessionId: 'test-session-1',
        testResults: [
          {
            testType: 'disc',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateDISCAnswers(15),
          },
        ],
      };

      const output = PersonalityEngine.analyze(input);

      expect(output.status).toBe('success');
      expect(output.signals.length).toBeGreaterThan(0);
      expect(output.metadata?.testsProcessed.length).toBe(1);
      expect(output.metadata?.testsProcessed[0].testType).toBe('disc');
    });

    it('should successfully analyze a valid Holland test', () => {
      const input: PersonalityInput = {
        sessionId: 'test-session-2',
        testResults: [
          {
            testType: 'holland',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateHollandAnswers(20),
          },
        ],
      };

      const output = PersonalityEngine.analyze(input);

      expect(output.status).toBe('success');
      expect(output.signals.length).toBeGreaterThan(0);
      expect(output.metadata?.testsProcessed[0].testType).toBe('holland');
    });

    it('should merge signals from multiple tests', () => {
      const input: PersonalityInput = {
        sessionId: 'test-session-3',
        testResults: [
          {
            testType: 'disc',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateDISCAnswers(15),
          },
          {
            testType: 'holland',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateHollandAnswers(20),
          },
        ],
      };

      const output = PersonalityEngine.analyze(input);

      expect(output.status).toBe('success');
      expect(output.metadata?.testsProcessed.length).toBe(2);

      // Check that some signals have multiple sources
      const multiSourceSignals = output.signals.filter(
        (s) => s.sources.length > 1
      );
      expect(multiSourceSignals.length).toBeGreaterThan(0);
    });

    it('should return error for invalid input', () => {
      const output = PersonalityEngine.analyze(null as any);

      expect(output.status).toBe('error');
      expect(output.issues?.some((i) => i.code === 'INVALID_INPUT')).toBe(true);
    });

    it('should return error for empty test results', () => {
      const input: PersonalityInput = {
        sessionId: 'test-session-4',
        testResults: [],
      };

      const output = PersonalityEngine.analyze(input);

      expect(output.status).toBe('error');
    });

    it('should return partial status when some tests fail', () => {
      const input: PersonalityInput = {
        sessionId: 'test-session-5',
        testResults: [
          {
            testType: 'disc',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateDISCAnswers(15), // Valid
          },
          {
            testType: 'disc',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: [{ questionId: 'disc_1', value: 1 }], // Too few
          },
        ],
      };

      const output = PersonalityEngine.analyze(input);

      // Should still succeed but with warning
      expect(['success', 'partial']).toContain(output.status);
    });

    it('should respect purpose for signal sorting', () => {
      const baseInput: PersonalityInput = {
        sessionId: 'test-session-6',
        testResults: [
          {
            testType: 'disc',
            testVersion: '1.0.0',
            completedAt: new Date().toISOString(),
            answers: generateDISCAnswers(15),
          },
        ],
      };

      const jobMatchInput: PersonalityInput = {
        ...baseInput,
        context: { purpose: 'job_matching' },
      };

      const teamFitInput: PersonalityInput = {
        ...baseInput,
        context: { purpose: 'team_fit' },
      };

      const jobOutput = PersonalityEngine.analyze(jobMatchInput);
      const teamOutput = PersonalityEngine.analyze(teamFitInput);

      // Both should succeed
      expect(jobOutput.status).toBe('success');
      expect(teamOutput.status).toBe('success');

      // First signals should have different categories based on purpose
      if (jobOutput.signals.length > 0 && teamOutput.signals.length > 0) {
        // Job matching prioritizes work_style
        expect(jobOutput.signals[0].category).toBe('work_style');
        // Team fit prioritizes collaboration
        expect(teamOutput.signals[0].category).toBe('collaboration');
      }
    });
  });

  describe('getVersion', () => {
    it('should return a valid version string', () => {
      const version = PersonalityEngine.getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('getSignalMetadata', () => {
    it('should return metadata for valid signal ID', () => {
      const metadata = PersonalityEngine.getSignalMetadata('leadership_tendency');

      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('leadership_tendency');
      expect(metadata.category).toBeDefined();
    });

    it('should return null for invalid signal ID', () => {
      const metadata = PersonalityEngine.getSignalMetadata('invalid_signal');
      expect(metadata).toBeNull();
    });
  });

  describe('getAllSignalMetadata', () => {
    it('should return all signal metadata', () => {
      const allMetadata = PersonalityEngine.getAllSignalMetadata();

      expect(Object.keys(allMetadata).length).toBeGreaterThan(10);
      expect(allMetadata['leadership_tendency']).toBeDefined();
      expect(allMetadata['collaboration_style']).toBeDefined();
    });
  });
});

// Helper functions to generate test data
function generateDISCAnswers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    questionId: `disc_${i + 1}`,
    value: (i % 2) + 1, // Alternate between 1 and 2
    responseTimeMs: 2000 + Math.random() * 2000,
  }));
}

function generateHollandAnswers(count: number) {
  const dimensions = ['r', 'i', 'a', 's', 'e', 'c'];
  return Array.from({ length: count }, (_, i) => ({
    questionId: `holland_${dimensions[i % 6]}${Math.floor(i / 6) + 1}`,
    value: 1 + Math.floor(Math.random() * 5), // 1-5
    responseTimeMs: 2000 + Math.random() * 2000,
  }));
}
