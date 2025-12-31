/**
 * DISC Lite Test Domain
 *
 * DISC measures four behavioral dimensions:
 * - D (Dominance): Direct, results-oriented, decisive
 * - I (Influence): Outgoing, enthusiastic, optimistic
 * - S (Steadiness): Patient, reliable, team-oriented
 * - C (Conscientiousness): Analytical, precise, systematic
 *
 * This is a "lite" version with 20 questions for quick assessment.
 */

import type { TestDefinition, Dimension, Question } from './types';

export type DiscDimension = 'D' | 'I' | 'S' | 'C';

export const DISC_DIMENSIONS: Record<DiscDimension, Dimension> = {
  D: {
    id: 'D',
    name: 'Dominance',
    description: 'Direct, results-oriented, decisive, competitive',
  },
  I: {
    id: 'I',
    name: 'Influence',
    description: 'Outgoing, enthusiastic, optimistic, collaborative',
  },
  S: {
    id: 'S',
    name: 'Steadiness',
    description: 'Patient, reliable, team-oriented, supportive',
  },
  C: {
    id: 'C',
    name: 'Conscientiousness',
    description: 'Analytical, precise, systematic, quality-focused',
  },
};

/**
 * DISC Lite Questions
 *
 * Each question is a forced-choice between two options.
 * Answer 1 = first option, Answer 2 = second option
 *
 * Questions are designed to contrast different dimensions.
 */
const DISC_QUESTIONS: Question[] = [
  // D vs S contrasts
  {
    id: 'disc_1',
    text: 'When facing a challenge, I prefer to: (1) Take charge immediately (2) Carefully assess the situation first',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_2',
    text: 'In team settings, I typically: (1) Push for quick decisions (2) Ensure everyone is comfortable',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_3',
    text: 'When there is conflict, I: (1) Address it directly (2) Try to find common ground',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_4',
    text: 'I am more motivated by: (1) Achieving results (2) Maintaining harmony',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_5',
    text: 'My communication style is: (1) Direct and to the point (2) Patient and supportive',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },

  // I vs C contrasts
  {
    id: 'disc_6',
    text: 'When starting a project, I focus on: (1) Building enthusiasm (2) Analyzing requirements',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_7',
    text: 'I prefer to make decisions based on: (1) Gut feeling and people input (2) Data and careful analysis',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_8',
    text: 'In meetings, I am more likely to: (1) Energize the group (2) Take detailed notes',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_9',
    text: 'I value: (1) Recognition and collaboration (2) Accuracy and quality',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_10',
    text: 'When explaining ideas, I: (1) Use stories and enthusiasm (2) Present facts and logic',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },

  // D vs I contrasts
  {
    id: 'disc_11',
    text: 'When leading, I focus on: (1) Getting results (2) Inspiring the team',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'I', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_12',
    text: 'I prefer environments that are: (1) Competitive (2) Collaborative and fun',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'I', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_13',
    text: 'My energy comes from: (1) Winning and achieving (2) Connecting with people',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'I', weights: { 1: 0, 2: 2 } },
    ],
  },

  // S vs C contrasts
  {
    id: 'disc_14',
    text: 'I prefer work that is: (1) Predictable and stable (2) Detailed and complex',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_15',
    text: 'When supporting others, I: (1) Offer emotional support (2) Provide practical solutions',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_16',
    text: 'I am known for being: (1) Loyal and dependable (2) Thorough and precise',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },

  // Mixed contrasts
  {
    id: 'disc_17',
    text: 'Under pressure, I: (1) Take control (2) Stay calm and steady',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_18',
    text: 'I approach change by: (1) Embracing it enthusiastically (2) Evaluating it carefully',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_19',
    text: 'My ideal role involves: (1) Making important decisions (2) Helping the team succeed',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'S', weights: { 1: 0, 2: 2 } },
    ],
  },
  {
    id: 'disc_20',
    text: 'I prefer feedback that is: (1) Quick and direct (2) Detailed and constructive',
    dimensions: [
      { dimensionId: 'D', weights: { 1: 2, 2: 0 } },
      { dimensionId: 'C', weights: { 1: 0, 2: 2 } },
    ],
  },
];

export const DiscTest: TestDefinition = {
  type: 'disc',
  version: '1.0.0',
  dimensions: Object.values(DISC_DIMENSIONS),
  questions: DISC_QUESTIONS,
  minimumQuestions: 12, // 60% of questions for valid results
};
