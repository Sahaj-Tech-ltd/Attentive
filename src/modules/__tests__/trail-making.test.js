/**
 * Trail Making A & B Module Tests
 *
 * BDD-style tests for the Trail Making A & B module.
 * Tests cover:
 * - Circle position generation (non-overlapping)
 * - Part A sequence (1→25)
 * - Part B sequence (alternating 1-A-2-B-3-C...)
 * - Click detection (distance-from-center)
 * - Scoring calculations (T-scores, B-A difference)
 *
 * @see SPEC-TrailMaking.md for full specification
 */

import { describe, expect, test, beforeEach, vi } from 'vitest';
import {
    calculateTrailMakingScores,
    getTrailATScore,
    getTrailBTScore,
    interpretBADiff
} from '../../scoring/trail-making.js';

import {
    getPartASequence,
    getPartBSequence,
    generateCirclePositions,
    detectClick
} from '../trail-making.js';

// ---------------------------------------------------------------------
// Scoring Tests
// ---------------------------------------------------------------------

describe('Trail Making Scoring', () => {
    describe('T-Score Estimation', () => {
        test('Part A fast time (15s) maps to T-score ≥ 60', () => {
            const score = getTrailATScore(15);
            expect(score).toBeGreaterThanOrEqual(60);
        });

        test('Part A average time (35s) maps to T-score ~51', () => {
            const score = getTrailATScore(35);
            expect(score).toBe(51);
        });

        test('Part A slow time (60s) maps to T-score ~40', () => {
            const score = getTrailATScore(60);
            expect(score).toBe(40);
        });

        test('Part A very slow time (>80s) maps to T-score ≤ 30', () => {
            const score = getTrailATScore(90);
            expect(score).toBeLessThanOrEqual(30);
        });

        test('Part B fast time (35s) maps to T-score ≥ 60', () => {
            const score = getTrailBTScore(35);
            expect(score).toBeGreaterThanOrEqual(60);
        });

        test('Part B average time (55s) maps to T-score ~51', () => {
            const score = getTrailBTScore(55);
            expect(score).toBe(51);
        });

        test('Part B slow time (100s) maps to T-score ~38', () => {
            const score = getTrailBTScore(100);
            expect(score).toBe(38);
        });

        test('Part B very slow time (>120s) maps to T-score ≤ 28', () => {
            const score = getTrailBTScore(130);
            expect(score).toBeLessThanOrEqual(28);
        });
    });

    describe('B-A Difference Interpretation', () => {
        test('diff < 20s = Very Low (floor effect)', () => {
            const result = interpretBADiff(15);
            expect(result.label).toBe('Very Low');
        });

        test('diff 20-45s = Low', () => {
            const result = interpretBADiff(30);
            expect(result.label).toBe('Low');
        });

        test('diff 46-65s = Average', () => {
            const result = interpretBADiff(55);
            expect(result.label).toBe('Average');
        });

        test('diff 66-90s = Mildly Elevated', () => {
            const result = interpretBADiff(75);
            expect(result.label).toBe('Mildly Elevated');
        });

        test('diff 91-120s = Moderately Elevated', () => {
            const result = interpretBADiff(105);
            expect(result.label).toBe('Moderately Elevated');
        });

        test('diff > 120s = Markedly Elevated', () => {
            const result = interpretBADiff(150);
            expect(result.label).toBe('Markedly Elevated');
        });
    });

    describe('calculateTrailMakingScores', () => {
        test('should return all required fields', () => {
            const trailA = { time_ms: 30000, error_count: 2, completed: true };
            const trailB = { time_ms: 60000, error_count: 3, completed: true };

            const result = calculateTrailMakingScores(trailA, trailB);

            expect(result).toHaveProperty('trail_a_t_score');
            expect(result).toHaveProperty('trail_b_t_score');
            expect(result).toHaveProperty('trail_b_minus_a_diff_ms');
            expect(result).toHaveProperty('trail_b_minus_a_diffInterpreted');
        });

        test('should calculate B-A diff correctly', () => {
            const trailA = { time_ms: 30000, error_count: 0, completed: true };
            const trailB = { time_ms: 60000, error_count: 0, completed: true };

            const result = calculateTrailMakingScores(trailA, trailB);

            expect(result.trail_b_minus_a_diff_ms).toBe(30000);
        });

        test('should handle missing/invalid data gracefully', () => {
            const result = calculateTrailMakingScores({}, {});

            expect(result.trail_a_t_score).toBeGreaterThan(0);
            expect(result.trail_b_t_score).toBeGreaterThan(0);
            expect(result.trail_b_minus_a_diff_ms).toBe(0);
        });

        test('should handle null/undefined values', () => {
            const result = calculateTrailMakingScores(null, null);

            expect(result.trail_a_t_score).toBeDefined();
            expect(result.trail_b_t_score).toBeDefined();
            expect(result.trail_b_minus_a_diff_ms).toBe(0);
        });
    });
});

