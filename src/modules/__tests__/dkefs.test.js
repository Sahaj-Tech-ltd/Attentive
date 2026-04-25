/**
 * D-KEFS Verbal Fluency Module Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDKEFSFluencyScores, getDKEFSSEM, scoresDiffer, scoreComparison } from '../../scoring/dkefs.js';
import { aggregateDKEFSResults } from '../../modules/dkefs.js';

describe('D-KEFS Verbal Fluency — Scoring', () => {
  describe('calculateDKEFSFluencyScores', () => {
    it('should compute FAS total and category total correctly', () => {
      const results = {
        letter_fluency: {
          F: { count: 14, words: ['fair', 'find'] },
          A: { count: 16, words: ['apple'] },
          S: { count: 12, words: ['sun'] },
        },
        category_fluency: {
          animals: { count: 28, words: ['dog'] },
          fruits: { count: 22, words: ['apple'] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      expect(scores.composites.fas.total).toBe(42);
      expect(scores.composites.category.total).toBe(50);
      expect(scores.composites.combined.total).toBe(92);
    });

    it('should return Very High for high FAS scores (43+)', () => {
      const results = {
        letter_fluency: {
          F: { count: 20, words: [] },
          A: { count: 20, words: [] },
          S: { count: 20, words: [] },
        },
        category_fluency: {
          animals: { count: 30, words: [] },
          fruits: { count: 30, words: [] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      expect(scores.composites.fas.interpretation).toBe('Very High');
      expect(scores.composites.fas.t_score).toBeGreaterThanOrEqual(65);
    });

    it('should return Low for low FAS scores (<18)', () => {
      const results = {
        letter_fluency: {
          F: { count: 5, words: [] },
          A: { count: 6, words: [] },
          S: { count: 4, words: [] },
        },
        category_fluency: {
          animals: { count: 10, words: [] },
          fruits: { count: 8, words: [] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      expect(scores.composites.fas.interpretation).toBe('Low');
      expect(scores.composites.fas.t_score).toBeLessThanOrEqual(40);
    });

    it('should handle zero entries gracefully', () => {
      const results = {
        letter_fluency: {
          F: { count: 0, words: [] },
          A: { count: 0, words: [] },
          S: { count: 0, words: [] },
        },
        category_fluency: {
          animals: { count: 0, words: [] },
          fruits: { count: 0, words: [] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      expect(scores.composites.fas.total).toBe(0);
      expect(scores.composites.fas.t_score).toBe(30); // floor at very low
      expect(scores.composites.category.total).toBe(0);
    });

    it('should compute individual subtest scores', () => {
      const results = {
        letter_fluency: {
          F: { count: 14, words: ['fair'] },
          A: { count: 10, words: [] },
          S: { count: 18, words: [] },
        },
        category_fluency: {
          animals: { count: 28, words: [] },
          fruits: { count: 15, words: [] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      expect(scores.subtests.F.raw).toBe(14);
      expect(scores.subtests.F.interpretation).toBe('Average');
      expect(scores.subtests.S.raw).toBe(18);
      expect(scores.subtests.S.interpretation).toBe('Very High');
      expect(scores.subtests.animals.raw).toBe(28);
      expect(scores.subtests.fruits.raw).toBe(15);
    });

    it('should compute FAS mean as average of F, A, S', () => {
      const results = {
        letter_fluency: {
          F: { count: 12, words: [] },
          A: { count: 18, words: [] },
          S: { count: 15, words: [] },
        },
        category_fluency: {
          animals: { count: 25, words: [] },
          fruits: { count: 20, words: [] },
        },
        summary: {},
      };

      const scores = calculateDKEFSFluencyScores(results);

      // (12 + 18 + 15) / 3 = 15
      expect(scores.composites.fas.mean).toBe(15);
    });
  });

  describe('getDKEFSSEM', () => {
    it('should return correct SEM values for each composite', () => {
      expect(getDKEFSSEM('fas')).toBe(3.5);
      expect(getDKEFSSEM('category')).toBe(3.0);
      expect(getDKEFSSEM('combined')).toBe(4.0);
    });
  });

  describe('scoresDiffer', () => {
    it('should return true when difference exceeds 1.65 SE', () => {
      // SE for fas = 3.5, so threshold = 1.65 * 3.5 = 5.775
      expect(scoresDiffer(40, 46, 'fas')).toBe(true);
      expect(scoresDiffer(40, 45, 'fas')).toBe(false);
    });

    it('should return false when difference is within threshold', () => {
      expect(scoresDiffer(50, 52, 'fas')).toBe(false);
      expect(scoresDiffer(50, 55, 'fas')).toBe(false);
    });
  });

  describe('scoreComparison', () => {
    it('should identify when letter fluency is relatively weaker', () => {
      const results = {
        letter_fluency: {
          F: { count: 10, words: [] },
          A: { count: 10, words: [] },
          S: { count: 10, words: [] },
        },
        category_fluency: {
          animals: { count: 30, words: [] },
          fruits: { count: 30, words: [] },
        },
        summary: {},
      };

      const comp = scoreComparison(results);

      expect(comp.fas_t).toBeLessThan(comp.category_t);
      expect(comp.interpretation).toBe('Letter fluency relatively weaker');
    });

    it('should identify when category fluency is relatively weaker', () => {
      const results = {
        letter_fluency: {
          F: { count: 20, words: [] },
          A: { count: 20, words: [] },
          S: { count: 20, words: [] },
        },
        category_fluency: {
          animals: { count: 15, words: [] },
          fruits: { count: 12, words: [] },
        },
        summary: {},
      };

      const comp = scoreComparison(results);

      expect(comp.category_t).toBeLessThan(comp.fas_t);
      expect(comp.interpretation).toBe('Category fluency relatively weaker');
    });
  });
});

describe('D-KEFS Verbal Fluency — Module Logic', () => {
  describe('aggregateDKEFSResults', () => {
    it('should aggregate letter fluency subtests (F, A, S)', () => {
      const mockData = [
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'F', word_count: 14, words: ['fair', 'find'] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'A', word_count: 16, words: ['apple'] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'S', word_count: 12, words: ['sun'] },
      ];

      const aggregated = aggregateDKEFSResults(mockData);

      expect(aggregated.letter_fluency.F.count).toBe(14);
      expect(aggregated.letter_fluency.A.count).toBe(16);
      expect(aggregated.letter_fluency.S.count).toBe(12);
      expect(aggregated.letter_fluency.total_fas).toBe(42);
    });

    it('should aggregate category fluency subtests (animals, fruits)', () => {
      const mockData = [
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'animals', word_count: 28, words: ['dog'] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'fruits', word_count: 22, words: ['apple'] },
      ];

      const aggregated = aggregateDKEFSResults(mockData);

      expect(aggregated.category_fluency.animals.count).toBe(28);
      expect(aggregated.category_fluency.fruits.count).toBe(22);
      expect(aggregated.category_fluency.total_category).toBe(50);
    });

    it('should compute combined summary', () => {
      const mockData = [
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'F', word_count: 14, words: [] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'A', word_count: 16, words: [] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'S', word_count: 12, words: [] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'animals', word_count: 28, words: [] },
        { module: 'dkefs_verbal_fluency', trial_type: 'fluency', subtest: 'fruits', word_count: 22, words: [] },
      ];

      const aggregated = aggregateDKEFSResults(mockData);

      expect(aggregated.summary.combined_total).toBe(92);
      expect(aggregated.summary.combined_fas_score).toBe(42);
      expect(aggregated.summary.combined_category_score).toBe(50);
    });

    it('should return empty structure when no fluency trials found', () => {
      const mockData = [
        { module: 'dkefs_verbal_fluency', trial_type: 'intro' },
        { module: 'dkefs_verbal_fluency', trial_type: 'rest' },
      ];

      const aggregated = aggregateDKEFSResults(mockData);

      expect(aggregated.letter_fluency.F).toBe(null);
      expect(aggregated.category_fluency.animals).toBe(null);
      expect(aggregated.summary.total_words).toBe(0);
    });
  });
});