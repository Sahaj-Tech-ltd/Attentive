/**
 * Wisconsin Card Sorting Test (WCST) — Scoring Functions
 *
 * Provides T-score estimation and error classification for the WCST.
 * Normative data based on Heaton et al. (1993) WCST manual.
 */

/**
 * WCST normative data: mean values by age group and education
 * Derived from Heaton et al. (1993) WCST Manual, Table 17.
 *
 * For total_errors and perseverative_errors: lower is better.
 * For categories_completed: higher is better.
 *
 * Education: "low" = ≤12 years, "high" = >12 years
 */
const WCST_NORMS = {
  total_errors: {
    '18-29': {
      low:    { mean: 18.5, sd: 8.2 },
      high:   { mean: 12.1, sd: 6.5 },
    },
    '30-44': {
      low:    { mean: 22.3, sd: 9.4 },
      high:   { mean: 15.8, sd: 7.6 },
    },
    '45-59': {
      low:    { mean: 27.1, sd: 11.2 },
      high:   { mean: 19.4, sd: 9.0 },
    },
    '60-69': {
      low:    { mean: 32.8, sd: 13.1 },
      high:   { mean: 24.6, sd: 11.3 },
    },
    '70+': {
      low:    { mean: 38.5, sd: 15.4 },
      high:   { mean: 30.2, sd: 13.8 },
    },
  },
  perseverative_errors: {
    '18-29': {
      low:    { mean: 8.2, sd: 4.5 },
      high:   { mean: 5.1, sd: 3.4 },
    },
    '30-44': {
      low:    { mean: 10.5, sd: 5.8 },
      high:   { mean: 7.2, sd: 4.6 },
    },
    '45-59': {
      low:    { mean: 13.8, sd: 7.4 },
      high:   { mean: 9.4, sd: 6.0 },
    },
    '60-69': {
      low:    { mean: 17.2, sd: 9.1 },
      high:   { mean: 12.8, sd: 8.0 },
    },
    '70+': {
      low:    { mean: 21.5, sd: 11.3 },
      high:   { mean: 16.4, sd: 10.2 },
    },
  },
  categories_completed: {
    '18-29': {
      low:    { mean: 4.8, sd: 1.4 },
      high:   { mean: 5.6, sd: 0.9 },
    },
    '30-44': {
      low:    { mean: 4.1, sd: 1.7 },
      high:   { mean: 5.1, sd: 1.1 },
    },
    '45-59': {
      low:    { mean: 3.2, sd: 2.0 },
      high:   { mean: 4.4, sd: 1.4 },
    },
    '60-69': {
      low:    { mean: 2.4, sd: 2.1 },
      high:   { mean: 3.6, sd: 1.7 },
    },
    '70+': {
      low:    { mean: 1.6, sd: 2.0 },
      high:   { mean: 2.8, sd: 1.9 },
    },
  },
};

// Metrics where lower raw score = better performance (higher T-score)
const LOWER_IS_BETTER = new Set(['total_errors', 'perseverative_errors']);

/**
 * Get age group label from age in years
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
 * Get education level key
 * @param {number} educationYears — total years of education
 * @returns {'low'|'high'}
 */
export function getEducationLevel(educationYears) {
  return educationYears <= 12 ? 'low' : 'high';
}

/**
 * Calculate T-score from raw score and normative data.
 * For error metrics: higher errors → lower T (inverse).
 * For categories_completed: higher categories → higher T (direct).
 *
 * @param {number} raw — raw score
 * @param {{ mean: number, sd: number }} norm — normative mean and SD
 * @param {boolean} lowerIsBetter — true for error metrics, false for counts
 * @returns {number}
 */
function rawToTscore(raw, norm, lowerIsBetter = true) {
  if (!norm || !norm.sd || norm.sd === 0) return 50;
  if (lowerIsBetter) {
    // Higher raw errors → lower T-score
    return Math.round(50 + 10 * ((norm.mean - raw) / norm.sd));
  }
  // Higher raw categories → higher T-score
  return Math.round(50 + 10 * ((raw - norm.mean) / norm.sd));
}

/**
 * Get WCST T-score for a metric
 * @param {'total_errors'|'perseverative_errors'|'categories_completed'} metric
 * @param {number} value
 * @param {string} ageGroup
 * @param {'low'|'high'} educationLevel
 * @returns {number}
 */
export function getWCSTTscore(metric, value, ageGroup = '30-44', educationLevel = 'low') {
  const table = WCST_NORMS[metric];
  if (!table) return 50;
  const ageRow = table[ageGroup] || table['30-44'];
  if (!ageRow) return 50;
  const norm = ageRow[educationLevel] || ageRow['low'];
  if (!norm) return 50;
  const lowerIsBetter = LOWER_IS_BETTER.has(metric);
  return rawToTscore(value, norm, lowerIsBetter);
}

/**
 * Interpret a T-score in clinical context
 * @param {number} t
 * @returns {string}
 */
export function interpretWCSTScore(t) {
  if (t >= 65) return 'Markedly Atypical — significant impairment';
  if (t >= 60) return 'Moderately Elevated — notable difficulty';
  if (t >= 55) return 'Mildly Elevated — mild difficulty';
  if (t >= 45) return 'Average — typical range';
  if (t >= 40) return 'Low Average — below typical';
  return 'Very Low — significantly below typical';
}