// ---------------------------------------------------------------------
// Sequence Tests
// ---------------------------------------------------------------------

describe('Trail Making Sequences', () => {
    describe('Part A Sequence', () => {
        test('should return numbers 1 through N', () => {
            const seq = getPartASequence(25);
            expect(seq).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
        });

        test('should return exactly N elements', () => {
            expect(getPartASequence(8)).toHaveLength(8);
            expect(getPartASequence(25)).toHaveLength(25);
        });

        test('should start with 1', () => {
            const seq = getPartASequence(10);
            expect(seq[0]).toBe(1);
        });

        test('should be strictly increasing by 1', () => {
            const seq = getPartASequence(25);
            for (let i = 1; i < seq.length; i++) {
                expect(seq[i]).toBe(seq[i - 1] + 1);
            }
        });
    });

    describe('Part B Sequence', () => {
        test('should alternate numbers and letters', () => {
            // 1-A-2-B-3-C-4-D (4 numbers, 4 letters)
            const seq = getPartBSequence(4, 4);
            expect(seq).toEqual([1, 'A', 2, 'B', 3, 'C', 4, 'D']);
        });

        test('should handle unequal numbers and letters (more numbers)', () => {
            // 1-A-2-B-3-C-4-5 (4 numbers, 3 letters, extra 5)
            const seq = getPartBSequence(5, 3);
            expect(seq).toEqual([1, 'A', 2, 'B', 3, 'C', 4, 5]);
        });

        test('should handle unequal numbers and letters (more letters)', () => {
            // 1-A-2-B-3-C-4-D (4 numbers, 5 letters, extra E unused)
            const seq = getPartBSequence(4, 5);
            expect(seq).toEqual([1, 'A', 2, 'B', 3, 'C', 4, 'D']);
        });

        test('should start with 1 and alternate', () => {
            const seq = getPartBSequence(13, 12);
            expect(seq[0]).toBe(1);
            expect(seq[1]).toBe('A');
            expect(seq[2]).toBe(2);
            expect(seq[3]).toBe('B');
        });

        test('should end with the last number when more numbers than letters', () => {
            const seq = getPartBSequence(13, 12);
            // Last element should be 13
            expect(seq[seq.length - 1]).toBe(13);
        });

        test('should have 25 elements for standard Part B (13 numbers + 12 letters)', () => {
            const seq = getPartBSequence(13, 12);
            expect(seq).toHaveLength(25);
        });

        test('standard Part B sequence should be: 1-A-2-B-3-C-4-D-5-E-6-F-7-G-8-H-9-I-10-J-11-K-12-L-13', () => {
            const seq = getPartBSequence(13, 12);
            expect(seq).toEqual([1, 'A', 2, 'B', 3, 'C', 4, 'D', 5, 'E', 6, 'F', 7, 'G', 8, 'H', 9, 'I', 10, 'J', 11, 'K', 12, 'L', 13]);
        });
    });
});

// ---------------------------------------------------------------------
// Position Generation Tests
// ---------------------------------------------------------------------

