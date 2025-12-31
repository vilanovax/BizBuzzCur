/**
 * BizBuzz Adapter Tests
 */

import { ProfileAdapter } from '../adapters/profile.adapter';
import { JobAdapter } from '../adapters/job.adapter';
import type { Signal } from '../contracts/signal.schema';

describe('ProfileAdapter', () => {
  const sampleSignals: Signal[] = [
    {
      id: 'leadership_tendency',
      category: 'collaboration',
      value: 0.7,
      confidence: 0.8,
      sources: ['disc'],
    },
    {
      id: 'collaboration_style',
      category: 'collaboration',
      value: 0.5,
      confidence: 0.75,
      sources: ['disc', 'holland'],
    },
    {
      id: 'structure_preference',
      category: 'work_style',
      value: -0.4,
      confidence: 0.85,
      sources: ['disc'],
    },
    {
      id: 'decision_style',
      category: 'decision_making',
      value: 0.6,
      confidence: 0.7,
      sources: ['holland'],
    },
    {
      id: 'achievement_drive',
      category: 'motivation',
      value: -0.5,
      confidence: 0.8,
      sources: ['disc'],
    },
  ];

  describe('generateInsights', () => {
    it('should generate Persian insights from signals', () => {
      const insights = ProfileAdapter.generateInsights(sampleSignals);

      expect(insights.length).toBeGreaterThan(0);
      // All insights should have title and description
      insights.forEach((insight) => {
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.category).toBeDefined();
        expect(insight.strength).toBeGreaterThanOrEqual(0);
      });
    });

    it('should filter out weak signals', () => {
      const weakSignals: Signal[] = [
        {
          id: 'leadership_tendency',
          category: 'collaboration',
          value: 0.1, // Too weak
          confidence: 0.8,
          sources: ['disc'],
        },
      ];
      const insights = ProfileAdapter.generateInsights(weakSignals);
      expect(insights.length).toBe(0);
    });

    it('should return empty array for empty signals', () => {
      const insights = ProfileAdapter.generateInsights([]);
      expect(insights).toEqual([]);
    });
  });

  describe('generateWorkStyleSummary', () => {
    it('should generate work style classification', () => {
      const summary = ProfileAdapter.generateWorkStyleSummary(sampleSignals);

      expect(summary).toBeDefined();
      expect(summary.primaryTraits).toBeDefined();
      expect(Array.isArray(summary.primaryTraits)).toBe(true);
      expect(summary.collaborationMode).toBeDefined();
      expect(summary.decisionApproach).toBeDefined();
      expect(summary.environmentPreference).toBeDefined();
    });

    it('should handle edge case signals', () => {
      const extremeSignals: Signal[] = [
        {
          id: 'structure_preference',
          category: 'work_style',
          value: 1.0,
          confidence: 1.0,
          sources: ['disc'],
        },
        {
          id: 'pace_preference',
          category: 'work_style',
          value: -1.0,
          confidence: 1.0,
          sources: ['disc'],
        },
      ];

      const summary = ProfileAdapter.generateWorkStyleSummary(extremeSignals);
      expect(summary).toBeDefined();
      expect(summary.environmentPreference).toBe('structured');
    });
  });

  describe('getDisplayableSignals', () => {
    it('should filter signals by confidence and value', () => {
      const mixedSignals: Signal[] = [
        { id: 'leadership_tendency', category: 'collaboration', value: 0.7, confidence: 0.8, sources: ['disc'] },
        { id: 'collaboration_style', category: 'collaboration', value: 0.1, confidence: 0.8, sources: ['disc'] }, // Too weak
        { id: 'structure_preference', category: 'work_style', value: 0.5, confidence: 0.3, sources: ['disc'] }, // Too low confidence
      ];

      const displayable = ProfileAdapter.getDisplayableSignals(mixedSignals);
      expect(displayable.length).toBe(1);
      expect(displayable[0].id).toBe('leadership_tendency');
    });
  });
});

