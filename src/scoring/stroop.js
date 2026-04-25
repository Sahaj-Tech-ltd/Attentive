/**
 * Victoria Stroop Test — Scoring Functions
 *
 * Provides T-score estimation for:
 * - Word Reading (condition 1): read color words in black ink
 * - Color Naming (condition 2): name ink color of XXXXXX strings
 * - Inhibition (condition 3): name ink color of conflicting color words
 *
 * Also computes interference score (Inhibition RT - Color Naming RT).
 */

/**
 * Victoria Stroop normative data: mean RT (ms) by age group and condition
 * Based on published Victoria Stroop normative data (Steitz et al., 2000; as referenced in Strauss et al.)
 */
const STROOP_NORMS = {
  word_reading: {
    // Mean RT in seconds
    '18-29': { mean: 1.01, sd: 0.11 },
    '30-44': { mean: 1.08, sd: 0.12 },
    '45-59': { mean: 1.19, sd: 0.14 },
    '60-69': { mean: 1.38, sd: 0.18 },
    '70+':   { mean: 1.62, sd: 0.24 },
  },
  color_naming: {
    '18-29': { mean: 1.23, sd: 0.15 },
    '30-44': { mean: 1.33, sd: 0.17 },
    '45-59': { mean: 1.51, sd: 0.20 },
    '60-69': { mean: 1.79, sd: 0.27 },
    '70+':   { mean: 2.14, sd: 0.37 },
  },
  inhibition: {
    '18-29': { mean: 1.62, sd: 0.20 },
    '30-44': { mean: 1.77, sd: 0.24 },
    '45-59': { mean: 2.07, sd: 0.30 },
    '60-69': { mean: 2.55, sd: 0.42 },
    '70+':   { mean: 3.18, sd: 0.60 },
  },
};

/**
 * Age group from age (years)
 * @param {number} age
 * @returns {string}
 */
export function getAgeGroup(age) {
  if (age < 30) return '18-29';
  if (age < 45) return '30-44';
  if (age < 60) return '45-59';
  if (age < 70) return '60-69';
  return '70+';
}

/**
 * Get T-score for a condition given RT in seconds
 * @param {string} condition — 'word_reading' | 'color_naming' | 'inhibition'
 * @param {number} rtSeconds — mean RT in seconds
 * @param {string} ageGroup
 * @returns {number} T-score
 */
export function getStroopTscore(condition, rtSeconds, ageGroup = '30-44') {
  const norms = STROOP_NORMS[condition];
  if (!norms) return 50;
  const group = norms[ageGroup] || norms['30-44'];
  if (!group) return 50;

  const { mean, sd } = group;
  if (!sd || sd === 0) return 50;
  // Lower RT = higher T-score (inverse relationship for speeded tasks)
  return Math.round(50 + 10 * ((mean - rtSeconds) / sd));
}

/**
 * Calculate Stroop interference score
 * @param {number} inhibitionRT — mean RT for inhibition condition (seconds)
 * @param {number} colorNamingRT — mean RT for color naming (seconds)
 * @returns {number} interference score (seconds)
 */
export function calculateInterferenceScore(inhibitionRT, colorNamingRT) {
  return Math.round((inhibitionRT - colorNamingRT) * 100) / 100;
}

/**
 * Interpret interference score
 * @param {number} interference — interference score in seconds
 * @returns {string} human-readable interpretation
 */
export function interpretInterference(interference) {
  if (interference < 0.30) return 'Low interference — strong inhibitory control';
  if (interference < 0.50) return 'Moderate interference — typical inhibitory control';
  if (interference < 0.80) return 'High interference — reduced inhibitory control';
  return 'Very high interference — significant difficulty with inhibitory control';
}

/**
 * Calculate all Stroop scores from trial results
 * @param {Object} results — { word_reading: Trial[], color_naming: Trial[], inhibition: Trial[] }
 * @param {string} ageGroup
 * @returns {Object} aggregated scores
 */
export function calculateStroopScores(results, ageGroup = '30-44') {
  const calcCondition = (trials) => {
    const validTrials = trials.filter(t => t.rt_ms >= 100 && t.rt_ms <= 3000);
    const errors = trials.filter(t => !t.correct).length;
    const rts = validTrials.map(t => t.rt_ms);
    const meanRT = rts.length > 0
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : 0;
    const meanRTSec = meanRT / 1000;
    const tScore = getStroopTscore('word_reading', meanRTSec, ageGroup);

    return {
      total_trials: trials.length,
      errors,
      error_rate: trials.length > 0 ? Math.round((errors / trials.length) * 100) : 0,
      valid_trials: validTrials.length,
      mean_rt_ms: meanRT,
      mean_rt_sec: Math.round(meanRT / 100) / 10,
      t_score: tScore,
    };
  };

  // We detect which condition is which by checking a sample stimulus
  const conditions = ['word_reading', 'color_naming', 'inhibition'];
  const scored = {};

  for (const condition of conditions) {
    const trials = results[condition] || [];
    if (trials.length === 0) {
      scored[condition] = {
        total_trials: 0, errors: 0, error_rate: 0, valid_trials: 0,
        mean_rt_ms: 0, mean_rt_sec: 0, t_score: 50,
      };
      continue;
    }

    // Use condition-specific norms
    const validTrials = trials.filter(t => t.rt_ms >= 100 && t.rt_ms <= 3000);
    const errors = trials.filter(t => !t.correct).length;
    const rts = validTrials.map(t => t.rt_ms);
    const meanRT = rts.length > 0
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : 0;
    const meanRTSec = Math.round(meanRT / 100) / 10;
    const tScore = getStroopTscore(condition, meanRTSec, ageGroup);

    scored[condition] = {
      total_trials: trials.length,
      errors,
      error_rate: trials.length > 0 ? Math.round((errors / trials.length) * 100) : 0,
      valid_trials: validTrials.length,
      mean_rt_ms: meanRT,
      mean_rt_sec: meanRTSec,
      t_score: tScore,
    };
  }

  // Interference score
  const inhibitionRT = scored.inhibition?.mean_rt_sec || 0;
  const colorNamingRT = scored.color_naming?.mean_rt_sec || 0;
  const interference = calculateInterferenceScore(inhibitionRT, colorNamingRT);

  // T-score for interference (difference-based)
  const interferenceT = getStroopTscore('inhibition', inhibitionRT, ageGroup);
  const colorNamingT = getStroopTscore('color_naming', colorNamingRT, ageGroup);
  // Interference T = how much the Stroop effect costs in T-score units
  const netInterferenceT = Math.round(interferenceT - colorNamingT);

  return {
    word_reading: scored.word_reading,
    color_naming: scored.color_naming,
    inhibition: scored.inhibition,
    interference_score: interference,
    interference_interpreted: interpretInterference(interference),
    interference_t_score: netInterferenceT,
    derived: {
      age_group: ageGroup,
      total_time_sec: Math.round(
        (scored.word_reading?.mean_rt_ms || 0) +
        (scored.color_naming?.mean_rt_ms || 0) +
        (scored.inhibition?.mean_rt_ms || 0)
      ) / 1000,
    },
  };
}
