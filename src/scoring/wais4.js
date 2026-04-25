/**
 * WAIS-IV Scoring Functions
 * 
 * Provides scaled score estimation for:
 * - Digit Span Forward (DSF)
 * - Digit Span Backward (DSB)
 * - Coding / Symbol Search
 * 
 * Scaled scores have mean=10, SD=3 per WAIS-IV manual.
 * Age-corrected normative tables are approximated for screening purposes.
 */

/**
 * Age group categories for scaled score lookup
 * @typedef {'18-29' | '30-44' | '45-59' | '60-69' | '70+'} AgeGroup
 */

/**
 * DSF scaled score lookup table (age 18-29)
 * Maps raw scores (0-14) to scaled scores
 */
const DSF_NORMS_18_29 = {
    0: 2, 1: 2, 2: 3, 3: 3,
    4: 5, 5: 5,
    6: 7, 7: 7,
    8: 9, 9: 9,
    10: 11, 11: 11,
    12: 13, 13: 13,
    14: 16
};

/**
 * DSF scaled score lookup table (age 30-44)
 */
const DSF_NORMS_30_44 = {
    0: 2, 1: 2, 2: 3, 3: 3,
    4: 5, 5: 5,
    6: 7, 7: 7,
    8: 9, 9: 9,
    10: 11, 11: 11,
    12: 13, 13: 13,
    14: 15
};

/**
 * DSF scaled score lookup table (age 45-59)
 */
const DSF_NORMS_45_59 = {
    0: 2, 1: 2, 2: 3, 3: 3,
    4: 5, 5: 5,
    6: 7, 7: 7,
    8: 9, 9: 9,
    10: 11, 11: 11,
    12: 12, 13: 13,
    14: 14
};

/**
 * DSF scaled score lookup table (age 60-69)
 */
const DSF_NORMS_60_69 = {
    0: 2, 1: 2, 2: 3, 3: 4,
    4: 5, 5: 6,
    6: 7, 7: 8,
    8: 9, 9: 10,
    10: 11, 11: 12,
    12: 13, 13: 13,
    14: 14
};

/**
 * DSF scaled score lookup table (age 70+)
 */
const DSF_NORMS_70 = {
    0: 2, 1: 2, 2: 3, 3: 4,
    4: 5, 5: 6,
    6: 7, 7: 8,
    8: 9, 9: 10,
    10: 11, 11: 12,
    12: 13, 13: 14,
    14: 15
};

/**
 * DSB scaled score lookup table (age 18-29)
 */
const DSB_NORMS_18_29 = {
    0: 2, 1: 2, 2: 3, 3: 3,
    4: 4, 5: 4,
    6: 6, 7: 6,
    8: 8, 9: 8,
    10: 10, 11: 10,
    12: 12, 13: 12,
    14: 15
};

/**
 * DSB scaled score lookup table (age 30-44)
 */
const DSB_NORMS_30_44 = {
    0: 2, 1: 2, 2: 3, 3: 3,
    4: 4, 5: 5,
    6: 6, 7: 6,
    8: 8, 9: 8,
    10: 10, 11: 11,
    12: 12, 13: 13,
    14: 14
};

/**
 * DSB scaled score lookup table (age 45-59)
 */
const DSB_NORMS_45_59 = {
    0: 2, 1: 2, 2: 3, 3: 4,
    4: 5, 5: 5,
    6: 6, 7: 7,
    8: 8, 9: 9,
    10: 10, 11: 11,
    12: 12, 13: 13,
    14: 14
};

/**
 * DSB scaled score lookup table (age 60-69)
 */
const DSB_NORMS_60_69 = {
    0: 2, 1: 2, 2: 3, 3: 4,
    4: 5, 5: 6,
    6: 6, 7: 7,
    8: 9, 9: 9,
    10: 10, 11: 11,
    12: 12, 13: 13,
    14: 14
};

/**
 * DSB scaled score lookup table (age 70+)
 */
const DSB_NORMS_70 = {
    0: 2, 1: 2, 2: 3, 3: 4,
    4: 5, 5: 6,
    6: 7, 7: 8,
    8: 8, 9: 9,
    10: 10, 11: 11,
    12: 12, 13: 13,
    14: 14
};

/**
 * Coding scaled score lookup table (age 18-29)
 * Raw score: total correct within 90 seconds
 */
