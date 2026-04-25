/**
 * D-KEFS Verbal Fluency Scoring Module
 *
 * Provides scoring functions for D-KEFS Verbal Fluency subtests:
 * - Letter Fluency (F, A, S)
 * - Category Fluency (Animals, Fruits)
 *
 * @see SPEC-DKEFS.md
 */

/**
 * Calculate D-KEFS Verbal Fluency scores
 *
 * @param {object} results - Results object from aggregateDKEFSResults or raw jsPsych data
 * @returns {object} Scored results with raw scores, composites, and T-score interpretations
 */
export function calculateDKEFSFluencyScores(results) {
  const letterFluency = results.letter_fluency || {};
  const categoryFluency = results.category_fluency || {};
  const summary = results.summary || {};

  // Individual subtest raw scores
  const fCount = letterFluency.F?.count || 0;
  const aCount = letterFluency.A?.count || 0;
  const sCount = letterFluency.S?.count || 0;
  const animalsCount = categoryFluency.animals?.count || 0;
  const fruitsCount = categoryFluency.fruits?.count || 0;

  // Composite scores
  const fasTotal = fCount + aCount + sCount;
  const categoryTotal = animalsCount + fruitsCount;
  const combinedTotal = fasTotal + categoryTotal;

  // Mean scores (for within-task comparison)
  const fasMean = fasTotal / 3;
  const categoryMean = categoryTotal / 2;

  // T-score approximations (clinical reference — actual norms require age/education correction)
  // Based on general adult normative ranges for D-KEFS Verbal Fluency
  const fasTScore = rawToTScore(fasTotal, 'fas');
  const categoryTScore = rawToTScore(categoryTotal, 'category');
  const combinedTScore = rawToTScore(combinedTotal, 'combined');

  return {
    subtests: {
      F: {
        raw: fCount,
        words: letterFluency.F?.words || [],
        t_score: rawToTScore(fCount, 'single'),
        interpretation: interpretScore(fCount, 'letter'),
      },
      A: {
        raw: aCount,
        words: letterFluency.A?.words || [],
        t_score: rawToTScore(aCount, 'single'),
        interpretation: interpretScore(aCount, 'letter'),
      },
      S: {
        raw: sCount,
        words: letterFluency.S?.words || [],
        t_score: rawToTScore(sCount, 'single'),
        interpretation: interpretScore(sCount, 'letter'),
      },
      animals: {
        raw: animalsCount,
        words: categoryFluency.animals?.words || [],
        t_score: rawToTScore(animalsCount, 'single'),
        interpretation: interpretScore(animalsCount, 'category'),
      },
      fruits: {
        raw: fruitsCount,
        words: categoryFluency.fruits?.words || [],
        t_score: rawToTScore(fruitsCount, 'single'),
        interpretation: interpretScore(fruitsCount, 'category'),
      },
    },
    composites: {
      fas: {
        total: fasTotal,
        mean: Math.round(fasMean * 10) / 10,
        t_score: fasTScore,
        interpretation: interpretScore(fasTotal, 'fas'),
      },
      category: {
        total: categoryTotal,
        mean: Math.round(categoryMean * 10) / 10,
        t_score: categoryTScore,
        interpretation: interpretScore(categoryTotal, 'category'),
      },
      combined: {
        total: combinedTotal,
        t_score: combinedTScore,
        interpretation: interpretScore(combinedTotal, 'combined'),
      },
    },
    meta: {
      age_corrected: false,
      note: 'T-scores are raw approximations. Age/education-corrected norms require normative tables.',
    },
  };
}

/**
 * Convert raw score to approximate T-score
 * @param {number} raw - Raw score
 * @param {string} type - 'fas' | 'category' | 'combined' | 'single'
 * @returns {number} Approximate T-score
 */
