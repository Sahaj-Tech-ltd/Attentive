/**
 * BRIEF-A Scoring Functions
 * Behavior Rating Inventory of Executive Function – Adult
 *
 * 87 items across 9 clinical scales, each rated 0-3:
 * 0 = Never, 1 = Sometimes, 2 = Often, 3 = Very Often
 *
 * Scale item counts:
 * - INH, SFT, EMC, POG, OMA, INI: 10 items each (max 30)
 * - SMO, TSK, WKM: 9 items each (max 27)
 *
 * Indices:
 * - BRI (Behavioral Regulation Index) = INH + SFT + EMC + SMO T-scores → T-score
 * - MI (Metacognition Index) = POG + TSK + OMA + WKM + INI T-scores → T-score
 * - GEC (Global Executive Composite) = BRI + MI raw sums → T-score
 */

// Scale definitions: name → [itemCount, maxRawScore]
export const SCALES = {
  INH: { name: 'Inhibit', items: 10, max: 30 },
  SFT: { name: 'Shift', items: 10, max: 30 },
  EMC: { name: 'Emotional Control', items: 10, max: 30 },
  SMO: { name: 'Self-Monitor', items: 9, max: 27 },
  POG: { name: 'Plan/Organize', items: 10, max: 30 },
  TSK: { name: 'Task-Monitor', items: 9, max: 27 },
  OMA: { name: 'Organization of Materials', items: 10, max: 30 },
  WKM: { name: 'Working Memory', items: 9, max: 27 },
  INI: { name: 'Initiate', items: 10, max: 30 },
};

// Index composition (which scales feed into each index)
export const INDEX_COMPOSITION = {
  BRI: ['INH', 'SFT', 'EMC', 'SMO'],
  MI: ['POG', 'TSK', 'OMA', 'WKM', 'INI'],
  GEC: ['BRI', 'MI'],
};

// T-score normative means and SDs by scale (age 18+ general population approximation)
// These are clinical approximation values; real BRIEF-A uses age/sex-normed tables
const T_SCORE_NORMS = {
  INH: { mean: 14.5, sd: 7.2 },
  SFT: { mean: 13.8, sd: 6.8 },
  EMC: { mean: 12.9, sd: 7.5 },
  SMO: { mean: 11.2, sd: 5.9 },
  POG: { mean: 15.1, sd: 7.4 },
  TSK: { mean: 10.8, sd: 5.6 },
  OMA: { mean: 13.5, sd: 6.9 },
  WKM: { mean: 12.3, sd: 6.1 },
  INI: { mean: 14.0, sd: 7.0 },
  // Composite indices use different norms
  BRI: { mean: 52.0, sd: 11.5 },
  MI: { mean: 54.0, sd: 12.0 },
  GEC: { mean: 53.0, sd: 11.0 },
};

/**
 * Validate a single item response value
 * @param {*} value
 * @returns {boolean}
 */
export function isValidBriefAItem(value) {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 3;
}

/**
 * Calculate raw scale score for a given scale from responses object
 * @param {Object} responses - { inh_q1: 0-3, inh_q2: 0-3, ... }
 * @param {string} scaleAbbr - Scale abbreviation (INH, SFT, EMC, SMO, POG, TSK, OMA, WKM, INI)
 * @returns {{ raw: number, count: number, max: number }}
 */
export function calculateScaleScore(responses, scaleAbbr) {
  const scale = SCALES[scaleAbbr];
  if (!scale) return { raw: 0, count: 0, max: 0, error: `Unknown scale: ${scaleAbbr}` };

  let total = 0;
  let count = 0;
  const prefix = scaleAbbr.toLowerCase();

  for (let i = 1; i <= scale.items; i++) {
    const key = `${prefix}_q${i}`;
    const val = responses[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 3) {
        total += num;
        count++;
      }
    }
  }
  return { raw: total, count, max: scale.max };
}

/**
 * Convert a raw score to a T-score
 * @param {number} raw - Raw score
 * @param {string} scaleAbbr - Scale or index abbreviation
 * @returns {number} T-score
 */
export function rawToT(raw, scaleAbbr) {
  const norm = T_SCORE_NORMS[scaleAbbr];
  if (!norm) return 50;
  // T = 50 + 10 * ((raw - mean) / sd)
  return Math.round(50 + 10 * ((raw - norm.mean) / norm.sd));
}

