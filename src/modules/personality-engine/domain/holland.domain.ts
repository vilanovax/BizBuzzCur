/**
 * Holland (RIASEC) Test Domain
 *
 * Holland's theory measures six vocational interest types:
 * - R (Realistic): Practical, hands-on, mechanical
 * - I (Investigative): Analytical, intellectual, scientific
 * - A (Artistic): Creative, expressive, independent
 * - S (Social): Helping, teaching, cooperative
 * - E (Enterprising): Persuasive, competitive, leadership
 * - C (Conventional): Organized, detail-oriented, structured
 *
 * This is a standard 24-question assessment.
 */

import type { TestDefinition, Dimension, Question } from './types';

export type HollandDimension = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export const HOLLAND_DIMENSIONS: Record<HollandDimension, Dimension> = {
  R: {
    id: 'R',
    name: 'Realistic',
    description: 'Practical, hands-on, mechanical, nature-oriented',
  },
  I: {
    id: 'I',
    name: 'Investigative',
    description: 'Analytical, intellectual, scientific, curious',
  },
  A: {
    id: 'A',
    name: 'Artistic',
    description: 'Creative, expressive, independent, intuitive',
  },
  S: {
    id: 'S',
    name: 'Social',
    description: 'Helping, teaching, cooperative, empathetic',
  },
  E: {
    id: 'E',
    name: 'Enterprising',
    description: 'Persuasive, competitive, leadership, ambitious',
  },
  C: {
    id: 'C',
    name: 'Conventional',
    description: 'Organized, detail-oriented, structured, reliable',
  },
};

/**
 * Holland Questions
 *
 * Each question is rated on a 1-5 scale (strongly disagree to strongly agree).
 * Questions are grouped by dimension (4 questions per dimension).
 */
const HOLLAND_QUESTIONS: Question[] = [
  // Realistic (R) - 4 questions
  {
    id: 'holland_r1',
    text: 'I enjoy working with my hands to build or fix things',
    dimensions: [
      { dimensionId: 'R', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_r2',
    text: 'I prefer practical tasks over abstract discussions',
    dimensions: [
      { dimensionId: 'R', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_r3',
    text: 'I like working with tools, machines, or equipment',
    dimensions: [
      { dimensionId: 'R', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_r4',
    text: 'I enjoy outdoor activities or physical work',
    dimensions: [
      { dimensionId: 'R', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },

  // Investigative (I) - 4 questions
  {
    id: 'holland_i1',
    text: 'I enjoy solving complex problems and puzzles',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_i2',
    text: 'I like to understand how things work at a deep level',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_i3',
    text: 'I prefer to research thoroughly before making decisions',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_i4',
    text: 'I am curious about scientific or technical subjects',
    dimensions: [
      { dimensionId: 'I', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },

  // Artistic (A) - 4 questions
  {
    id: 'holland_a1',
    text: 'I enjoy expressing myself through art, music, or writing',
    dimensions: [
      { dimensionId: 'A', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_a2',
    text: 'I prefer creative work over routine tasks',
    dimensions: [
      { dimensionId: 'A', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_a3',
    text: 'I value originality and imagination in my work',
    dimensions: [
      { dimensionId: 'A', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_a4',
    text: 'I am drawn to aesthetically pleasing designs and ideas',
    dimensions: [
      { dimensionId: 'A', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },

  // Social (S) - 4 questions
  {
    id: 'holland_s1',
    text: 'I enjoy helping others solve their problems',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_s2',
    text: 'I like teaching or mentoring others',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_s3',
    text: 'I prefer work that involves cooperating with others',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_s4',
    text: 'I am good at understanding other people\'s feelings',
    dimensions: [
      { dimensionId: 'S', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },

  // Enterprising (E) - 4 questions
  {
    id: 'holland_e1',
    text: 'I enjoy persuading others to my point of view',
    dimensions: [
      { dimensionId: 'E', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_e2',
    text: 'I like taking on leadership roles',
    dimensions: [
      { dimensionId: 'E', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_e3',
    text: 'I am motivated by competition and achievement',
    dimensions: [
      { dimensionId: 'E', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_e4',
    text: 'I enjoy selling ideas or products to others',
    dimensions: [
      { dimensionId: 'E', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },

  // Conventional (C) - 4 questions
  {
    id: 'holland_c1',
    text: 'I prefer work with clear rules and procedures',
    dimensions: [
      { dimensionId: 'C', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_c2',
    text: 'I enjoy organizing information and keeping records',
    dimensions: [
      { dimensionId: 'C', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_c3',
    text: 'I am detail-oriented and thorough in my work',
    dimensions: [
      { dimensionId: 'C', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
  {
    id: 'holland_c4',
    text: 'I prefer structured environments over ambiguous ones',
    dimensions: [
      { dimensionId: 'C', weights: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    ],
  },
];

export const HollandTest: TestDefinition = {
  type: 'holland',
  version: '1.0.0',
  dimensions: Object.values(HOLLAND_DIMENSIONS),
  questions: HOLLAND_QUESTIONS,
  minimumQuestions: 18, // 75% of questions for valid results
};
