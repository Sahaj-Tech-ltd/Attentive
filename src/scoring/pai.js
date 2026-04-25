/**
 * PAI (Personality Assessment Inventory — Short Form) Scoring
 *
 * 66 items across 11 scales, each rated 0-3:
 * 0 = False, 1 = Somewhat true, 2 = Mostly true, 3 = Very true
 *
 * 11 scales × 6 items each = 66 items, max raw per scale = 18
 * T-score approximation: T ≈ (raw × 5.5) + 30
 * Validity flags: INF > 7, PIM > 7, NIM > 5
 * Elevated: T >= 70, Markedly elevated: T >= 80
 */

export const SCALES = {
  INF: { name: 'Infrequency', items: 6, max: 18, type: 'validity' },
  NIM: { name: 'Negative Impression', items: 3, max: 9, type: 'validity' },
  PIM: { name: 'Positive Impression', items: 3, max: 9, type: 'validity' },
  SOM: { name: 'Somatic Complaints', items: 6, max: 18, type: 'clinical' },
  ANX: { name: 'Anxiety', items: 6, max: 18, type: 'clinical' },
  DEP: { name: 'Depression', items: 6, max: 18, type: 'clinical' },
  MAN: { name: 'Mania', items: 6, max: 18, type: 'clinical' },
  PAR: { name: 'Paranoia', items: 6, max: 18, type: 'clinical' },
  ALC: { name: 'Alcohol Problems', items: 6, max: 18, type: 'clinical' },
  DRG: { name: 'Drug Problems', items: 6, max: 18, type: 'clinical' },
};

const VALIDITY_THRESHOLDS = {
  INF: 7,
  PIM: 7,
  NIM: 5,
};

const T_SCORE_SLOPE = 5.5;
const T_SCORE_INTERCEPT = 30;

export function rawToT(raw) {
  return Math.round(raw * T_SCORE_SLOPE + T_SCORE_INTERCEPT);
}

export function calculateScaleScore(responses, scaleAbbr) {
  const scale = SCALES[scaleAbbr];
  if (!scale) return { raw: 0, count: 0, max: 0 };

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

export function checkValidity(rawScores) {
  const flags = {};
  for (const [scale, threshold] of Object.entries(VALIDITY_THRESHOLDS)) {
    flags[scale.toLowerCase()] = rawScores[scale.toLowerCase()] > threshold;
  }
  return flags;
}

export function getElevatedScales(tScores) {
  const elevated = [];
  const markedly = [];
  for (const [scale, t] of Object.entries(tScores)) {
    if (t >= 80) markedly.push(scale);
    else if (t >= 70) elevated.push(scale);
  }
  return { elevated, markedlyElevated: markedly };
}

export function interpretT(t) {
  if (t >= 80) return 'Markedly elevated';
  if (t >= 70) return 'Elevated';
  if (t >= 60) return 'Borderline';
  return 'Within normal limits';
}

export function isValidPAIItem(value) {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 3;
}

export function scorePAI(rawData) {
  const rawScores = {};
  const tScores = {};

  for (const scaleAbbr of Object.keys(SCALES)) {
    const key = scaleAbbr.toLowerCase();
    const { raw, count, max } = calculateScaleScore(rawData, scaleAbbr);
    rawScores[key] = raw;
    tScores[key] = rawToT(raw);
  }

  const validityFlags = checkValidity(rawScores);
  const { elevated, markedlyElevated } = getElevatedScales(tScores);

  const hasValidityConcern = Object.values(validityFlags).some(Boolean);

  const interpretation = {};
  for (const [scale, t] of Object.entries(tScores)) {
    interpretation[scale] = interpretT(t);
  }

  return {
    rawScores,
    tScores,
    validityFlags,
    elevatedScales: [...elevated, ...markedlyElevated],
    markedlyElevatedScales: markedlyElevated,
    hasValidityConcern,
    interpretation,
    metadata: {
      module_type: 'pai',
      item_count: 66,
      scale_count: 11,
    },
  };
}

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
      } else if (!isValidPAIItem(val)) {
        errors.push(`${key}=${val} is invalid`);
      }
    }
  }

  return {
    valid: errors.length === 0 && missing.length === 0,
    errors,
    missing,
  };
}