const CODING_NORMS_18_29 = {
    0: 2, 1: 2, 2: 2, 3: 2, 4: 2,
    5: 2, 6: 3, 7: 3, 8: 3, 9: 3,
    10: 4, 11: 4, 12: 4, 13: 4, 14: 4,
    15: 5, 16: 5, 17: 5, 18: 5, 19: 5,
    20: 6, 21: 6, 22: 6, 23: 6, 24: 7,
    25: 7, 26: 7, 27: 7, 28: 7, 29: 7,
    30: 8, 31: 8, 32: 8, 33: 8, 34: 8,
    35: 9, 36: 9, 37: 9, 38: 9, 39: 9,
    40: 10, 41: 10, 42: 10, 43: 10, 44: 10,
    45: 11, 46: 11, 47: 11, 48: 11, 49: 11,
    50: 12, 51: 12, 52: 12, 53: 12, 54: 12,
    55: 13, 56: 13, 57: 13, 58: 13, 59: 13,
    60: 14, 61: 14, 62: 14, 63: 14, 64: 14,
    65: 15, 66: 15, 67: 15, 68: 15, 69: 15,
    70: 16, 71: 16, 72: 16, 73: 16, 74: 16,
    75: 16, 76: 17, 77: 17, 78: 17, 79: 17,
    80: 17, 81: 18, 82: 18, 83: 18, 84: 18,
    85: 19, 86: 19, 87: 19, 88: 19, 89: 19,
    90: 19, 91: 19, 92: 19, 93: 19, 94: 19,
    95: 19, 96: 19, 97: 19, 98: 19, 99: 19,
    100: 19, 101: 19, 102: 19, 103: 19, 104: 19,
    105: 19, 106: 19, 107: 19, 108: 19, 109: 19,
    110: 19, 111: 19, 112: 19, 113: 19, 114: 19,
    115: 19, 116: 19, 117: 19, 118: 19, 119: 19,
    120: 19
};

/**
 * Coding scaled score lookup table (age 30-44)
 */
const CODING_NORMS_30_44 = {
    0: 2, 1: 2, 2: 2, 3: 2, 4: 2,
    5: 2, 6: 3, 7: 3, 8: 3, 9: 3,
    10: 4, 11: 4, 12: 4, 13: 5, 14: 5,
    15: 5, 16: 5, 17: 5, 18: 6, 19: 6,
    20: 6, 21: 6, 22: 7, 23: 7, 24: 7,
    25: 7, 26: 7, 27: 8, 28: 8, 29: 8,
    30: 8, 31: 8, 32: 9, 33: 9, 34: 9,
    35: 9, 36: 9, 37: 10, 38: 10, 39: 10,
    40: 10, 41: 10, 42: 10, 43: 11, 44: 11,
    45: 11, 46: 11, 47: 11, 48: 11, 49: 11,
    50: 12, 51: 12, 52: 12, 53: 12, 54: 12,
    55: 13, 56: 13, 57: 13, 58: 13, 59: 13,
    60: 14, 61: 14, 62: 14, 63: 14, 64: 14,
    65: 15, 66: 15, 67: 15, 68: 15, 69: 15,
    70: 16, 71: 16, 72: 16, 73: 16, 74: 16,
    75: 16, 76: 17, 77: 17, 78: 17, 79: 17,
    80: 17, 81: 18, 82: 18, 83: 18, 84: 18,
    85: 19, 86: 19, 87: 19, 88: 19, 89: 19,
    90: 19, 91: 19, 92: 19, 93: 19, 94: 19,
    95: 19, 96: 19, 97: 19, 98: 19, 99: 19,
    100: 19, 101: 19, 102: 19, 103: 19, 104: 19,
    105: 19, 106: 19, 107: 19, 108: 19, 109: 19,
    110: 19, 111: 19, 112: 19, 113: 19, 114: 19,
    115: 19, 116: 19, 117: 19, 118: 19, 119: 19,
    120: 19
};

/**
 * Coding scaled score lookup table (age 45-59)
 */
