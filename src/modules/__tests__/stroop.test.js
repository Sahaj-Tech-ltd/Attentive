/**
 * Victoria Stroop Module Tests
 * Scoring functions and sequence generation tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateStroopScores,
  getStroopTscore,
  calculateInterferenceScore,
  interpretInterference,
  getAgeGroup,
} from '../../scoring/stroop.js';
import {
  generateColorSequence,
  generateConflictSequence,
  getConflictingColor,
  shuffle,
} from '../stroop.js';

describe('Stroop — scoring utilities', () => {
  describe('getAgeGroup', () => {
    it('returns correct age group', () => {
      expect(getAgeGroup(25)).toBe('18-29');
      expect(getAgeGroup(35)).toBe('30-44');
      expect(getAgeGroup(50)).toBe('45-59');
      expect(getAgeGroup(65)).toBe('60-69');
      expect(getAgeGroup(75)).toBe('70+');
    });
  });

  describe('getStroopTscore', () => {
    it('returns 50 at mean RT', () => {
      const t = getStroopTscore('word_reading', 1.01, '18-29');
      expect(t).toBe(50);
    });

    it('returns higher T-score for faster RT', () => {
      const fast = getStroopTscore('word_reading', 0.90, '18-29');
      const slow = getStroopTscore('word_reading', 1.12, '18-29');
      expect(fast).toBeGreaterThan(slow);
    });

    it('returns 50 for unknown condition', () => {
      expect(getStroopTscore('unknown', 1.0, '30-44')).toBe(50);
    });
  });

  describe('calculateInterferenceScore', () => {
    it('returns difference between inhibition and color naming RT', () => {
      const score = calculateInterferenceScore(1.8, 1.2);
      expect(score).toBe(0.6);
    });
  });

  describe('interpretInterference', () => {
    it('returns low for small interference', () => {
      const result = interpretInterference(0.20);
      expect(result).toContain('Low');
    });
    it('returns high for large interference', () => {
      const result = interpretInterference(0.70);
      expect(result).toContain('High');
    });
  });

  describe('calculateStroopScores', () => {
    const makeTrial = (condition, rt = 800, correct = true) => ({
      module: 'stroop',
      condition,
      rt_ms: rt,
      correct,
      timed_out: false,
    });

    it('calculates per-condition error rates', () => {
      const data = {
        word_reading: [
          makeTrial('word_reading', 800, true),
          makeTrial('word_reading', 900, false), // 1 error
        ],
        color_naming: [makeTrial('color_naming', 1000, true)],
        inhibition: [makeTrial('inhibition', 1200, true)],
      };
      const scores = calculateStroopScores(data, '30-44');
      expect(scores.word_reading.errors).toBe(1);
      expect(scores.word_reading.error_rate).toBe(50);
    });

    it('computes interference score', () => {
      const data = {
        word_reading: [makeTrial('word_reading', 800, true)],
        color_naming: [makeTrial('color_naming', 1000, true)],
        inhibition: [makeTrial('inhibition', 1400, true)],
      };
      const scores = calculateStroopScores(data, '30-44');
      expect(scores.interference_score).toBe(0.4);
      expect(scores.interference_interpreted).toBeTruthy();
    });

    it('handles empty conditions gracefully', () => {
      const scores = calculateStroopScores({}, '30-44');
      expect(scores.word_reading.t_score).toBe(50);
      expect(scores.interference_score).toBe(0);
    });

    it('excludes RT < 100ms and > 3000ms from mean RT', () => {
      const data = {
        word_reading: [
          makeTrial('word_reading', 50, false),   // too fast → excluded
          makeTrial('word_reading', 800, true),
          makeTrial('word_reading', 3500, false),  // too slow → excluded
          makeTrial('word_reading', 900, true),
        ],
        color_naming: [makeTrial('color_naming', 1000, true)],
        inhibition: [makeTrial('inhibition', 1400, true)],
      };
      const scores = calculateStroopScores(data, '30-44');
      // mean of 800 + 900 = 1700 / 2 = 850ms
      expect(scores.word_reading.mean_rt_ms).toBe(850);
      expect(scores.word_reading.valid_trials).toBe(2);
    });
  });
});

describe('Stroop — sequence generation', () => {
  describe('generateColorSequence', () => {
    it('returns exactly 30 items by default', () => {
      const seq = generateColorSequence();
      expect(seq.length).toBe(30);
    });

    it('contains only valid colors', () => {
      const seq = generateColorSequence();
      seq.forEach(c => {
        expect(['red', 'blue', 'green', 'yellow']).toContain(c);
      });
    });

    it('generates different sequences each call', () => {
      const seq1 = generateColorSequence(30);
      const seq2 = generateColorSequence(30);
      expect(seq1).not.toEqual(seq2);
    });

    it('returns correct count when specified', () => {
      expect(generateColorSequence(10).length).toBe(10);
    });
  });

  describe('generateConflictSequence', () => {
    it('returns exactly 30 items by default', () => {
      const seq = generateConflictSequence();
      expect(seq.length).toBe(30);
    });

    it('each item has word and ink', () => {
      const seq = generateConflictSequence();
      seq.forEach(item => {
        expect(item.word).toBeTruthy();
        expect(item.ink).toBeTruthy();
        expect(item.word).not.toBe(item.ink); // conflict!
      });
    });

    it('generates different sequences each call', () => {
      const seq1 = generateConflictSequence(30);
      const seq2 = generateConflictSequence(30);
      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('getConflictingColor', () => {
    it('never returns the same color as the word', () => {
      for (let i = 0; i < 20; i++) {
        const word = 'red';
        const ink = getConflictingColor(word);
        expect(ink).not.toBe(word);
      }
    });
  });

  describe('shuffle', () => {
    it('returns a shuffled array of the same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result.length).toBe(arr.length);
    });

    it('contains all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      arr.forEach(n => expect(result).toContain(n));
    });

    it('does not modify the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      shuffle(arr);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