/**
 * Classify an error as perseverative or non-perseverative.
 *
 * Perseverative error: error committed on the same dimension
 * (color / shape / number) as the immediately preceding error.
 *
 * Timeout errors are NOT classified as perseverative.
 *
 * @param {Object} currentTrial — { correct, current_category, previous_error_category }
 * @param {string|null} previousErrorCategory — dimension of previous error, or null
 * @returns {{ is_perseverative_error: boolean, is_non_perseverative_error: boolean }}
 */
export function classifyError(currentTrial, previousErrorCategory) {
  if (currentTrial.correct) {
    return { is_perseverative_error: false, is_non_perseverative_error: false };
  }
  if (currentTrial.timed_out) {
    // Timeouts are errors but not classified for perseveration
    return { is_perseverative_error: false, is_non_perseverative_error: true };
  }
  if (previousErrorCategory && currentTrial.current_category === previousErrorCategory) {
    return { is_perseverative_error: true, is_non_perseverative_error: false };
  }
  return { is_perseverative_error: false, is_non_perseverative_error: true };
}

/**
 * Calculate all WCST scores from trial array
 *
 * @param {Array} trials — array of WCST trial objects (from jsPsych data)
 * @param {Object} options
 * @param {string} options.ageGroup — '18-29'|'30-44'|'45-59'|'60-69'|'70+'
 * @param {string} options.educationLevel — 'low'|'high'
 * @returns {Object} full score object
 */
export function calculateWCSTScores(trials, options = {}) {
  const {
    ageGroup = '30-44',
    educationLevel = 'low',
  } = options;

  // Filter to only test trials (skip intro/practice if any)
  const testTrials = trials.filter(t =>
    t.module === 'wcst' &&
    t.trial_type === 'wcst'
  );

  const total_trials = testTrials.length;
  const errors = testTrials.filter(t => !t.correct);
  const total_errors = errors.length;

  // Categories completed (each time 10 consecutive correct sorts achieved)
  const categories_completed = testTrials.reduce((max, t) =>
    Math.max(max, t.categories_completed || 0), 0);

  // Perseverative vs non-perseverative errors
  let perseverative_errors = 0;
  let non_perseverative_errors = 0;
  let previousErrorCategory = null;

  for (const trial of testTrials) {
    if (!trial.correct) {
      if (trial.is_perseverative_error) {
        perseverative_errors++;
      } else {
        non_perseverative_errors++;
      }
    }
    // Track previous error category for next iteration
    if (!trial.correct && !trial.timed_out) {
      previousErrorCategory = trial.current_category;
    }
  }

  // RT calculations — valid trials only (100ms–5000ms)
  const validRTs = testTrials
    .filter(t => t.rt_ms >= 100 && t.rt_ms <= 5000)
    .map(t => t.rt_ms);

  const mean_rt_ms = validRTs.length > 0
    ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length)
    : 0;

  const percent_correct = total_trials > 0
    ? Math.round(((total_trials - total_errors) / total_trials) * 100)
    : 0;

  // T-scores for each metric
  const t_score_total = getWCSTTscore('total_errors', total_errors, ageGroup, educationLevel);
  const t_score_persev = getWCSTTscore('perseverative_errors', perseverative_errors, ageGroup, educationLevel);
  const t_score_categories = getWCSTTscore('categories_completed', categories_completed, ageGroup, educationLevel);

  return {
    categories_completed,
    total_trials,
    total_errors,
    perseverative_errors,
    non_perseverative_errors,
    percent_correct,
    mean_rt_ms,
    t_score: t_score_total,
    t_score_perseverative_errors: t_score_persev,
    t_score_categories_completed: t_score_categories,
    interpretation: interpretWCSTScore(t_score_total),
    age_group: ageGroup,
    education_level: educationLevel,
  };
}

/**
 * Aggregate WCST results from raw jsPsych data array
 *
 * @param {Array} data — raw jsPsych trial data
 * @param {string} ageGroup
 * @param {string} educationLevel
 * @returns {Object} aggregated scores ready for storage
 */
export function aggregateWCSTResults(data, ageGroup = '30-44', educationLevel = 'low') {
  const wcstTrials = data.filter(d => d.module === 'wcst');
  const scores = calculateWCSTScores(wcstTrials, { ageGroup, educationLevel });

  // Completed categories detail
  const completedCategories = [];
  const categoryMap = {};
  for (const trial of wcstTrials) {
    if (trial.current_category && !categoryMap[trial.current_category]) {
      const trialsForCat = wcstTrials.filter(t =>
        t.current_category === trial.current_category
      );
      const correctTrials = trialsForCat.filter(t => t.correct);
      const catCompletes = Math.max(...trialsForCat.map(t => t.categories_completed || 0));
      if (catCompletes > 0) {
        const firstCompletingTrial = trialsForCat.find(t => t.categories_completed === catCompletes);
        const indexOfFirst = firstCompletingTrial
          ? trialsForCat.indexOf(firstCompletingTrial) + 1
          : trialsForCat.length;
        completedCategories.push({
          dimension: trial.current_category,
          cards_to_complete: indexOfFirst,
        });
        categoryMap[trial.current_category] = true;
      }
    }
  }

  return {
    ...scores,
    completed_categories: completedCategories,
    metadata: {
      completed_at: new Date().toISOString(),
      age_group: ageGroup,
      education_level: educationLevel,
    },
  };
}