describe('JobAdapter', () => {
  const leadershipSignals: Signal[] = [
    {
      id: 'leadership_tendency',
      category: 'collaboration',
      value: 0.9,
      confidence: 0.85,
      sources: ['disc', 'holland'],
    },
    {
      id: 'risk_tolerance',
      category: 'decision_making',
      value: 0.7,
      confidence: 0.8,
      sources: ['disc'],
    },
    {
      id: 'decision_style',
      category: 'decision_making',
      value: 0.5,
      confidence: 0.75,
      sources: ['disc'],
    },
    {
      id: 'communication_style',
      category: 'collaboration',
      value: 0.6,
      confidence: 0.8,
      sources: ['disc'],
    },
  ];

  const analyticalSignals: Signal[] = [
    {
      id: 'decision_style',
      category: 'decision_making',
      value: 0.8,
      confidence: 0.85,
      sources: ['holland'],
    },
    {
      id: 'detail_orientation',
      category: 'work_style',
      value: 0.7,
      confidence: 0.8,
      sources: ['disc'],
    },
    {
      id: 'structure_preference',
      category: 'work_style',
      value: 0.6,
      confidence: 0.75,
      sources: ['disc'],
    },
    {
      id: 'task_approach',
      category: 'work_style',
      value: 0.5,
      confidence: 0.7,
      sources: ['disc'],
    },
  ];

  describe('getArchetypeRequirements', () => {
    it('should return requirements for leadership archetype', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');

      expect(requirements).toBeDefined();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements[0]).toHaveProperty('signalId');
      expect(requirements[0]).toHaveProperty('expectedValue');
      expect(requirements[0]).toHaveProperty('weight');
    });

    it('should return requirements for all archetypes', () => {
      const archetypes = ['leadership', 'creative', 'analytical', 'support', 'sales', 'operations'] as const;

      archetypes.forEach((archetype) => {
        const requirements = JobAdapter.getArchetypeRequirements(archetype);
        expect(requirements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('matchCandidateToJob', () => {
    it('should return match result with score', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(leadershipSignals, requirements);

      expect(match).toBeDefined();
      expect(match.overallScore).toBeGreaterThanOrEqual(0);
      expect(match.overallScore).toBeLessThanOrEqual(100);
    });

    it('should return high score for good match', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(leadershipSignals, requirements);
      expect(match.overallScore).toBeGreaterThan(60);
    });

    it('should return strength reasons for good matches', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(leadershipSignals, requirements);

      expect(match.strengthReasons).toBeDefined();
      expect(Array.isArray(match.strengthReasons)).toBe(true);
    });

    it('should return friction reasons array', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(analyticalSignals, requirements);

      expect(match.frictionReasons).toBeDefined();
      expect(Array.isArray(match.frictionReasons)).toBe(true);
    });

    it('should match analytical signals to analytical job', () => {
      const requirements = JobAdapter.getArchetypeRequirements('analytical');
      const match = JobAdapter.matchCandidateToJob(analyticalSignals, requirements);
      expect(match.overallScore).toBeGreaterThan(50);
    });

    it('should include signal matches details', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(leadershipSignals, requirements);

      expect(match.signalMatches).toBeDefined();
      expect(Array.isArray(match.signalMatches)).toBe(true);
      if (match.signalMatches.length > 0) {
        expect(match.signalMatches[0]).toHaveProperty('signalId');
        expect(match.signalMatches[0]).toHaveProperty('candidateValue');
        expect(match.signalMatches[0]).toHaveProperty('expectedValue');
        expect(match.signalMatches[0]).toHaveProperty('matchScore');
      }
    });
  });

  describe('generateMatchExplanation', () => {
    it('should generate Persian explanation for high match', () => {
      const requirements = JobAdapter.getArchetypeRequirements('leadership');
      const match = JobAdapter.matchCandidateToJob(leadershipSignals, requirements);
      const explanation = JobAdapter.generateMatchExplanation(match);

      expect(explanation).toBeDefined();
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });

    it('should include score in explanation', () => {
      const requirements = JobAdapter.getArchetypeRequirements('analytical');
      const match = JobAdapter.matchCandidateToJob(analyticalSignals, requirements);
      const explanation = JobAdapter.generateMatchExplanation(match);

      expect(explanation).toContain('٪'); // Persian percentage
    });
  });
});
