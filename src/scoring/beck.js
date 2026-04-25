/**
 * Beck Inventories Scoring Functions
 * BDI-II (Beck Depression Inventory) and BAI (Beck Anxiety Inventory)
 *
 * BDI-II: 21 items, each 0-3, max 63
 * BAI: 21 items, each 0-3, max 63
 */

/**
 * Calculate BDI-II total score from responses object
 * @param {Object} responses - { bdi2_q1: 0-3, bdi2_q2: 0-3, ... }
 * @returns {{ total: number, count: number, max: number }}
 */
export function calculateBDI2Score(responses) {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 21; i++) {
    const key = `bdi2_q${i}`;
    const val = responses[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 3) {
        total += num;
        count++;
      }
    }
  }
  return { total, count, max: 63 };
}

/**
 * Calculate BAI total score from responses object
 * @param {Object} responses - { bai_q1: 0-3, bai_q2: 0-3, ... }
 * @returns {{ total: number, count: number, max: number }}
 */
export function calculateBAIScore(responses) {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 21; i++) {
    const key = `bai_q${i}`;
    const val = responses[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 3) {
        total += num;
        count++;
      }
    }
  }
  return { total, count, max: 63 };
}

/**
 * Interpret BDI-II score into severity level
 * @param {number} score - BDI-II total (0-63)
 * @returns {string} Interpretation label
 */
export function interpretBDI2(score) {
  const s = parseInt(score) || 0;
  if (s <= 13) return 'Minimal depression';
  if (s <= 19) return 'Mild depression';
  if (s <= 25) return 'Moderate depression';
  return 'Severe depression';
}

/**
 * Interpret BAI score into severity level
 * @param {number} score - BAI total (0-63)
 * @returns {string} Interpretation label
 */
export function interpretBAI(score) {
  const s = parseInt(score) || 0;
  if (s <= 7) return 'Minimal anxiety';
  if (s <= 15) return 'Mild anxiety';
  if (s <= 25) return 'Moderate anxiety';
  return 'Severe anxiety';
}

/**
 * Get BDI-II severity color for UI display
 * @param {number} score
 * @returns {string} CSS color class
 */
export function getBDI2ColorClass(score) {
  const s = parseInt(score) || 0;
  if (s <= 13) return 'score-minimal';
  if (s <= 19) return 'score-mild';
  if (s <= 25) return 'score-moderate';
  return 'score-severe';
}

/**
 * Get BAI severity color for UI display
 * @param {number} score
 * @returns {string} CSS color class
 */
export function getBAIColorClass(score) {
  const s = parseInt(score) || 0;
  if (s <= 7) return 'score-minimal';
  if (s <= 15) return 'score-mild';
  if (s <= 25) return 'score-moderate';
  return 'score-severe';
}

/**
 * Validate a BDI-II response value
 * @param {*} value
 * @returns {boolean}
 */
export function isValidBDI2Item(value) {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 3;
}

/**
 * Validate a BAI response value
 * @param {*} value
 * @returns {boolean}
 */
export function isValidBAIItem(value) {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 3;
}

/**
 * Calculate both BDI-II and BAI scores from combined responses
 * @param {Object} bdi2Responses
 * @param {Object} baiResponses
 * @returns {Object} { bdi2: { total, interpretation }, bai: { total, interpretation } }
 */
export function calculateBeckScores(bdi2Responses, baiResponses) {
  const bdi2 = calculateBDI2Score(bdi2Responses);
  const bai = calculateBAIScore(baiResponses);

  return {
    bdi2: {
      total: bdi2.total,
      max: bdi2.max,
      interpretation: interpretBDI2(bdi2.total),
    },
    bai: {
      total: bai.total,
      max: bai.max,
      interpretation: interpretBAI(bai.total),
    },
  };
}