const CODING_NORMS_45_59 = {
    0: 2, 1: 2, 2: 2, 3: 2, 4: 2,
    5: 2, 6: 3, 7: 3, 8: 4, 9: 4,
    10: 4, 11: 5, 12: 5, 13: 5, 14: 6,
    15: 6, 16: 6, 17: 6, 18: 7, 19: 7,
    20: 7, 21: 7, 22: 8, 23: 8, 24: 8,
    25: 8, 26: 9, 27: 9, 28: 9, 29: 9,
    30: 9, 31: 10, 32: 10, 33: 10, 34: 10,
    35: 10, 36: 11, 37: 11, 38: 11, 39: 11,
    40: 11, 41: 11, 42: 12, 43: 12, 44: 12,
    45: 12, 46: 12, 47: 13, 48: 13, 49: 13,
    50: 13, 51: 13, 52: 14, 53: 14, 54: 14,
    55: 14, 56: 14, 57: 15, 58: 15, 59: 15,
    60: 15, 61: 15, 62: 16, 63: 16, 64: 16,
    65: 16, 66: 16, 67: 17, 68: 17, 69: 17,
    70: 17, 71: 17, 72: 18, 73: 18, 74: 18,
    75: 18, 76: 18, 77: 19, 78: 19, 79: 19,
    80: 19, 81: 19, 82: 19, 83: 19, 84: 19,
    85: 19, 86: 19, 87: 19, 88: 19, 89: 19,
    90: 19, 91: 19, 92: 19, 93: 19, 94: 19,
    95: 19, 96: 19, 97: 19, 98: 19, 99: 19,
    100: 19, 101: 19, 102: 19, 103: 19, 104: 19,
    105: 19, 106: 19, 107: 19, 108: 19, 109: 19,
    110: 19, 111: 19, 112: 19, 113: 19, 114: 19,
    115: 19, 116: 19, 117: 19, 118: 19, 119: 19,
    120: 19
};

/**
 * Coding scaled score lookup table (age 60-69)
 */
const CODING_NORMS_60_69 = {
    0: 2, 1: 2, 2: 2, 3: 3, 4: 3,
    5: 4, 6: 4, 7: 5, 8: 5, 9: 6,
    10: 6, 11: 6, 12: 7, 13: 7, 14: 7,
    15: 8, 16: 8, 17: 8, 18: 9, 19: 9,
    20: 9, 21: 10, 22: 10, 23: 10, 24: 10,
    25: 11, 26: 11, 27: 11, 28: 12, 29: 12,
    30: 12, 31: 12, 32: 13, 33: 13, 34: 13,
    35: 13, 36: 14, 37: 14, 38: 14, 39: 14,
    40: 14, 41: 15, 42: 15, 43: 15, 44: 15,
    45: 15, 46: 16, 47: 16, 48: 16, 49: 16,
    50: 16, 51: 17, 52: 17, 53: 17, 54: 17,
    55: 17, 56: 18, 57: 18, 58: 18, 59: 18,
    60: 18, 61: 19, 62: 19, 63: 19, 64: 19,
    65: 19, 66: 19, 67: 19, 68: 19, 69: 19,
    70: 19, 71: 19, 72: 19, 73: 19, 74: 19,
    75: 19, 76: 19, 77: 19, 78: 19, 79: 19,
    80: 19, 81: 19, 82: 19, 83: 19, 84: 19,
    85: 19, 86: 19, 87: 19, 88: 19, 89: 19,
    90: 19, 91: 19, 92: 19, 93: 19, 94: 19,
    95: 19, 96: 19, 97: 19, 98: 19, 99: 19,
    100: 19, 101: 19, 102: 19, 103: 19, 104: 19,
    105: 19, 106: 19, 107: 19, 108: 19, 109: 19,
    110: 19, 111: 19, 112: 19, 113: 19, 114: 19,
    115: 19, 116: 19, 117: 19, 118: 19, 119: 19,
    120: 19
};

/**
 * Coding scaled score lookup table (age 70+)
 */
const CODING_NORMS_70 = {
    0: 2, 1: 2, 2: 2, 3: 3, 4: 3,
    5: 4, 6: 4, 7: 5, 8: 5, 9: 6,
    10: 6, 11: 6, 12: 7, 13: 7, 14: 8,
    15: 8, 16: 8, 17: 9, 18: 9, 19: 9,
    20: 10, 21: 10, 22: 10, 23: 11, 24: 11,
    25: 11, 26: 11, 27: 12, 28: 12, 29: 12,
    30: 13, 31: 13, 32: 13, 33: 13, 34: 13,
    35: 14, 36: 14, 37: 14, 38: 14, 39: 14,
    40: 15, 41: 15, 42: 15, 43: 15, 44: 15,
    45: 16, 46: 16, 47: 16, 48: 16, 49: 16,
    50: 17, 51: 17, 52: 17, 53: 17, 54: 17,
    55: 18, 56: 18, 57: 18, 58: 18, 59: 18,
    60: 19, 61: 19, 62: 19, 63: 19, 64: 19,
    65: 19, 66: 19, 67: 19, 68: 19, 69: 19,
    70: 19, 71: 19, 72: 19, 73: 19, 74: 19,
    75: 19, 76: 19, 77: 19, 78: 19, 79: 19,
    80: 19, 81: 19, 82: 19, 83: 19, 84: 19,
    85: 19, 86: 19, 87: 19, 88: 19, 89: 19,
    90: 19, 91: 19, 92: 19, 93: 19, 94: 19,
    95: 19, 96: 19, 97: 19, 98: 19, 99: 19,
    100: 19, 101: 19, 102: 19, 103: 19, 104: 19,
    105: 19, 106: 19, 107: 19, 108: 19, 109: 19,
    110: 19, 111: 19, 112: 19, 113: 19, 114: 19,
    115: 19, 116: 19, 117: 19, 118: 19, 119: 19,
    120: 19
};

