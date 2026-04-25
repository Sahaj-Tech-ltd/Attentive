/**
 * Beck Inventories Module Tests
 * BDI-II and BAI scoring and data aggregation tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBDI2Score,
  calculateBAIScore,
  interpretBDI2,
  interpretBAI,
  isValidBDI2Item,
  isValidBAIItem,
  calculateBeckScores,
} from '../../scoring/beck.js';

describe('Beck Scoring', () => {
  describe('calculateBDI2Score', () => {
    it('should return 0 for empty responses', () => {
      const result = calculateBDI2Score({});
      expect(result.total).toBe(0);
      expect(result.count).toBe(0);
      expect(result.max).toBe(63);
    });

    it('should sum all 21 items correctly', () => {
      const responses = {};
      for (let i = 1; i <= 21; i++) {
        responses[`bdi2_q${i}`] = 1;
      }
      const result = calculateBDI2Score(responses);
      expect(result.total).toBe(21);
      expect(result.count).toBe(21);
    });

    it('should handle max score of 63 (all 3s)', () => {
      const responses = {};
      for (let i = 1; i <= 21; i++) {
        responses[`bdi2_q${i}`] = 3;
      }
      const result = calculateBDI2Score(responses);
      expect(result.total).toBe(63);
      expect(result.count).toBe(21);
    });

    it('should ignore invalid values', () => {
      const responses = {
        bdi2_q1: 0,
        bdi2_q2: 1,
        bdi2_q3: -1,   // invalid
        bdi2_q4: 4,    // invalid
        bdi2_q5: null, // invalid
        bdi2_q6: '',   // invalid
      };
      const result = calculateBDI2Score(responses);
      expect(result.total).toBe(1);
      expect(result.count).toBe(2);
    });

    it('should handle mixed valid values', () => {
      const responses = {
        bdi2_q1: 3,
        bdi2_q2: 2,
        bdi2_q3: 1,
        bdi2_q4: 0,
        bdi2_q5: 3,
      };
      const result = calculateBDI2Score(responses);
      expect(result.total).toBe(9);
      expect(result.count).toBe(5);
    });
  });

  describe('calculateBAIScore', () => {
    it('should return 0 for empty responses', () => {
      const result = calculateBAIScore({});
      expect(result.total).toBe(0);
      expect(result.count).toBe(0);
      expect(result.max).toBe(63);
    });

    it('should sum all 21 items correctly', () => {
      const responses = {};
      for (let i = 1; i <= 21; i++) {
        responses[`bai_q${i}`] = 2;
      }
      const result = calculateBAIScore(responses);
      expect(result.total).toBe(42);
      expect(result.count).toBe(21);
    });

    it('should handle max score of 63', () => {
      const responses = {};
      for (let i = 1; i <= 21; i++) {
        responses[`bai_q${i}`] = 3;
      }
      const result = calculateBAIScore(responses);
      expect(result.total).toBe(63);
    });

    it('should ignore invalid values', () => {
      const responses = {
        bai_q1: 1,
        bai_q2: 99,  // invalid
        bai_q3: NaN,
        bai_q4: undefined,
      };
      const result = calculateBAIScore(responses);
      expect(result.total).toBe(1);
      expect(result.count).toBe(1);
    });
  });

  describe('interpretBDI2', () => {
    it('should return Minimal for 0-13', () => {
      expect(interpretBDI2(0)).toBe('Minimal depression');
      expect(interpretBDI2(7)).toBe('Minimal depression');
      expect(interpretBDI2(13)).toBe('Minimal depression');
    });

    it('should return Mild for 14-19', () => {
      expect(interpretBDI2(14)).toBe('Mild depression');
      expect(interpretBDI2(16)).toBe('Mild depression');
      expect(interpretBDI2(19)).toBe('Mild depression');
    });

    it('should return Moderate for 20-25', () => {
      expect(interpretBDI2(20)).toBe('Moderate depression');
      expect(interpretBDI2(22)).toBe('Moderate depression');
      expect(interpretBDI2(25)).toBe('Moderate depression');
    });

    it('should return Severe for 26+', () => {
      expect(interpretBDI2(26)).toBe('Severe depression');
      expect(interpretBDI2(40)).toBe('Severe depression');
      expect(interpretBDI2(63)).toBe('Severe depression');
    });

    it('should handle NaN as 0', () => {
      expect(interpretBDI2(NaN)).toBe('Minimal depression');
    });
  });

  describe('interpretBAI', () => {
    it('should return Minimal for 0-7', () => {
      expect(interpretBAI(0)).toBe('Minimal anxiety');
      expect(interpretBAI(5)).toBe('Minimal anxiety');
      expect(interpretBAI(7)).toBe('Minimal anxiety');
    });

    it('should return Mild for 8-15', () => {
      expect(interpretBAI(8)).toBe('Mild anxiety');
      expect(interpretBAI(10)).toBe('Mild anxiety');
      expect(interpretBAI(15)).toBe('Mild anxiety');
    });

    it('should return Moderate for 16-25', () => {
      expect(interpretBAI(16)).toBe('Moderate anxiety');
      expect(interpretBAI(20)).toBe('Moderate anxiety');
      expect(interpretBAI(25)).toBe('Moderate anxiety');
    });

    it('should return Severe for 26+', () => {
      expect(interpretBAI(26)).toBe('Severe anxiety');
      expect(interpretBAI(45)).toBe('Severe anxiety');
      expect(interpretBAI(63)).toBe('Severe anxiety');
    });
  });

  describe('isValidBDI2Item', () => {
    it('should accept valid values 0-3', () => {
      expect(isValidBDI2Item(0)).toBe(true);
      expect(isValidBDI2Item(1)).toBe(true);
      expect(isValidBDI2Item(2)).toBe(true);
      expect(isValidBDI2Item(3)).toBe(true);
    });

    it('should reject values outside 0-3', () => {
      expect(isValidBDI2Item(-1)).toBe(false);
      expect(isValidBDI2Item(4)).toBe(false);
      expect(isValidBDI2Item(10)).toBe(false);
      expect(isValidBDI2Item('abc')).toBe(false);
      expect(isValidBDI2Item(null)).toBe(false);
      expect(isValidBDI2Item(undefined)).toBe(false);
    });
  });

  describe('isValidBAIItem', () => {
    it('should accept valid values 0-3', () => {
      expect(isValidBAIItem(0)).toBe(true);
      expect(isValidBAIItem(3)).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(isValidBAIItem(-1)).toBe(false);
      expect(isValidBAIItem(4)).toBe(false);
      expect(isValidBAIItem('string')).toBe(false);
    });
  });

  describe('calculateBeckScores', () => {
    it('should calculate both inventories simultaneously', () => {
      const bdi2Resp = { bdi2_q1: 2, bdi2_q2: 1 };
      const baiResp = { bai_q1: 1, bai_q2: 0 };
      const result = calculateBeckScores(bdi2Resp, baiResp);
      expect(result.bdi2.total).toBe(3);
      expect(result.bai.total).toBe(1);
      expect(result.bdi2.interpretation).toBe('Minimal depression');
      expect(result.bai.interpretation).toBe('Minimal anxiety');
    });

    it('should produce full result object', () => {
      const bdi2Resp = {};
      const baiResp = {};
      const result = calculateBeckScores(bdi2Resp, baiResp);
      expect(result.bdi2.max).toBe(63);
      expect(result.bai.max).toBe(63);
      expect(result.bdi2.interpretation).toBe('Minimal depression');
      expect(result.bai.interpretation).toBe('Minimal anxiety');
    });
  });
});

describe('Beck Data Aggregation', () => {
  it('should aggregate from jsPsych trial data format', () => {
    const data = [
      { module: 'beck_inventories', inventory: 'bdi2', question_id: 'bdi2_q1', response: 1, page: 1 },
      { module: 'beck_inventories', inventory: 'bdi2', question_id: 'bdi2_q2', response: 2, page: 1 },
      { module: 'beck_inventories', inventory: 'bai', question_id: 'bai_q1', response: 0, page: 1 },
      { module: 'beck_inventories', inventory: 'bai', question_id: 'bai_q2', response: 3, page: 1 },
    ];

    // Simulate aggregation
    const bdi2Responses = {};
    const baiResponses = {};
    data.forEach(d => {
      if (d.module !== 'beck_inventories') return;
      if (d.inventory === 'bdi2') bdi2Responses[d.question_id] = d.response;
      if (d.inventory === 'bai') baiResponses[d.question_id] = d.response;
    });

    const bdi2Score = calculateBDI2Score(bdi2Responses);
    const baiScore = calculateBAIScore(baiResponses);

    expect(bdi2Score.total).toBe(3);
    expect(baiScore.total).toBe(3);
  });
});
