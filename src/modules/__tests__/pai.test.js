/**
 * PAI Module Tests
 * Personality Assessment Inventory scoring and data model tests
 */

import { describe, it, expect } from 'vitest';
import {
  scorePAI,
  rawToT,
  calculateScaleScore,
  checkValidity,
  getElevatedScales,
  interpretT,
  isValidPAIItem,
  validateResponses,
  SCALES,
} from '../../scoring/pai.js';

describe('PAI Scoring', () => {
  describe('rawToT', () => {
    it('should return 30 for raw score 0', () => {
      expect(rawToT(0)).toBe(30);
    });

    it('should return T ≈ (raw × 5.5) + 30', () => {
      expect(rawToT(6)).toBe(63);
      expect(rawToT(9)).toBe(80);
      expect(rawToT(18)).toBe(129);
    });

    it('should return 30 for raw score 0', () => {
      expect(rawToT(0)).toBe(30);
    });
  });

  describe('calculateScaleScore', () => {
    it('should return 0 for empty responses', () => {
      const result = calculateScaleScore({}, 'SOM');
      expect(result.raw).toBe(0);
      expect(result.count).toBe(0);
      expect(result.max).toBe(18);
    });

    it('should sum 6 items correctly for SOM scale', () => {
      const responses = {
        som_q1: 3, som_q2: 3, som_q3: 3,
        som_q4: 3, som_q5: 3, som_q6: 3,
      };
      const result = calculateScaleScore(responses, 'SOM');
      expect(result.raw).toBe(18);
      expect(result.count).toBe(6);
    });

    it('should handle NIM scale with 3 items', () => {
      const responses = { nim_q1: 2, nim_q2: 2, nim_q3: 2 };
      const result = calculateScaleScore(responses, 'NIM');
      expect(result.raw).toBe(6);
      expect(result.count).toBe(3);
      expect(result.max).toBe(9);
    });

    it('should handle PIM scale with 3 items', () => {
      const responses = { pim_q1: 1, pim_q2: 1, pim_q3: 1 };
      const result = calculateScaleScore(responses, 'PIM');
      expect(result.raw).toBe(3);
      expect(result.count).toBe(3);
      expect(result.max).toBe(9);
    });

    it('should ignore invalid values', () => {
      const responses = {
        som_q1: 0,
        som_q2: -1,
        som_q3: 4,
        som_q4: null,
        som_q5: '',
        som_q6: 2,
      };
      const result = calculateScaleScore(responses, 'SOM');
      expect(result.raw).toBe(2);
      expect(result.count).toBe(2);
    });

    it('should return 0 for unknown scale', () => {
      const result = calculateScaleScore({}, 'UNKNOWN');
      expect(result.raw).toBe(0);
      expect(result.count).toBe(0);
      expect(result.max).toBe(0);
    });
  });

  describe('checkValidity', () => {
    it('should flag INF > 7', () => {
      const rawScores = { inf: 8, nim: 0, pim: 0 };
      const flags = checkValidity(rawScores);
      expect(flags.inf).toBe(true);
      expect(flags.nim).toBe(false);
      expect(flags.pim).toBe(false);
    });

    it('should flag PIM > 7', () => {
      const rawScores = { inf: 0, nim: 0, pim: 8 };
      const flags = checkValidity(rawScores);
      expect(flags.pim).toBe(true);
    });

    it('should flag NIM > 5', () => {
      const rawScores = { inf: 0, nim: 6, pim: 0 };
      const flags = checkValidity(rawScores);
      expect(flags.nim).toBe(true);
    });

    it('should not flag when scores are below thresholds', () => {
      const rawScores = { inf: 7, nim: 5, pim: 7 };
      const flags = checkValidity(rawScores);
      expect(flags.inf).toBe(false);
      expect(flags.nim).toBe(false);
      expect(flags.pim).toBe(false);
    });

    it('should not flag for zero scores', () => {
      const rawScores = { inf: 0, nim: 0, pim: 0 };
      const flags = checkValidity(rawScores);
      expect(flags.inf).toBe(false);
      expect(flags.nim).toBe(false);
      expect(flags.pim).toBe(false);
    });
  });

  describe('getElevatedScales', () => {
    it('should detect elevated scales (T >= 70)', () => {
      const tScores = { som: 72, anx: 50, dep: 80 };
      const { elevated, markedlyElevated } = getElevatedScales(tScores);
      expect(elevated).toContain('som');
      expect(markedlyElevated).toContain('dep');
    });

    it('should return empty arrays when no scales are elevated', () => {
      const tScores = { som: 50, anx: 60, dep: 55 };
      const { elevated, markedlyElevated } = getElevatedScales(tScores);
      expect(elevated).toEqual([]);
      expect(markedlyElevated).toEqual([]);
    });

    it('should separate markedly elevated from elevated', () => {
      const tScores = { som: 75, anx: 82, dep: 50 };
      const { elevated, markedlyElevated } = getElevatedScales(tScores);
      expect(elevated).toContain('som');
      expect(elevated).not.toContain('anx');
      expect(markedlyElevated).toContain('anx');
    });
  });

  describe('interpretT', () => {
    it('should return Within normal limits for T < 60', () => {
      expect(interpretT(30)).toBe('Within normal limits');
      expect(interpretT(50)).toBe('Within normal limits');
      expect(interpretT(59)).toBe('Within normal limits');
    });

    it('should return Borderline for T 60-69', () => {
      expect(interpretT(60)).toBe('Borderline');
      expect(interpretT(65)).toBe('Borderline');
      expect(interpretT(69)).toBe('Borderline');
    });

    it('should return Elevated for T 70-79', () => {
      expect(interpretT(70)).toBe('Elevated');
      expect(interpretT(75)).toBe('Elevated');
      expect(interpretT(79)).toBe('Elevated');
    });

    it('should return Markedly elevated for T >= 80', () => {
      expect(interpretT(80)).toBe('Markedly elevated');
      expect(interpretT(100)).toBe('Markedly elevated');
    });
  });

  describe('isValidPAIItem', () => {
    it('should accept valid values 0-3', () => {
      expect(isValidPAIItem(0)).toBe(true);
      expect(isValidPAIItem(1)).toBe(true);
      expect(isValidPAIItem(2)).toBe(true);
      expect(isValidPAIItem(3)).toBe(true);
    });

    it('should reject values outside 0-3', () => {
      expect(isValidPAIItem(-1)).toBe(false);
      expect(isValidPAIItem(4)).toBe(false);
      expect(isValidPAIItem('abc')).toBe(false);
      expect(isValidPAIItem(null)).toBe(false);
      expect(isValidPAIItem(undefined)).toBe(false);
    });
  });

  describe('scorePAI', () => {
    it('should return full data model shape', () => {
      const result = scorePAI({});
      expect(result).toHaveProperty('rawScores');
      expect(result).toHaveProperty('tScores');
      expect(result).toHaveProperty('validityFlags');
      expect(result).toHaveProperty('elevatedScales');
      expect(result).toHaveProperty('markedlyElevatedScales');
      expect(result).toHaveProperty('hasValidityConcern');
      expect(result).toHaveProperty('interpretation');
      expect(result).toHaveProperty('metadata');
    });

    it('should include all 10 scales in results', () => {
      const result = scorePAI({});
      const scaleKeys = Object.keys(SCALES).map(s => s.toLowerCase());
      scaleKeys.forEach(key => {
        expect(result.rawScores).toHaveProperty(key);
        expect(result.tScores).toHaveProperty(key);
        expect(result.interpretation).toHaveProperty(key);
      });
    });

    it('should have metadata with correct values', () => {
      const result = scorePAI({});
      expect(result.metadata.module_type).toBe('pai');
      expect(result.metadata.item_count).toBe(66);
      expect(result.metadata.scale_count).toBe(11);
    });

    it('should compute correct T-scores for all-max responses', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          responses[`${prefix}_q${i}`] = 3;
        }
      });

      const result = scorePAI(responses);

      expect(result.rawScores.som).toBe(18);
      expect(result.tScores.som).toBe(129);

      expect(result.rawScores.nim).toBe(9);
      expect(result.tScores.nim).toBe(80);

      expect(result.rawScores.pim).toBe(9);
      expect(result.tScores.pim).toBe(80);
    });

    it('should compute correct T-scores for all-zero responses', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          responses[`${prefix}_q${i}`] = 0;
        }
      });

      const result = scorePAI(responses);
      Object.values(result.rawScores).forEach(raw => {
        expect(raw).toBe(0);
      });
      Object.values(result.tScores).forEach(t => {
        expect(t).toBe(30);
      });
    });

    it('should detect elevated clinical scales', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          if (abbr === 'SOM') {
            responses[`${prefix}_q${i}`] = 3;
          } else {
            responses[`${prefix}_q${i}`] = 0;
          }
        }
      });

      const result = scorePAI(responses);
      expect(result.rawScores.som).toBe(18);
      expect(result.tScores.som).toBe(129);
      expect(result.elevatedScales).toContain('som');
      expect(result.markedlyElevatedScales).toContain('som');
    });

    it('should detect validity concerns', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          if (abbr === 'INF') {
            responses[`${prefix}_q${i}`] = 3;
          } else {
            responses[`${prefix}_q${i}`] = 0;
          }
        }
      });

      const result = scorePAI(responses);
      expect(result.rawScores.inf).toBe(18);
      expect(result.validityFlags.inf).toBe(true);
      expect(result.hasValidityConcern).toBe(true);
    });

    it('should not flag validity when scores are low', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          responses[`${prefix}_q${i}`] = 0;
        }
      });

      const result = scorePAI(responses);
      expect(result.hasValidityConcern).toBe(false);
      expect(result.validityFlags.inf).toBe(false);
      expect(result.validityFlags.nim).toBe(false);
      expect(result.validityFlags.pim).toBe(false);
    });

    it('should handle mixed responses correctly', () => {
      const responses = {
        som_q1: 1, som_q2: 2, som_q3: 3, som_q4: 0, som_q5: 1, som_q6: 2,
      };

      const result = scorePAI(responses);
      expect(result.rawScores.som).toBe(9);
      expect(result.tScores.som).toBe(80);
    });
  });

  describe('validateResponses', () => {
    it('should return valid for complete valid responses', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          responses[`${prefix}_q${i}`] = 1;
        }
      });

      const result = validateResponses(responses);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing responses', () => {
      const responses = {
        som_q1: 1,
      };

      const result = validateResponses(responses);
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should detect invalid values', () => {
      const responses = {};
      Object.entries(SCALES).forEach(([abbr, scale]) => {
        const prefix = abbr.toLowerCase();
        for (let i = 1; i <= scale.items; i++) {
          if (abbr === 'SOM' && i === 1) {
            responses[`${prefix}_q${i}`] = 5;
          } else {
            responses[`${prefix}_q${i}`] = 1;
          }
        }
      });

      const result = validateResponses(responses);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