/**
 * Get DSF norms table for age group
 * @param {string} ageGroup
 * @returns {Object}
 */
function getDSFNorms(ageGroup) {
    const tables = {
        '18-29': DSF_NORMS_18_29,
        '30-44': DSF_NORMS_30_44,
        '45-59': DSF_NORMS_45_59,
        '60-69': DSF_NORMS_60_69,
        '70+': DSF_NORMS_70
    };
    return tables[ageGroup] || DSF_NORMS_18_29;
}

/**
 * Get DSB norms table for age group
 * @param {string} ageGroup
 * @returns {Object}
 */
function getDSBNorms(ageGroup) {
    const tables = {
        '18-29': DSB_NORMS_18_29,
        '30-44': DSB_NORMS_30_44,
        '45-59': DSB_NORMS_45_59,
        '60-69': DSB_NORMS_60_69,
        '70+': DSB_NORMS_70
    };
    return tables[ageGroup] || DSB_NORMS_18_29;
}

/**
 * Get Coding norms table for age group
 * @param {string} ageGroup
 * @returns {Object}
 */
function getCodingNorms(ageGroup) {
    const tables = {
        '18-29': CODING_NORMS_18_29,
        '30-44': CODING_NORMS_30_44,
        '45-59': CODING_NORMS_45_59,
        '60-69': CODING_NORMS_60_69,
        '70+': CODING_NORMS_70
    };
    return tables[ageGroup] || CODING_NORMS_18_29;
}

/**
 * Get DSF scaled score estimate from raw score
 * @param {number} rawScore - Raw score (0-14)
 * @param {string} ageGroup - Age group
 * @returns {number} Scaled score estimate
 */
export function getDSFScaledScore(rawScore, ageGroup = '18-29') {
    const norms = getDSFNorms(ageGroup);
    return norms[Math.min(rawScore, 14)] || 2;
}

/**
 * Get DSB scaled score estimate from raw score
 * @param {number} rawScore - Raw score (0-14)
 * @param {string} ageGroup - Age group
 * @returns {number} Scaled score estimate
 */
export function getDSBScaledScore(rawScore, ageGroup = '18-29') {
    const norms = getDSBNorms(ageGroup);
    return norms[Math.min(rawScore, 14)] || 2;
}

/**
 * Get Coding scaled score estimate from raw score
 * @param {number} rawScore - Raw score (0-120)
 * @param {string} ageGroup - Age group
 * @returns {number} Scaled score estimate
 */
export function getCodingScaledScore(rawScore, ageGroup = '18-29') {
    const norms = getCodingNorms(ageGroup);
    return norms[Math.min(rawScore, 120)] || 2;
}

/**
 * Calculate WAIS-IV scaled scores from raw scores
 * 
 * @param {Object} raw - { dsf: number, dsb: number, coding: number }
 * @param {string} ageGroup - Age group for normative lookup
 * @returns {Object} { dsf_estimated, dsb_estimated, coding_estimated }
 */
export function calculateWAIS4Scores(raw, ageGroup = '18-29') {
    return {
        dsf_estimated: getDSFScaledScore(raw.dsf ?? 0, ageGroup),
        dsb_estimated: getDSBScaledScore(raw.dsb ?? 0, ageGroup),
        coding_estimated: getCodingScaledScore(raw.coding ?? 0, ageGroup)
    };
}

/**
 * Get Working Memory Index estimate (average of DSF and DSB scaled)
 * @param {number} dsfScaled
 * @param {number} dsbScaled
 * @returns {number}
 */
export function getWorkingMemoryIndex(dsfScaled, dsbScaled) {
    return Math.round((dsfScaled + dsbScaled) / 2);
}

/**
 * Get Processing Speed Index estimate (Coding scaled)
 * @param {number} codingScaled
 * @returns {number}
 */
export function getProcessingSpeedIndex(codingScaled) {
    return codingScaled;
}
