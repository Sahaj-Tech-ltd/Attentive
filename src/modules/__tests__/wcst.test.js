/**
 * WCST Module Tests
 * Scoring functions and error classification tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWCSTScores,
  aggregateWCSTResults,
  getAgeGroup,
  getEducationLevel,
  getWCSTTscore,
  interpretWCSTScore,
  classifyError,
} from '../../scoring/wcst.js';

describe('WCST — scoring utilities', () => {
  describe('getAgeGroup', () => {
    it('returns correct age group', () => {
      expect(getAgeGroup(25)).toBe('18-29');
      expect(getAgeGroup(35)).toBe('30-44');
      expect(getAgeGroup(50)).toBe('45-59');
      expect(getAgeGroup(65)).toBe('60-69');
      expect(getAgeGroup(75)).toBe('70+');
    });
  });

  describe('getEducationLevel', () => {
    it('returns low for ≤12 years', () => {
      expect(getEducationLevel(8)).toBe('low');
      expect(getEducationLevel(12)).toBe('low');
    });
    it('returns high for >12 years', () => {
      expect(getEducationLevel(13)).toBe('high');
      expect(getEducationLevel(20)).toBe('high');
    });
  });

  describe('getWCSTTscore', () => {
    it('returns 50 at mean for total_errors', () => {
      // Mean for 30-44, low education is 22.3
      const t = getWCSTTscore('total_errors', 22, '30-44', 'low');
      expect(t).toBeCloseTo(50, 0);
    });

    it('returns higher T-score for fewer errors (inverse relationship)', () => {
      const fewer = getWCSTTscore('total_errors', 10, '30-44', 'low');
      const more = getWCSTTscore('total_errors', 35, '30-44', 'low');
      expect(fewer).toBeGreaterThan(more);
    });

    it('returns 50 for unknown metric', () => {
      expect(getWCSTTscore('unknown_metric', 10, '30-44', 'low')).toBe(50);
    });

    it('falls back to 30-44 for unknown age group', () => {
      // 'unknown' isn't a valid group, falls back to '30-44' then 'low' education
      const t = getWCSTTscore('total_errors', 20, 'unknown', 'low');
      // Should produce a real T-score via fallback, not 50
      expect(t).not.toBeNaN();
      expect(t).toBeGreaterThan(40);
    });

    it('gives higher T-score for more categories completed', () => {
      // 5 categories is above mean for high education 30-44 (mean=5.1)
      // 1 category is well below mean
      const high = getWCSTTscore('categories_completed', 5, '30-44', 'high');
      const low = getWCSTTscore('categories_completed', 1, '30-44', 'high');
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('interpretWCSTScore', () => {
    it('returns Very Low for t < 40', () => {
      expect(interpretWCSTScore(35)).toBe('Very Low — significantly below typical');
    });
    it('returns Low Average for t between 40-44', () => {
      expect(interpretWCSTScore(42)).toBe('Low Average — below typical');
    });
    it('returns Average for t between 45-54', () => {
      expect(interpretWCSTScore(50)).toBe('Average — typical range');
    });
    it('returns Mildly Elevated for t between 55-59', () => {
      expect(interpretWCSTScore(57)).toBe('Mildly Elevated — mild difficulty');
    });
    it('returns Moderately Elevated for t between 60-64', () => {
      expect(interpretWCSTScore(62)).toBe('Moderately Elevated — notable difficulty');
    });
    it('returns Markedly Atypical for t ≥ 65', () => {
      expect(interpretWCSTScore(70)).toBe('Markedly Atypical — significant impairment');
    });
  });

  describe('classifyError', () => {
    it('returns no error flags for correct trials', () => {
      const result = classifyError({ correct: true, current_category: 'color', timed_out: false }, 'shape');
      expect(result.is_perseverative_error).toBe(false);
      expect(result.is_non_perseverative_error).toBe(false);
    });

    it('marks timeout as non-perseverative error', () => {
      const result = classifyError(
        { correct: false, current_category: 'color', timed_out: true },
        null
      );
      expect(result.is_perseverative_error).toBe(false);
      expect(result.is_non_perseverative_error).toBe(true);
    });

    it('marks error as perseverative when same dimension as previous error', () => {
      const result = classifyError(
        { correct: false, current_category: 'shape', timed_out: false },
        'shape' // previous error was also on shape dimension
      );
      expect(result.is_perseverative_error).toBe(true);
      expect(result.is_non_perseverative_error).toBe(false);
    });

    it('marks error as non-perseverative when different dimension from previous error', () => {
      const result = classifyError(
        { correct: false, current_category: 'color', timed_out: false },
        'shape' // previous error was on shape, this one is color
      );
      expect(result.is_perseverative_error).toBe(false);
      expect(result.is_non_perseverative_error).toBe(true);
    });

    it('marks first error as non-perseverative (no previous error category)', () => {
      const result = classifyError(
        { correct: false, current_category: 'color', timed_out: false },
        null
      );
      expect(result.is_perseverative_error).toBe(false);
      expect(result.is_non_perseverative_error).toBe(true);
    });
  });
});

describe('WCST — calculateWCSTScores', () => {
  const makeTrial = (overrides = {}) => ({
    module: 'wcst',
    trial_type: 'wcst',
    correct: true,
    current_category: 'color',
    categories_completed: 0,
    rt_ms: 800,
    timed_out: false,
    is_perseverative_error: false,
    is_non_perseverative_error: false,
    ...overrides,
  });

  it('returns zero errors for all-correct trials', () => {
    const trials = [
      makeTrial({ correct: true }),
      makeTrial({ correct: true }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.total_errors).toBe(0);
    expect(scores.perseverative_errors).toBe(0);
    expect(scores.non_perseverative_errors).toBe(0);
    expect(scores.percent_correct).toBe(100);
  });

  it('counts errors correctly', () => {
    const trials = [
      makeTrial({ correct: true }),
      makeTrial({ correct: false, is_perseverative_error: false, is_non_perseverative_error: true }),
      makeTrial({ correct: false, is_perseverative_error: true, is_non_perseverative_error: false }),
      makeTrial({ correct: true }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.total_errors).toBe(2);
    expect(scores.perseverative_errors).toBe(1);
    expect(scores.non_perseverative_errors).toBe(1);
  });

  it('calculates mean_rt_ms from valid trials only', () => {
    const trials = [
      makeTrial({ rt_ms: 500 }),
      makeTrial({ rt_ms: 900 }),
      makeTrial({ rt_ms: 50 }),   // too fast → excluded
      makeTrial({ rt_ms: 6000 }), // too slow → excluded
      makeTrial({ rt_ms: 700 }),
    ];
    const scores = calculateWCSTScores(trials);
    // mean of 500 + 900 + 700 = 2100 / 3 = 700
    expect(scores.mean_rt_ms).toBe(700);
  });

  it('returns mean_rt_ms=0 when no valid RT trials', () => {
    const trials = [
      makeTrial({ rt_ms: 50 }),
      makeTrial({ rt_ms: 6000 }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.mean_rt_ms).toBe(0);
  });

  it('calculates categories_completed as max from trials', () => {
    const trials = [
      makeTrial({ categories_completed: 0 }),
      makeTrial({ categories_completed: 1 }),
      makeTrial({ categories_completed: 2 }),
      makeTrial({ categories_completed: 3 }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.categories_completed).toBe(3);
  });

  it('filters to trial_type=wcst trials only', () => {
    const trials = [
      makeTrial({ trial_type: 'wcst' }),
      makeTrial({ trial_type: 'wcst' }),
      { module: 'wcst', trial_type: 'wcst_intro' }, // should be filtered
      { module: 'wcst', trial_type: 'wcst_intro' }, // should be filtered
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.total_trials).toBe(2);
  });

  it('calculates percent_correct correctly', () => {
    const trials = [
      makeTrial({ correct: true }),
      makeTrial({ correct: true }),
      makeTrial({ correct: false, is_perseverative_error: false, is_non_perseverative_error: true }),
      makeTrial({ correct: true }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.percent_correct).toBe(75);
  });

  it('includes t_score and interpretation in output', () => {
    const trials = [makeTrial({ correct: true })];
    const scores = calculateWCSTScores(trials, { ageGroup: '30-44', educationLevel: 'low' });
    expect(typeof scores.t_score).toBe('number');
    expect(typeof scores.interpretation).toBe('string');
    // Zero errors → T-score should be very high (above average)
    expect(scores.t_score).toBeGreaterThan(60);
  });

  it('returns correct age_group and education_level in output', () => {
    const trials = [makeTrial()];
    const scores = calculateWCSTScores(trials, { ageGroup: '60-69', educationLevel: 'high' });
    expect(scores.age_group).toBe('60-69');
    expect(scores.education_level).toBe('high');
  });

  it('counts timeout as non-perseverative error', () => {
    const trials = [
      makeTrial({ correct: false, timed_out: true, is_perseverative_error: false, is_non_perseverative_error: true }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.total_errors).toBe(1);
    expect(scores.non_perseverative_errors).toBe(1);
    expect(scores.perseverative_errors).toBe(0);
  });

  it('treats missing is_perseverative_error field as non-perseverative', () => {
    const trials = [
      makeTrial({ correct: false, timed_out: false }),
    ];
    const scores = calculateWCSTScores(trials);
    expect(scores.total_errors).toBe(1);
    expect(scores.non_perseverative_errors).toBe(1);
  });
});

describe('WCST — aggregateWCSTResults', () => {
  it('filters to wcst module trials', () => {
    const data = [
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'color', rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: false, timed_out: false, is_perseverative_error: true, current_category: 'color', rt_ms: 900 },
      { module: 'other', trial_type: 'foo', correct: true },
    ];
    const result = aggregateWCSTResults(data, '30-44', 'low');
    expect(result.total_trials).toBe(2);
    expect(result.total_errors).toBe(1);
  });

  it('includes metadata with completed_at, age_group, education_level', () => {
    const data = [
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'color', rt_ms: 800 },
    ];
    const result = aggregateWCSTResults(data, '45-59', 'high');
    expect(result.metadata.age_group).toBe('45-59');
    expect(result.metadata.education_level).toBe('high');
    expect(result.metadata.completed_at).toBeTruthy();
  });

  it('returns same core fields as calculateWCSTScores', () => {
    const data = [
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'color', categories_completed: 1, rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: false, current_category: 'color', timed_out: false, is_perseverative_error: false, is_non_perseverative_error: true, rt_ms: 900 },
    ];
    const result = aggregateWCSTResults(data, '30-44', 'low');
    expect(result.categories_completed).toBe(1);
    expect(result.total_trials).toBe(2);
    expect(result.total_errors).toBe(1);
    expect(typeof result.t_score).toBe('number');
    expect(typeof result.interpretation).toBe('string');
  });

  it('handles empty data gracefully', () => {
    const result = aggregateWCSTResults([], '30-44', 'low');
    expect(result.total_trials).toBe(0);
    expect(result.total_errors).toBe(0);
    // Zero errors with default norms: T = 50 + 10 * ((mean - 0) / sd)
    // For 30-44, low: mean=22.3, sd=9.4 → T ≈ 74
    expect(result.t_score).toBeGreaterThan(60);
    expect(typeof result.interpretation).toBe('string');
  });

  it('builds completed_categories list', () => {
    const data = [
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'color', categories_completed: 1, rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'color', categories_completed: 1, rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'shape', categories_completed: 2, rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'shape', categories_completed: 2, rt_ms: 800 },
      { module: 'wcst', trial_type: 'wcst', correct: true, current_category: 'number', categories_completed: 3, rt_ms: 800 },
    ];
    const result = aggregateWCSTResults(data, '30-44', 'low');
    expect(result.completed_categories.length).toBeGreaterThan(0);
    expect(result.completed_categories[0].dimension).toBeTruthy();
    expect(result.completed_categories[0].cards_to_complete).toBeGreaterThan(0);
  });
});

describe('WCST — normative T-score table coverage', () => {
  it('has norms for all 5 age groups on total_errors', () => {
    const norms = ['18-29', '30-44', '45-59', '60-69', '70+'];
    for (const age of norms) {
      const t = getWCSTTscore('total_errors', 20, age, 'low');
      expect(t).not.toBeNaN();
    }
  });

  it('has norms for all 5 age groups on perseverative_errors', () => {
    const norms = ['18-29', '30-44', '45-59', '60-69', '70+'];
    for (const age of norms) {
      const t = getWCSTTscore('perseverative_errors', 10, age, 'low');
      expect(t).not.toBeNaN();
    }
  });

  it('has norms for all 5 age groups on categories_completed', () => {
    const norms = ['18-29', '30-44', '45-59', '60-69', '70+'];
    for (const age of norms) {
      const t = getWCSTTscore('categories_completed', 3, age, 'low');
      expect(t).not.toBeNaN();
    }
  });

  it('has both low and high education levels for all age groups', () => {
    const ages = ['18-29', '30-44', '45-59', '60-69', '70+'];
    for (const age of ages) {
      const tLow = getWCSTTscore('total_errors', 20, age, 'low');
      const tHigh = getWCSTTscore('total_errors', 20, age, 'high');
      expect(tLow).not.toBeNaN();
      expect(tHigh).not.toBeNaN();
    }
  });
});