function rawToTScore(raw, type) {
  // Approximate T-score conversion based on D-KEFS normative data ranges
  // These are illustrative; actual conversion requires age/education norms
  const ranges = {
    fas: {
      very_low:  { max: 17, t: 30 },
      low:       { max: 23, t: 40 },
      low_avg:   { max: 28, t: 45 },
      avg:       { max: 33, t: 50 },
      high_avg:  { max: 38, t: 55 },
      high:      { max: 43, t: 60 },
      very_high: { max: Infinity, t: 65 },
    },
    category: {
      very_low:  { max: 24, t: 30 },
      low:       { max: 31, t: 40 },
      low_avg:   { max: 38, t: 45 },
      avg:       { max: 45, t: 50 },
      high_avg:  { max: 52, t: 55 },
      high:      { max: 60, t: 60 },
      very_high: { max: Infinity, t: 65 },
    },
    combined: {
      very_low:  { max: 40, t: 30 },
      low:       { max: 55, t: 40 },
      low_avg:   { max: 68, t: 45 },
      avg:       { max: 80, t: 50 },
      high_avg:  { max: 92, t: 55 },
      high:      { max: 106, t: 60 },
      very_high: { max: Infinity, t: 65 },
    },
    single: {
      very_low:  { max: 5, t: 30 },
      low:       { max: 8, t: 40 },
      low_avg:   { max: 10, t: 45 },
      avg:       { max: 13, t: 50 },
      high_avg:  { max: 15, t: 55 },
      high:      { max: 18, t: 60 },
      very_high: { max: Infinity, t: 65 },
    },
  };

  const map = ranges[type] || ranges.single;

  if (raw <= map.very_low.max) return map.very_low.t;
  if (raw <= map.low.max) return map.low.t;
  if (raw <= map.low_avg.max) return map.low_avg.t;
  if (raw <= map.avg.max) return map.avg.t;
  if (raw <= map.high_avg.max) return map.high_avg.t;
  if (raw <= map.high.max) return map.high.t;
  return map.very_high.t;
}

/**
 * Interpret a raw score into a clinical label
 * @param {number} raw - Raw score
 * @param {string} type - 'letter' | 'fas' | 'category' | 'combined'
 * @returns {string} Interpretation label
 */
function interpretScore(raw, type) {
  if (type === 'letter') {
    if (raw >= 18) return 'Very High';
    if (raw >= 15) return 'High Average';
    if (raw >= 11) return 'Average';
    if (raw >= 7) return 'Low Average';
    if (raw >= 4) return 'Low';
    return 'Very Low';
  }

  if (type === 'category') {
    if (raw >= 25) return 'Very High';
    if (raw >= 20) return 'High Average';
    if (raw >= 14) return 'Average';
    if (raw >= 10) return 'Low Average';
    if (raw >= 6) return 'Low';
    return 'Very Low';
  }

  if (type === 'fas') {
    if (raw >= 43) return 'Very High';
    if (raw >= 33) return 'High Average';
    if (raw >= 24) return 'Average';
    if (raw >= 18) return 'Low Average';
    if (raw >= 12) return 'Low';
    return 'Very Low';
  }

  if (type === 'combined') {
    if (raw >= 70) return 'Very High';
    if (raw >= 52) return 'High Average';
    if (raw >= 36) return 'Average';
    if (raw >= 26) return 'Low Average';
    if (raw >= 16) return 'Low';
    return 'Very Low';
  }

  return 'Unknown';
}

/**
 * Get standard error of measurement for T-scores
 * @param {string} type - 'fas' | 'category' | 'combined'
 * @returns {number} SEM in T-score points
 */
export function getDKEFSSEM(type = 'fas') {
  // Approximate SEMs for D-KEFS Verbal Fluency composites
  const sems = {
    fas: 3.5,
    category: 3.0,
    combined: 4.0,
    letter: 4.0,
  };
  return sems[type] || 3.0;
}

/**
 * Check if two scores are significantly different (1.65 SE difference)
 * @param {number} score1
 * @param {number} score2
 * @param {string} type
 * @returns {boolean}
 */
export function scoresDiffer(score1, score2, type = 'fas') {
  const sem = getDKEFSSEM(type);
  return Math.abs(score1 - score2) > 1.65 * sem;
}

/**
 * Score comparison between letter fluency and category fluency
 * @param {object} results - Aggregated results
 * @returns {object} Comparison data
 */
export function scoreComparison(results) {
  const composites = calculateDKEFSFluencyScores(results).composites;

  return {
    fas_t: composites.fas.t_score,
    category_t: composites.category.t_score,
    difference: composites.fas.t_score - composites.category.t_score,
    // Positive = letter fluency weaker, Negative = category fluency weaker
    interpretation: interpretDifference(
      composites.fas.t_score - composites.category.t_score
    ),
    significant: Math.abs(
      composites.fas.t_score - composites.category.t_score
    ) > 1.65 * Math.sqrt(getDKEFSSEM('fas') ** 2 + getDKEFSSEM('category') ** 2),
  };
}

function interpretDifference(diff) {
  if (Math.abs(diff) < 5) return 'No meaningful difference';
  if (diff > 0) return 'Category fluency relatively weaker';
  return 'Letter fluency relatively weaker';
}