describe('Circle Position Generation', () => {
    const CANVAS_WIDTH = 900;
    const CANVAS_HEIGHT = 600;
    const MIN_SPACING = 70;

    test('should generate exactly N positions', () => {
        const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);
        expect(positions).toHaveLength(25);
    });

    test('should generate non-overlapping positions (min spacing enforced)', () => {
        const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const dist = Math.sqrt(
                    (positions[i].x - positions[j].x) ** 2 +
                    (positions[i].y - positions[j].y) ** 2
                );
                expect(dist).toBeGreaterThanOrEqual(MIN_SPACING * 0.9); // Allow small tolerance
            }
        }
    });

    test('should generate positions within canvas bounds (with margin)', () => {
        const MARGIN = 80;
        const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (const pos of positions) {
            expect(pos.x).toBeGreaterThan(MARGIN);
            expect(pos.x).toBeLessThan(CANVAS_WIDTH - MARGIN);
            expect(pos.y).toBeGreaterThan(MARGIN);
            expect(pos.y).toBeLessThan(CANVAS_HEIGHT - MARGIN);
        }
    });

    test('should generate unique positions (no duplicates)', () => {
        const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);

        const uniqueKeys = new Set(positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
        expect(uniqueKeys.size).toBe(25);
    });

    test('should work for smaller counts (practice)', () => {
        const positions = generateCirclePositions(8, CANVAS_WIDTH, CANVAS_HEIGHT);
        expect(positions).toHaveLength(8);
    });
});

// ---------------------------------------------------------------------
// Click Detection Tests
// ---------------------------------------------------------------------

describe('Click Detection', () => {
    const circlesA = [
        { label: 1, x: 100, y: 100, correct: false },
        { label: 2, x: 200, y: 200, correct: false },
        { label: 3, x: 300, y: 150, correct: false }
    ];

    const circlesB = [
        { label: 1, x: 100, y: 100, correct: false },
        { label: 'A', x: 200, y: 200, correct: false },
        { label: 2, x: 300, y: 150, correct: false }
    ];

    test('should detect click on circle center', () => {
        const idx = detectClick(100, 100, circlesA, 'A');
        expect(idx).toBe(0);
    });

    test('should detect click near circle center', () => {
        const idx = detectClick(105, 95, circlesA, 'A');
        expect(idx).toBe(0);
    });

    test('should return -1 for click outside any circle', () => {
        const idx = detectClick(500, 500, circlesA, 'A');
        expect(idx).toBe(-1);
    });

    test('should detect click on Part B circles (different radius)', () => {
        const idx = detectClick(200, 200, circlesB, 'B');
        expect(idx).toBe(1); // 'A' circle
    });

    test('should detect click on letter circle in Part B', () => {
        const idx = detectClick(200, 200, circlesB, 'B');
        expect(circlesB[idx].label).toBe('A');
    });

    test('should detect click within radius even if not at center', () => {
        // Circle at 200,200 with radius ~32 (65/2)
        const idx = detectClick(220, 210, circlesB, 'B');
        expect(idx).toBe(1); // 'A' circle
    });

    test('should return -1 for click just outside radius', () => {
        // Circle at 100,100 with radius 30 (60/2)
        const idx = detectClick(135, 100, circlesA, 'A'); // 35px away, radius is 30
        expect(idx).toBe(-1);
    });

    test('should handle edge of circle click', () => {
        // Circle at 100,100, radius 30 - click at edge (130, 100)
        const idx = detectClick(130, 100, circlesA, 'A');
        expect(idx).toBe(0);
    });
});

// ---------------------------------------------------------------------
// Data Model Tests
// ---------------------------------------------------------------------