/**
 * Interpret a T-score into clinical category per BRIEF-A spec
 * T >= 65 = Elevated (clinically significant)
 * T 60-64 = Borderline
 * T < 60 = WNL (Within Normal Limits)
 * @param {number} t - T-score
 * @returns {string} Interpretation label
 */
export function interpretScore(t) {
  const score = parseFloat(t);
  if (isNaN(score)) return 'WNL';
  if (score >= 65) return 'Elevated';
  if (score >= 60) return 'Borderline';
  return 'WNL';
}

/**
 * Calculate BRI (Behavioral Regulation Index) from scale T-scores
 * BRI = sum of T-scores for INH, SFT, EMC, SMO → converted to T-score
 * @param {Object} scaleTScores - { INH: t, SFT: t, EMC: t, SMO: t }
 * @returns {{ rawSum: number, t: number, interpretation: string }}
 */
export function calculateBRI(scaleTScores) {
  const tScores = INDEX_COMPOSITION.BRI.map(s => scaleTScores[s] || 50);
  const rawSum = tScores.reduce((a, b) => a + b, 0);
  const t = rawToT(rawSum, 'BRI');
  return {
    rawSum,
    t,
    interpretation: interpretScore(t),
  };
}

/**
 * Calculate MI (Metacognition Index) from scale T-scores
 * MI = sum of T-scores for POG, TSK, OMA, WKM, INI → converted to T-score
 * @param {Object} scaleTScores - { POG: t, TSK: t, OMA: t, WKM: t, INI: t }
 * @returns {{ rawSum: number, t: number, interpretation: string }}
 */
export function calculateMI(scaleTScores) {
  const tScores = INDEX_COMPOSITION.MI.map(s => scaleTScores[s] || 50);
  const rawSum = tScores.reduce((a, b) => a + b, 0);
  const t = rawToT(rawSum, 'MI');
  return {
    rawSum,
    t,
    interpretation: interpretScore(t),
  };
}

/**
 * Calculate GEC (Global Executive Composite)
 * GEC = BRI.rawSum + MI.rawSum → converted to T-score
 * @param {{ rawSum: number }} bri - BRI result
 * @param {{ rawSum: number }} mi - MI result
 * @returns {{ rawSum: number, t: number, interpretation: string }}
 */
export function calculateGEC(bri, mi) {
  const rawSum = bri.rawSum + mi.rawSum;
  const t = rawToT(rawSum, 'GEC');
  return {
    rawSum,
    t,
    interpretation: interpretScore(t),
  };
}

/**
 * Calculate all 9 scale scores, indices, and aggregate results
 * @param {Object} responses - { inh_q1: 0-3, ... } all 87 item responses
 * @returns {Object} Full BRIEF-A results object matching SPEC data model
 */
export function aggregateBriefAResults(responses) {
  const scaleResults = {};
  const scaleTScores = {};

  // Calculate each scale's raw score and T-score
  for (const scaleAbbr of Object.keys(SCALES)) {
    const { raw, count, max } = calculateScaleScore(responses, scaleAbbr);
    const t = rawToT(raw, scaleAbbr);
    scaleResults[scaleAbbr] = {
      raw,
      t,
      count,
      max,
      interpretation: interpretScore(t),
    };
    scaleTScores[scaleAbbr] = t;
  }

  // Calculate indices
  const bri = calculateBRI(scaleTScores);
  const mi = calculateMI(scaleTScores);
  const gec = calculateGEC(bri, mi);

  return {
    scales: scaleResults,
    indices: {
      BRI: bri,
      MI: mi,
      GEC: gec,
    },
    metadata: {
      item_count: 87,
      completed_at: new Date().toISOString(),
    },
  };
}

/**
 * Validate entire response set for completeness and valid values
 * @param {Object} responses
 * @returns {{ valid: boolean, errors: string[], missing: string[] }}
 */
export function validateResponses(responses) {
  const errors = [];
  const missing = [];

  for (const [scaleAbbr, scale] of Object.entries(SCALES)) {
    const prefix = scaleAbbr.toLowerCase();
    for (let i = 1; i <= scale.items; i++) {
      const key = `${prefix}_q${i}`;
      const val = responses[key];
      if (val === undefined || val === null || val === '') {
        missing.push(key);
      } else if (!isValidBriefAItem(val)) {
        errors.push(`${key}=${val} is invalid`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missing,
  };
}
