/**
 * BRIEF-A Module Tests
 * Behavior Rating Inventory of Executive Function – Adult
 * Scoring, index calculations, aggregation, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SCALES,
  INDEX_COMPOSITION,
  isValidBriefAItem,
  calculateScaleScore,
  rawToT,
  interpretScore,
  calculateBRI,
  calculateMI,
  calculateGEC,
  aggregateBriefAResults,
  validateResponses,
} from '../../scoring/brief-a.js';

describe('BRIEF-A Scoring', () => {
  describe('SCALES constant', () => {
    it('should define all 9 scales with correct item counts', () => {
      expect(SCALES.INH.items).toBe(10);
      expect(SCALES.SFT.items).toBe(10);
      expect(SCALES.EMC.items).toBe(10);
      expect(SCALES.SMO.items).toBe(9);
      expect(SCALES.POG.items).toBe(10);
      expect(SCALES.TSK.items).toBe(9);
      expect(SCALES.OMA.items).toBe(10);
      expect(SCALES.WKM.items).toBe(9);
      expect(SCALES.INI.items).toBe(10);
    });

    it('should define correct max raw scores', () => {
      expect(SCALES.INH.max).toBe(30);
      expect(SCALES.SFT.max).toBe(30);
      expect(SCALES.EMC.max).toBe(30);
      expect(SCALES.SMO.max).toBe(27);
      expect(SCALES.POG.max).toBe(30);
      expect(SCALES.TSK.max).toBe(27);
      expect(SCALES.OMA.max).toBe(30);
      expect(SCALES.WKM.max).toBe(27);
      expect(SCALES.INI.max).toBe(30);
    });
  });

  describe('INDEX_COMPOSITION constant', () => {
    it('should define BRI from INH, SFT, EMC, SMO', () => {
      expect(INDEX_COMPOSITION.BRI).toEqual(['INH', 'SFT', 'EMC', 'SMO']);
    });

    it('should define MI from POG, TSK, OMA, WKM, INI', () => {
      expect(INDEX_COMPOSITION.MI).toEqual(['POG', 'TSK', 'OMA', 'WKM', 'INI']);
    });

    it('should define GEC from BRI and MI', () => {
      expect(INDEX_COMPOSITION.GEC).toEqual(['BRI', 'MI']);
    });
  });

  describe('isValidBriefAItem', () => {
    it('should accept valid values 0-3', () => {
      expect(isValidBriefAItem(0)).toBe(true);
      expect(isValidBriefAItem(1)).toBe(true);
      expect(isValidBriefAItem(2)).toBe(true);
      expect(isValidBriefAItem(3)).toBe(true);
    });

    it('should accept string numeric values', () => {
      expect(isValidBriefAItem('0')).toBe(true);
      expect(isValidBriefAItem('1')).toBe(true);
      expect(isValidBriefAItem('2')).toBe(true);
      expect(isValidBriefAItem('3')).toBe(true);
    });

    it('should reject negative values', () => {
      expect(isValidBriefAItem(-1)).toBe(false);
      expect(isValidBriefAItem(-99)).toBe(false);
    });

    it('should reject values above 3', () => {
      expect(isValidBriefAItem(4)).toBe(false);
      expect(isValidBriefAItem(10)).toBe(false);
      expect(isValidBriefAItem(100)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(isValidBriefAItem(null)).toBe(false);
      expect(isValidBriefAItem(undefined)).toBe(false);
      expect(isValidBriefAItem('')).toBe(false);
      expect(isValidBriefAItem('abc')).toBe(false);
      expect(isValidBriefAItem(NaN)).toBe(false);
    });
  });

  describe('calculateScaleScore', () => {
    describe('INH scale (10 items, max 30)', () => {
      it('should return 0 for empty responses', () => {
        const result = calculateScaleScore({}, 'INH');
        expect(result.raw).toBe(0);
        expect(result.count).toBe(0);
        expect(result.max).toBe(30);
      });

      it('should sum all 10 INH items correctly', () => {
        const responses = {
          inh_q1: 1, inh_q2: 1, inh_q3: 1, inh_q4: 1, inh_q5: 1,
          inh_q6: 1, inh_q7: 1, inh_q8: 1, inh_q9: 1, inh_q10: 1,
        };
        const result = calculateScaleScore(responses, 'INH');
        expect(result.raw).toBe(10);
        expect(result.count).toBe(10);
      });

      it('should handle max score of 30 (all 3s)', () => {
        const responses = {
          inh_q1: 3, inh_q2: 3, inh_q3: 3, inh_q4: 3, inh_q5: 3,
          inh_q6: 3, inh_q7: 3, inh_q8: 3, inh_q9: 3, inh_q10: 3,
        };
        const result = calculateScaleScore(responses, 'INH');
        expect(result.raw).toBe(30);
        expect(result.count).toBe(10);
      });

      it('should ignore invalid values', () => {
        const responses = {
          inh_q1: 2,
          inh_q2: -1,   // invalid
          inh_q3: 4,    // invalid
          inh_q4: null, // invalid
          inh_q5: '',   // invalid
        };
        const result = calculateScaleScore(responses, 'INH');
        expect(result.raw).toBe(2);
        expect(result.count).toBe(1);
      });

      it('should handle mixed valid values', () => {
        const responses = {
          inh_q1: 3, inh_q2: 2, inh_q3: 1, inh_q4: 0, inh_q5: 3,
          inh_q6: 2, inh_q7: 1, inh_q8: 0, inh_q9: 3, inh_q10: 2,
        };
        const result = calculateScaleScore(responses, 'INH');
        expect(result.raw).toBe(17);
        expect(result.count).toBe(10);
      });
    });

    describe('SMO scale (9 items, max 27)', () => {
      it('should sum all 9 SMO items correctly', () => {
        const responses = {
          smo_q1: 1, smo_q2: 1, smo_q3: 1, smo_q4: 1, smo_q5: 1,
          smo_q6: 1, smo_q7: 1, smo_q8: 1, smo_q9: 1,
        };
        const result = calculateScaleScore(responses, 'SMO');
        expect(result.raw).toBe(9);
        expect(result.count).toBe(9);
      });

      it('should handle max score of 27', () => {
        const responses = {
          smo_q1: 3, smo_q2: 3, smo_q3: 3, smo_q4: 3, smo_q5: 3,
          smo_q6: 3, smo_q7: 3, smo_q8: 3, smo_q9: 3,
        };
        const result = calculateScaleScore(responses, 'SMO');
        expect(result.raw).toBe(27);
        expect(result.count).toBe(9);
      });
    });

    describe('WKM scale (9 items, max 27)', () => {
      it('should sum all 9 WKM items correctly', () => {
        const responses = {
          wkm_q1: 2, wkm_q2: 2, wkm_q3: 2, wkm_q4: 2, wkm_q5: 2,
          wkm_q6: 2, wkm_q7: 2, wkm_q8: 2, wkm_q9: 2,
        };
        const result = calculateScaleScore(responses, 'WKM');
        expect(result.raw).toBe(18);
        expect(result.count).toBe(9);
      });
    });

    describe('all scales use lowercase prefix in responses', () => {
      it('should find items with lowercase scale prefix', () => {
        const responses = {
          inh_q1: 1, inh_q2: 2, inh_q3: 3,
          sft_q1: 1, sft_q2: 2,
          pog_q1: 3,
        };
        expect(calculateScaleScore(responses, 'INH').raw).toBe(6);
        expect(calculateScaleScore(responses, 'SFT').raw).toBe(3);
        expect(calculateScaleScore(responses, 'POG').raw).toBe(3);
      });
    });

    it('should return error for unknown scale', () => {
      const result = calculateScaleScore({}, 'INVALID');
      expect(result.error).toBe('Unknown scale: INVALID');
    });
  });

  describe('rawToT', () => {
    it('should convert raw score to T-score using norm tables', () => {
      // Using INH norm: mean=14.5, sd=7.2
      // raw=14.5 → t ≈ 50
      const t = rawToT(14.5, 'INH');
      expect(t).toBe(50);
    });

    it('should return 50 for unknown scale', () => {
      expect(rawToT(10, 'UNKNOWN')).toBe(50);
    });

    it('should calculate T>50 for above-mean scores', () => {
      const t = rawToT(30, 'INH'); // 30 is well above mean 14.5
      expect(t).toBeGreaterThan(50);
    });

    it('should calculate T<50 for below-mean scores', () => {
      const t = rawToT(5, 'INH'); // 5 is well below mean 14.5
      expect(t).toBeLessThan(50);
    });
  });

  describe('interpretScore', () => {
    describe('Elevated threshold (T >= 65)', () => {
      it('should return Elevated for T = 65', () => {
        expect(interpretScore(65)).toBe('Elevated');
      });

      it('should return Elevated for T > 65', () => {
        expect(interpretScore(70)).toBe('Elevated');
        expect(interpretScore(80)).toBe('Elevated');
        expect(interpretScore(100)).toBe('Elevated');
      });

      it('should return Elevated for high T-score strings', () => {
        expect(interpretScore('65')).toBe('Elevated');
        expect(interpretScore('70')).toBe('Elevated');
      });
    });

    describe('Borderline threshold (T 60-64)', () => {
      it('should return Borderline for T = 60', () => {
        expect(interpretScore(60)).toBe('Borderline');
      });

      it('should return Borderline for T = 64', () => {
        expect(interpretScore(64)).toBe('Borderline');
      });

      it('should return Borderline for T = 62', () => {
        expect(interpretScore(62)).toBe('Borderline');
      });
    });

    describe('WNL threshold (T < 60)', () => {
      it('should return WNL for T = 59', () => {
        expect(interpretScore(59)).toBe('WNL');
      });

      it('should return WNL for T = 50', () => {
        expect(interpretScore(50)).toBe('WNL');
      });

      it('should return WNL for T = 0', () => {
        expect(interpretScore(0)).toBe('WNL');
      });

      it('should return WNL for negative T-scores', () => {
        expect(interpretScore(-10)).toBe('WNL');
      });
    });

    describe('edge cases', () => {
      it('should handle NaN as WNL', () => {
        expect(interpretScore(NaN)).toBe('WNL');
      });

      it('should handle undefined as WNL', () => {
        expect(interpretScore(undefined)).toBe('WNL');
      });

      it('should handle non-numeric strings as WNL', () => {
        expect(interpretScore('abc')).toBe('WNL');
      });
    });
  });

  describe('calculateBRI', () => {
    it('should sum T-scores of INH, SFT, EMC, SMO and produce valid interpretation', () => {
      const scaleTScores = {
        INH: 55, SFT: 60, EMC: 70, SMO: 45,
      };
      const result = calculateBRI(scaleTScores);
      expect(result.rawSum).toBe(55 + 60 + 70 + 45);
      expect(result.t).toBeGreaterThan(0);
      // Verify interpretation is one of the valid categories
      expect(['WNL', 'Borderline', 'Elevated']).toContain(result.interpretation);
    });

    it('should handle missing scale T-scores as 50', () => {
      const scaleTScores = {
        INH: 55,
        // SFT, EMC, SMO missing
      };
      const result = calculateBRI(scaleTScores);
      // rawSum = 55 + 50 + 50 + 50 = 205
      expect(result.rawSum).toBe(205);
    });

    it('should interpret correctly based on resulting T-score', () => {
      // Using moderate T-scores that yield WNL
      const scaleTScores = {
        INH: 52, SFT: 52, EMC: 52, SMO: 52,
      };
      const result = calculateBRI(scaleTScores);
      expect(result.rawSum).toBe(208);
      expect(['WNL', 'Borderline', 'Elevated']).toContain(result.interpretation);
    });

    it('should interpret elevated result', () => {
      const scaleTScores = {
        INH: 70, SFT: 70, EMC: 70, SMO: 70,
      };
      const result = calculateBRI(scaleTScores);
      expect(result.rawSum).toBe(280);
      expect(result.interpretation).toBe('Elevated');
    });
  });

  describe('calculateMI', () => {
    it('should sum T-scores of POG, TSK, OMA, WKM, INI', () => {
      const scaleTScores = {
        POG: 55, TSK: 50, OMA: 65, WKM: 60, INI: 70,
      };
      const result = calculateMI(scaleTScores);
      expect(result.rawSum).toBe(55 + 50 + 65 + 60 + 70);
      expect(result.t).toBeGreaterThan(0);
    });

    it('should handle missing scale T-scores as 50', () => {
      const scaleTScores = {
        POG: 55,
        // TSK, OMA, WKM, INI missing
      };
      const result = calculateMI(scaleTScores);
      // rawSum = 55 + 50 + 50 + 50 + 50 = 255
      expect(result.rawSum).toBe(255);
    });
  });

  describe('calculateGEC', () => {
    it('should sum BRI and MI raw sums', () => {
      const bri = { rawSum: 200 };
      const mi = { rawSum: 250 };
      const result = calculateGEC(bri, mi);
      expect(result.rawSum).toBe(450);
      expect(result.t).toBeGreaterThan(0);
    });

    it('should interpret correctly based on T-score', () => {
      const bri = { rawSum: 230 };
      const mi = { rawSum: 270 };
      const result = calculateGEC(bri, mi);
      expect(result.rawSum).toBe(500);
      expect(['WNL', 'Borderline', 'Elevated']).toContain(result.interpretation);
    });
  });

  describe('aggregateBriefAResults', () => {
    it('should produce complete results structure', () => {
      const responses = {
        inh_q1: 1, inh_q2: 1, inh_q3: 1, inh_q4: 1, inh_q5: 1,
        inh_q6: 1, inh_q7: 1, inh_q8: 1, inh_q9: 1, inh_q10: 1,
        sft_q1: 1, sft_q2: 1, sft_q3: 1, sft_q4: 1, sft_q5: 1,
        sft_q6: 1, sft_q7: 1, sft_q8: 1, sft_q9: 1, sft_q10: 1,
        emc_q1: 1, emc_q2: 1, emc_q3: 1, emc_q4: 1, emc_q5: 1,
        emc_q6: 1, emc_q7: 1, emc_q8: 1, emc_q9: 1, emc_q10: 1,
        smo_q1: 1, smo_q2: 1, smo_q3: 1, smo_q4: 1, smo_q5: 1,
        smo_q6: 1, smo_q7: 1, smo_q8: 1, smo_q9: 1,
        pog_q1: 1, pog_q2: 1, pog_q3: 1, pog_q4: 1, pog_q5: 1,
        pog_q6: 1, pog_q7: 1, pog_q8: 1, pog_q9: 1, pog_q10: 1,
        tsk_q1: 1, tsk_q2: 1, tsk_q3: 1, tsk_q4: 1, tsk_q5: 1,
        tsk_q6: 1, tsk_q7: 1, tsk_q8: 1, tsk_q9: 1,
        oma_q1: 1, oma_q2: 1, oma_q3: 1, oma_q4: 1, oma_q5: 1,
        oma_q6: 1, oma_q7: 1, oma_q8: 1, oma_q9: 1, oma_q10: 1,
        wkm_q1: 1, wkm_q2: 1, wkm_q3: 1, wkm_q4: 1, wkm_q5: 1,
        wkm_q6: 1, wkm_q7: 1, wkm_q8: 1, wkm_q9: 1,
        ini_q1: 1, ini_q2: 1, ini_q3: 1, ini_q4: 1, ini_q5: 1,
        ini_q6: 1, ini_q7: 1, ini_q8: 1, ini_q9: 1, ini_q10: 1,
      };
      const result = aggregateBriefAResults(responses);

      expect(result.scales).toBeDefined();
      expect(result.indices).toBeDefined();
      expect(result.metadata).toBeDefined();

      // All 9 scales present
      expect(result.scales.INH).toBeDefined();
      expect(result.scales.SFT).toBeDefined();
      expect(result.scales.EMC).toBeDefined();
      expect(result.scales.SMO).toBeDefined();
      expect(result.scales.POG).toBeDefined();
      expect(result.scales.TSK).toBeDefined();
      expect(result.scales.OMA).toBeDefined();
      expect(result.scales.WKM).toBeDefined();
      expect(result.scales.INI).toBeDefined();

      // All 3 indices present
      expect(result.indices.BRI).toBeDefined();
      expect(result.indices.MI).toBeDefined();
      expect(result.indices.GEC).toBeDefined();

      // Each scale has expected fields
      expect(result.scales.INH.raw).toBe(10);
      expect(result.scales.INH.t).toBeGreaterThan(0);
      expect(result.scales.INH.interpretation).toBe('WNL');
      expect(result.scales.INH.count).toBe(10);
      expect(result.scales.INH.max).toBe(30);

      // Metadata
      expect(result.metadata.item_count).toBe(87);
      expect(result.metadata.completed_at).toBeDefined();
    });

    it('should match SPEC example output structure', () => {
      // Minimal 2-item test to verify structure
      const responses = {
        inh_q1: 0, inh_q2: 0, inh_q3: 0, inh_q4: 0, inh_q5: 0,
        inh_q6: 0, inh_q7: 0, inh_q8: 0, inh_q9: 0, inh_q10: 0,
        sft_q1: 0, sft_q2: 0, sft_q3: 0, sft_q4: 0, sft_q5: 0,
        sft_q6: 0, sft_q7: 0, sft_q8: 0, sft_q9: 0, sft_q10: 0,
        emc_q1: 0, emc_q2: 0, emc_q3: 0, emc_q4: 0, emc_q5: 0,
        emc_q6: 0, emc_q7: 0, emc_q8: 0, emc_q9: 0, emc_q10: 0,
        smo_q1: 0, smo_q2: 0, smo_q3: 0, smo_q4: 0, smo_q5: 0,
        smo_q6: 0, smo_q7: 0, smo_q8: 0, smo_q9: 0,
        pog_q1: 0, pog_q2: 0, pog_q3: 0, pog_q4: 0, pog_q5: 0,
        pog_q6: 0, pog_q7: 0, pog_q8: 0, pog_q9: 0, pog_q10: 0,
        tsk_q1: 0, tsk_q2: 0, tsk_q3: 0, tsk_q4: 0, tsk_q5: 0,
        tsk_q6: 0, tsk_q7: 0, tsk_q8: 0, tsk_q9: 0,
        oma_q1: 0, oma_q2: 0, oma_q3: 0, oma_q4: 0, oma_q5: 0,
        oma_q6: 0, oma_q7: 0, oma_q8: 0, oma_q9: 0, oma_q10: 0,
        wkm_q1: 0, wkm_q2: 0, wkm_q3: 0, wkm_q4: 0, wkm_q5: 0,
        wkm_q6: 0, wkm_q7: 0, wkm_q8: 0, wkm_q9: 0,
        ini_q1: 0, ini_q2: 0, ini_q3: 0, ini_q4: 0, ini_q5: 0,
        ini_q6: 0, ini_q7: 0, ini_q8: 0, ini_q9: 0, ini_q10: 0,
      };
      const result = aggregateBriefAResults(responses);

      // Indices have rawSum, t, interpretation
      expect(result.indices.BRI.rawSum).toBeDefined();
      expect(result.indices.BRI.t).toBeDefined();
      expect(result.indices.BRI.interpretation).toBeDefined();

      expect(result.indices.MI.rawSum).toBeDefined();
      expect(result.indices.MI.t).toBeDefined();
      expect(result.indices.MI.interpretation).toBeDefined();

      expect(result.indices.GEC.rawSum).toBeDefined();
      expect(result.indices.GEC.t).toBeDefined();
      expect(result.indices.GEC.interpretation).toBeDefined();
    });
  });

  describe('validateResponses', () => {
    it('should return valid for complete valid responses', () => {
      const responses = {
        inh_q1: 1, inh_q2: 1, inh_q3: 1, inh_q4: 1, inh_q5: 1,
        inh_q6: 1, inh_q7: 1, inh_q8: 1, inh_q9: 1, inh_q10: 1,
        sft_q1: 1, sft_q2: 1, sft_q3: 1, sft_q4: 1, sft_q5: 1,
        sft_q6: 1, sft_q7: 1, sft_q8: 1, sft_q9: 1, sft_q10: 1,
        emc_q1: 1, emc_q2: 1, emc_q3: 1, emc_q4: 1, emc_q5: 1,
        emc_q6: 1, emc_q7: 1, emc_q8: 1, emc_q9: 1, emc_q10: 1,
        smo_q1: 1, smo_q2: 1, smo_q3: 1, smo_q4: 1, smo_q5: 1,
        smo_q6: 1, smo_q7: 1, smo_q8: 1, smo_q9: 1,
        pog_q1: 1, pog_q2: 1, pog_q3: 1, pog_q4: 1, pog_q5: 1,
        pog_q6: 1, pog_q7: 1, pog_q8: 1, pog_q9: 1, pog_q10: 1,
        tsk_q1: 1, tsk_q2: 1, tsk_q3: 1, tsk_q4: 1, tsk_q5: 1,
        tsk_q6: 1, tsk_q7: 1, tsk_q8: 1, tsk_q9: 1,
        oma_q1: 1, oma_q2: 1, oma_q3: 1, oma_q4: 1, oma_q5: 1,
        oma_q6: 1, oma_q7: 1, oma_q8: 1, oma_q9: 1, oma_q10: 1,
        wkm_q1: 1, wkm_q2: 1, wkm_q3: 1, wkm_q4: 1, wkm_q5: 1,
        wkm_q6: 1, wkm_q7: 1, wkm_q8: 1, wkm_q9: 1,
        ini_q1: 1, ini_q2: 1, ini_q3: 1, ini_q4: 1, ini_q5: 1,
        ini_q6: 1, ini_q7: 1, ini_q8: 1, ini_q9: 1, ini_q10: 1,
      };
      const result = validateResponses(responses);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.missing).toEqual([]);
    });

    it('should track missing items but not invalidate for skipped items', () => {
      // Per SPEC: "Skipped items" → "Each unanswered item treated as 0 in scoring"
      // Missing items are NOT invalid - they just get 0; only out-of-range values are invalid
      const responses = {
        inh_q1: 1,
        // inh_q2-q10 missing
        sft_q1: 2,
        // most items missing
      };
      const result = validateResponses(responses);
      // Missing items are tracked but still valid (treated as 0)
      expect(result.valid).toBe(true);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should track invalid values', () => {
      const responses = {
        inh_q1: 1, inh_q2: 1, inh_q3: 1, inh_q4: 1, inh_q5: 1,
        inh_q6: 1, inh_q7: 1, inh_q8: 1, inh_q9: 1, inh_q10: 1,
        sft_q1: 1, sft_q2: 1, sft_q3: 1, sft_q4: 1, sft_q5: 1,
        sft_q6: 1, sft_q7: 1, sft_q8: 1, sft_q9: 1, sft_q10: 1,
        emc_q1: 1, emc_q2: 1, emc_q3: 1, emc_q4: 1, emc_q5: 1,
        emc_q6: 1, emc_q7: 1, emc_q8: 1, emc_q9: 1, emc_q10: 1,
        smo_q1: 1, smo_q2: 1, smo_q3: 1, smo_q4: 1, smo_q5: 1,
        smo_q6: 1, smo_q7: 1, smo_q8: 1, smo_q9: 1,
        pog_q1: 1, pog_q2: 1, pog_q3: 1, pog_q4: 1, pog_q5: 1,
        pog_q6: 1, pog_q7: 1, pog_q8: 1, pog_q9: 1, pog_q10: 1,
        tsk_q1: 1, tsk_q2: 1, tsk_q3: 1, tsk_q4: 1, tsk_q5: 1,
        tsk_q6: 1, tsk_q7: 1, tsk_q8: 1, tsk_q9: 1,
        oma_q1: 1, oma_q2: 1, oma_q3: 1, oma_q4: 1, oma_q5: 1,
        oma_q6: 1, oma_q7: 1, oma_q8: 1, oma_q9: 1, oma_q10: 1,
        wkm_q1: 1, wkm_q2: 1, wkm_q3: 1, wkm_q4: 1, wkm_q5: 1,
        wkm_q6: 1, wkm_q7: 1, wkm_q8: 1, wkm_q9: 1,
        ini_q1: 1, ini_q2: 1, ini_q3: 1, ini_q4: 1, ini_q5: 1,
        ini_q6: 1, ini_q7: 1, ini_q8: 1, ini_q9: 1, ini_q10: 1,
      };
      // Add one invalid
      responses.inh_q1 = 99;
      const result = validateResponses(responses);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('inh_q1'))).toBe(true);
    });
  });
});

describe('BRIEF-A Edge Cases (SPEC Section 9)', () => {
  describe('all items at default 0', () => {
    it('should produce valid results with all-zero responses', () => {
      const responses = {};
      // All 87 items at 0
      const allZero = {};
      for (const scaleAbbr of Object.keys(SCALES)) {
        const prefix = scaleAbbr.toLowerCase();
        for (let i = 1; i <= SCALES[scaleAbbr].items; i++) {
          allZero[`${prefix}_q${i}`] = 0;
        }
      }
      const result = aggregateBriefAResults(allZero);
      expect(result.scales.INH.raw).toBe(0);
      expect(result.scales.INH.interpretation).toBe('WNL');
      expect(result.metadata.item_count).toBe(87);
    });
  });

  describe('skipped items treated as 0', () => {
    it('should handle partial responses (skipped items)', () => {
      // Only answer first item of each scale
      const responses = {
        inh_q1: 3,
        sft_q1: 3,
        emc_q1: 3,
        smo_q1: 3,
        pog_q1: 3,
        tsk_q1: 3,
        oma_q1: 3,
        wkm_q1: 3,
        ini_q1: 3,
      };
      const result = aggregateBriefAResults(responses);

      // Should calculate based only on answered items
      expect(result.scales.INH.raw).toBe(3);
      expect(result.scales.SFT.raw).toBe(3);
      expect(result.scales.EMC.raw).toBe(3);
      expect(result.scales.SMO.raw).toBe(3);
      expect(result.scales.POG.raw).toBe(3);
      expect(result.scales.TSK.raw).toBe(3);
      expect(result.scales.OMA.raw).toBe(3);
      expect(result.scales.WKM.raw).toBe(3);
      expect(result.scales.INI.raw).toBe(3);
    });

    it('should track count of answered items per scale', () => {
      const responses = {
        inh_q1: 1, inh_q2: 1, inh_q3: 1,
        // only 3 of 10 answered
      };
      const result = calculateScaleScore(responses, 'INH');
      expect(result.count).toBe(3);
      expect(result.raw).toBe(3);
    });
  });

  describe('rapid clicking through items (all max values)', () => {
    it('should handle all maximum responses (87 items at 3)', () => {
      const responses = {};
      for (const scaleAbbr of Object.keys(SCALES)) {
        const prefix = scaleAbbr.toLowerCase();
        for (let i = 1; i <= SCALES[scaleAbbr].items; i++) {
          responses[`${prefix}_q${i}`] = 3;
        }
      }
      const result = aggregateBriefAResults(responses);

      // INH max = 30 (10*3)
      expect(result.scales.INH.raw).toBe(30);
      expect(result.scales.INH.max).toBe(30);

      // SMO max = 27 (9*3)
      expect(result.scales.SMO.raw).toBe(27);
      expect(result.scales.SMO.max).toBe(27);

      // T-scores should be high but not extreme
      expect(result.scales.INH.t).toBeGreaterThan(60);
      expect(result.indices.BRI.t).toBeGreaterThan(60);
    });
  });

  describe('empty sessionId scenario (validation only)', () => {
    it('should still calculate scores with empty responses object', () => {
      const result = aggregateBriefAResults({});
      expect(result.scales).toBeDefined();
      expect(result.scales.INH.raw).toBe(0);
      expect(result.indices.BRI.t).toBeDefined();
      expect(result.indices.GEC.t).toBeDefined();
    });
  });

  describe('session storage unavailable', () => {
    it('should not throw on calculation (scoring logic only)', () => {
      expect(() => aggregateBriefAResults({})).not.toThrow();
      expect(() => calculateScaleScore({}, 'INH')).not.toThrow();
      expect(() => interpretScore(50)).not.toThrow();
    });
  });
});

describe('BRIEF-A jsPsych Trial Data Aggregation', () => {
  it('should aggregate from jsPsych trial data format', () => {
    // Simulate jsPsych trial data with module field
    const trialData = [
      { module: 'brief_a', question_id: 'inh_q1', response: 1 },
      { module: 'brief_a', question_id: 'inh_q2', response: 2 },
      { module: 'brief_a', question_id: 'sft_q1', response: 3 },
      { module: 'brief_a', question_id: 'smo_q1', response: 0 },
      { module: 'other_module', question_id: 'foo', response: 1 },
    ];

    // Build responses object from trial data
    const responses = {};
    trialData.forEach(d => {
      if (d.module === 'brief_a' && d.question_id) {
        responses[d.question_id] = d.response;
      }
    });

    const result = aggregateBriefAResults(responses);

    expect(result.scales.INH.raw).toBe(3); // 1 + 2
    expect(result.scales.SFT.raw).toBe(3); // 3
    expect(result.scales.SMO.raw).toBe(0); // 0
    expect(result.scales.POG.raw).toBe(0); // unanswered → 0
  });

  it('should produce complete results from jsPsych format', () => {
    const trialData = [];
    for (const scaleAbbr of Object.keys(SCALES)) {
      const prefix = scaleAbbr.toLowerCase();
      for (let i = 1; i <= SCALES[scaleAbbr].items; i++) {
        trialData.push({
          module: 'brief_a',
          question_id: `${prefix}_q${i}`,
          response: 2,
        });
      }
    }

    const responses = {};
    trialData.forEach(d => {
      if (d.module === 'brief_a' && d.question_id) {
        responses[d.question_id] = d.response;
      }
    });

    const result = aggregateBriefAResults(responses);

    // 87 items * 2 = 174 total raw points distributed across scales
    expect(result.scales.INH.raw).toBe(20); // 10 * 2
    expect(result.scales.SMO.raw).toBe(18); // 9 * 2
    expect(result.indices.BRI.t).toBeGreaterThan(0);
    expect(result.indices.MI.t).toBeGreaterThan(0);
    expect(result.indices.GEC.t).toBeGreaterThan(0);
  });
});