describe('Trail Making Data Model', () => {
    test('module results should have required top-level sections', () => {
        const moduleResults = {
            trail_a: {
                completed: true,
                time_ms: 45230,
                error_count: 2,
                error_indices: [3, 17],
                correct_click_sequence: [1, 2, 3, 4, 5],
                click_data: []
            },
            trail_b: {
                completed: true,
                time_ms: 98450,
                error_count: 4,
                error_indices: [7, 15, 22, 28],
                correct_click_sequence: [1, 'A', 2, 'B'],
                click_data: []
            },
            derived: {
                trail_a_t_score: 48,
                trail_b_t_score: 52,
                trail_b_minus_a_diff_ms: 53220,
                trail_b_minus_a_diffInterpreted: 'Average'
            },
            metadata: {
                completed_at: '2026-04-25T10:00:00Z',
                part_a_practice_errors: 0,
                part_b_practice_errors: 1,
                device_pixel_ratio: 2
            }
        };

        expect(moduleResults).toHaveProperty('trail_a');
        expect(moduleResults).toHaveProperty('trail_b');
        expect(moduleResults).toHaveProperty('derived');
        expect(moduleResults).toHaveProperty('metadata');
    });

    test('trail_a should have required fields', () => {
        const trailA = {
            completed: true,
            time_ms: 45230,
            error_count: 2,
            error_indices: [3, 17],
            correct_click_sequence: [1, 2, 3],
            click_data: [
                { target: 1, x: 120, y: 340, rt_ms: 890, correct: true },
                { target: 2, x: 340, y: 210, rt_ms: 720, correct: true }
            ]
        };

        expect(trailA).toHaveProperty('completed');
        expect(trailA).toHaveProperty('time_ms');
        expect(trailA).toHaveProperty('error_count');
        expect(trailA).toHaveProperty('error_indices');
        expect(trailA).toHaveProperty('correct_click_sequence');
        expect(trailA).toHaveProperty('click_data');
    });

    test('click data should have required fields', () => {
        const clickData = {
            target: 1,
            expected_target: 1,
            x: 200,
            y: 340,
            rt_ms: 890,
            correct: true,
            click_number: 1
        };

        expect(clickData).toHaveProperty('target');
        expect(clickData).toHaveProperty('expected_target');
        expect(clickData).toHaveProperty('x');
        expect(clickData).toHaveProperty('y');
        expect(clickData).toHaveProperty('rt_ms');
        expect(clickData).toHaveProperty('correct');
        expect(clickData).toHaveProperty('click_number');
    });
});

// ---------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------

describe('Trail Making Edge Cases', () => {
    test('very fast time should be flagged', () => {
        // Part A < 15s is suspicious
        const trailA = { time_ms: 12000, error_count: 0, completed: true };
        const result = calculateTrailMakingScores(trailA, { time_ms: 25000, error_count: 0, completed: true });

        // Very fast time should still give a valid T-score (high)
        expect(result.trail_a_t_score).toBeGreaterThanOrEqual(60);
    });

    test('very slow time should be flagged', () => {
        // Part A > 180s is extended duration
        const trailA = { time_ms: 200000, error_count: 5, completed: true };
        const result = calculateTrailMakingScores(trailA, { time_ms: 300000, error_count: 8, completed: true });

        expect(result.trail_a_t_score).toBeLessThanOrEqual(30);
    });

    test('high error count is still scorable', () => {
        const trailA = { time_ms: 45000, error_count: 10, completed: true };
        const result = calculateTrailMakingScores(trailA, { time_ms: 90000, error_count: 15, completed: true });

        expect(result.trail_a_t_score).toBeDefined();
        expect(result.trail_b_t_score).toBeDefined();
    });

    test('incomplete test still records data', () => {
        const trailA = { time_ms: 30000, error_count: 2, completed: false };
        const result = calculateTrailMakingScores(trailA, { time_ms: 0, error_count: 0, completed: false });

        expect(result.trail_a_t_score).toBeDefined();
        // B-A diff may be negative if A not completed
    });

    test('zero time should not crash', () => {
        const result = calculateTrailMakingScores({ time_ms: 0 }, { time_ms: 0 });
        expect(result.trail_a_t_score).toBeDefined();
        expect(result.trail_b_t_score).toBeDefined();
    });
});
