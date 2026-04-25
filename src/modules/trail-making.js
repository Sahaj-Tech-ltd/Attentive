/**
 * Trail Making A & B Module
 *
 * Implements Part A (simple visual scanning, 1→25) and Part B (cognitive flexibility,
 * alternating 1→A→2→B→3→C...→13→L) using a canvas-based custom click detection plugin.
 *
 * @see SPEC-TrailMaking.md for full specification
 */

import { calculateTrailMakingScores } from '../scoring/trail-making.js';

// Session storage key prefix for progress backup
const SESSION_STORAGE_KEY = 'tmt_progress_';

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const PART_A_PRACTICE_COUNT = 8;
const PART_B_PRACTICE_COUNT = 6;
const REST_DURATION_SECONDS = 30;

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const CIRCLE_DIAMETER_A = 60;
const CIRCLE_DIAMETER_B = 65;
const CIRCLE_RADIUS_A = CIRCLE_DIAMETER_A / 2;
const CIRCLE_RADIUS_B = CIRCLE_DIAMETER_B / 2;
const MIN_SPACING = 70;
const MARGIN = 80;
const JITTER = 30;
const GRID_CELL = 100;

// Colors
const CIRCLE_FILL = '#e8f4f8';
const CIRCLE_STROKE = '#2c3e50';
const CIRCLE_CORRECT = '#27ae60';
const CIRCLE_ERROR = '#e8f4f8'; // Flash back to default
const ERROR_FLASH_COLOR = '#e74c3c';
const TEXT_COLOR = '#2c3e50';
const TEXT_COLOR_ACTIVE = '#ffffff';
const ACTIVE_RING_COLOR = '#27ae60';

// ---------------------------------------------------------------------
// Session Storage Helpers
// ---------------------------------------------------------------------

/**
 * Save progress to sessionStorage for refresh resilience
 */
function saveProgress(sessionId, progressData) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    try {
        sessionStorage.setItem(key, JSON.stringify({
            ...progressData,
            timestamp: Date.now()
        }));
    } catch (e) {
        // sessionStorage not available
    }
}

/**
 * Load progress from sessionStorage
 */
function loadProgress(sessionId) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Clear progress from sessionStorage
 */
function clearProgress(sessionId) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    try {
        sessionStorage.removeItem(key);
    } catch (e) {
        // sessionStorage not available
    }
}

// ---------------------------------------------------------------------
// Position Generation
// ---------------------------------------------------------------------

/**
 * Generate non-overlapping circle positions
 * @param {number} count - Number of circles
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Array<{x: number, y: number}>}
 */
function generateCirclePositions(count, width, height) {
    const positions = [];
    const gridCols = Math.floor((width - 2 * MARGIN) / GRID_CELL);
    const gridRows = Math.floor((height - 2 * MARGIN) / GRID_CELL);

    // Generate candidate positions from grid + jitter
    const candidates = [];
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            const baseX = MARGIN + col * GRID_CELL + GRID_CELL / 2;
            const baseY = MARGIN + row * GRID_CELL + GRID_CELL / 2;
            const jitterX = (Math.random() - 0.5) * 2 * JITTER;
            const jitterY = (Math.random() - 0.5) * 2 * JITTER;
            candidates.push({ x: baseX + jitterX, y: baseY + jitterY });
        }
    }

    // Shuffle candidates
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Select positions with minimum spacing
    for (const candidate of candidates) {
        if (positions.length >= count) break;
        if (candidate.x < MARGIN || candidate.x > width - MARGIN) continue;
        if (candidate.y < MARGIN || candidate.y > height - MARGIN) continue;

        let valid = true;
        for (const existing of positions) {
            const dist = Math.sqrt((candidate.x - existing.x) ** 2 + (candidate.y - existing.y) ** 2);
            if (dist < MIN_SPACING) {
                valid = false;
                break;
            }
        }

        if (valid) {
            positions.push(candidate);
        }
    }

    // Fallback: if not enough positions, generate more with random placement
    while (positions.length < count) {
        const x = MARGIN + Math.random() * (width - 2 * MARGIN);
        const y = MARGIN + Math.random() * (height - 2 * MARGIN);

        let valid = true;
        for (const existing of positions) {
            const dist = Math.sqrt((x - existing.x) ** 2 + (y - existing.y) ** 2);
            if (dist < MIN_SPACING) {
                valid = false;
                break;
            }
        }

        if (valid) {
            positions.push({ x, y });
        }
    }

    return positions;
}

// ---------------------------------------------------------------------
// Circle Drawing
// ---------------------------------------------------------------------

/**
 * Draw a single circle on canvas
 */
function drawCircle(ctx, x, y, radius, fillColor, strokeColor, strokeWidth = 2) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

/**
 * Draw text inside a circle
 */
function drawCircleText(ctx, x, y, text, radius, fontSize, color = TEXT_COLOR) {
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

/**
 * Draw pulsing active ring animation
 */
function drawActiveRing(ctx, x, y, radius, pulsePhase) {
    const pulseScale = 1 + 0.1 * Math.sin(pulsePhase);
    const ringRadius = radius + 6 * pulseScale;

    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = ACTIVE_RING_COLOR;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(pulsePhase);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/**
 * Main canvas rendering function
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} circles - Array of {label, x, y, correct, isActive}
 * @param {number} activeTarget - Current target index
 * @param {number|null} errorFlashIndex - Index of circle to flash red
 * @param {string} part - 'A' or 'B'
 * @param {number} pulsePhase - Animation phase
 */
function drawTrailCanvas(ctx, circles, activeTarget, errorFlashIndex, part, pulsePhase) {
    const diameter = part === 'A' ? CIRCLE_DIAMETER_A : CIRCLE_DIAMETER_B;
    const radius = part === 'A' ? CIRCLE_RADIUS_A : CIRCLE_RADIUS_B;
    const fontSize = part === 'A' ? 18 : 20;

    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw all circles
    circles.forEach((circle, idx) => {
        let fillColor = CIRCLE_FILL;
        let strokeColor = CIRCLE_STROKE;
        let textColor = TEXT_COLOR;

        if (circle.correct) {
            fillColor = CIRCLE_CORRECT;
            textColor = TEXT_COLOR_ACTIVE;
        } else if (idx === errorFlashIndex) {
            fillColor = ERROR_FLASH_COLOR;
            textColor = TEXT_COLOR_ACTIVE;
        } else if (idx === activeTarget && !circle.correct) {
            // Active target - pulsing ring handled separately
        }

        drawCircle(ctx, circle.x, circle.y, radius, fillColor, strokeColor);

        // Draw label
        let displayFontSize = fontSize;
        let displayLabel = String(circle.label);
        if (part === 'B') {
            const labelStr = String(circle.label);
            if (labelStr.length > 1) {
                displayFontSize = 16;
            }
        }
        drawCircleText(ctx, circle.x, circle.y, displayLabel, radius, displayFontSize, textColor);
    });

    // Draw pulsing ring on active target
    if (activeTarget !== null && !circles[activeTarget]?.correct) {
        const active = circles[activeTarget];
        if (active) {
            drawActiveRing(ctx, active.x, active.y, radius, pulsePhase);
        }
    }
}

// ---------------------------------------------------------------------
// Click Detection
// ---------------------------------------------------------------------

/**
 * Detect which circle was clicked
 * @param {number} clickX - Click X coordinate
 * @param {number} clickY - Click Y coordinate
 * @param {Array} circles - Array of {label, x, y, correct}
 * @param {string} part - 'A' or 'B'
 * @returns {number} - Index of clicked circle, or -1 if none
 */
function detectClick(clickX, clickY, circles, part) {
    const radius = part === 'A' ? CIRCLE_RADIUS_A : CIRCLE_RADIUS_B;

    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const dist = Math.sqrt((clickX - circle.x) ** 2 + (clickY - circle.y) ** 2);
        if (dist <= radius) {
            return i;
        }
    }
    return -1;
}

// ---------------------------------------------------------------------
// Sequence Helpers
// ---------------------------------------------------------------------

/**
 * Get Part A sequence (1 through N)
 */
function getPartASequence(count) {
    return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Get Part B sequence (alternating 1-A-2-B-3-C...)
 * @param {number} numCount - Number of numeric circles (1-13)
 * @param {number} letterCount - Number of letter circles (A-L)
 * @returns {Array} - Alternating sequence
 */
function getPartBSequence(numCount, letterCount) {
    const numbers = Array.from({ length: numCount }, (_, i) => i + 1);
    const letters = 'ABCDEFGHIJKL'.slice(0, letterCount).split('');

    const result = [];
    const totalPairs = Math.min(numbers.length, letters.length);
    for (let i = 0; i < totalPairs; i++) {
        result.push(numbers[i]);
        result.push(letters[i]);
    }
    // Add remaining numbers if more numbers than letters
    for (let i = totalPairs; i < numbers.length; i++) {
        result.push(numbers[i]);
    }
    return result;
}

// ---------------------------------------------------------------------
// Canvas-based Trial Plugin (inline implementation)
// ---------------------------------------------------------------------

/**
 * Creates a canvas click response trial
 * @param {Object} options
 * @returns {Object} jsPsych trial object
 */
function createCanvasClickTrial(options) {
    const {
        targets,
        positions,
        part,
        phase,
        sessionId,
        isPractice = false,
        onComplete
    } = options;

    // Build circles data
    const circles = targets.map((label, idx) => ({
        label,
        x: positions[idx].x,
        y: positions[idx].y,
        correct: false,
        isActive: idx === 0
    }));

    return {
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        circles,
        targets,
        positions,
        part,
        phase,
        isPractice,
        data: {
            module: 'trail_making',
            subtest: `trail_${part.toLowerCase()}`,
            phase,
            expected_sequence: targets
        },
        on_start: () => {
            // Save progress for refresh resilience
            if (sessionId) {
                saveProgress(sessionId, {
                    part,
                    phase,
                    circles: circles.map(c => ({ ...c })),
                    currentTarget: 0,
                    clicks: [],
                    startTime: null
                });
            }
        },
        on_finish: (data) => {
            if (onComplete) {
                onComplete(data);
            }
            // Clear progress on successful completion
            if (sessionId && data.completed) {
                clearProgress(sessionId);
            }
        }
    };
}

// ---------------------------------------------------------------------
// Module-Level State (for communication between trials)
// ---------------------------------------------------------------------

let moduleState = {
    trailAResults: null,
    trailBResults: null,
    partAPracticeErrors: 0,
    partBPracticeErrors: 0
};

/**
 * Reset module state between runs
 */
function resetModuleState() {
    moduleState = {
        trailAResults: null,
        trailBResults: null,
        partAPracticeErrors: 0,
        partBPracticeErrors: 0
    };
}

// ---------------------------------------------------------------------
// Trial Builders
// ---------------------------------------------------------------------

/**
 * Build Part A Test trial
 */
function buildPartATestTrial(jsPsych, sessionId) {
    const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);
    const sequence = getPartASequence(25);

    return {
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        data: {
            module: 'trail_making',
            subtest: 'trail_a',
            phase: 'test',
            expected_sequence: sequence
        },
        on_start: () => {
            moduleState.trailAResults = {
                clicks: [],
                startTime: null,
                endTime: null,
                errorIndices: []
            };
            if (sessionId) {
                saveProgress(sessionId, {
                    part: 'A',
                    phase: 'test',
                    sequence,
                    currentIndex: 0,
                    completed: false
                });
            }
        }
    };
}

/**
 * Build Part B Test trial
 */
function buildPartBTestTrial(jsPsych, sessionId) {
    const positions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);
    const sequence = getPartBSequence(13, 12);

    return {
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        data: {
            module: 'trail_making',
            subtest: 'trail_b',
            phase: 'test',
            expected_sequence: sequence
        },
        on_start: () => {
            moduleState.trailBResults = {
                clicks: [],
                startTime: null,
                endTime: null,
                errorIndices: []
            };
            if (sessionId) {
                saveProgress(sessionId, {
                    part: 'B',
                    phase: 'test',
                    sequence,
                    currentIndex: 0,
                    completed: false
                });
            }
        }
    };
}

// ---------------------------------------------------------------------
// HTML Instruction Screens
// ---------------------------------------------------------------------

function buildIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Trail Making A & B</h2>
                <p class="interview-description">
                    This module measures visual scanning speed and cognitive flexibility.
                </p>
                <div class="wais-info">
                    <p><strong>2 parts</strong></p>
                    <ul style="text-align: left; display: inline-block; line-height: 2;">
                        <li>Part A — Connect circles numbered 1 to 25 in order</li>
                        <li>Part B — Alternate between numbers and letters (1→A→2→B→3→C...)</li>
                    </ul>
                </div>
                <div class="interview-instructions">
                    <p>• Click the circles as quickly as possible</p>
                    <p>• Follow the correct sequence exactly</p>
                    <p>• Errors will be recorded but won't stop the test</p>
                </div>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'trail_making', section: 'intro' },
        post_trial_gap: 500
    };
}

function buildPartAInstructionsTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Part A — Instructions</h2>
                <p>You will see circles labeled with numbers from 1 to 25.</p>
                <p>Click the circles <strong>in order</strong>, starting with 1, then 2, then 3, and so on.</p>
                <p>Work as <strong>quickly and accurately</strong> as possible.</p>
                <p style="margin-top: 1.5rem; color: #e74c3c;">
                    If you click the wrong circle, an error will be recorded.<br>
                    The test will continue — just click the correct next circle.
                </p>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start practice</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'trail_making', section: 'part_a_instructions' },
        post_trial_gap: 500
    };
}

function buildPartACompleteTrial(trailAData) {
    const timeSec = ((trailAData?.time_ms ?? 0) / 1000).toFixed(1);
    const errors = trailAData?.error_count ?? 0;

    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Part A Complete</h2>
                <div class="tmt-results">
                    <p><strong>Time:</strong> ${timeSec} seconds</p>
                    <p><strong>Errors:</strong> ${errors}</p>
                </div>
                <p style="margin-top: 2rem;">Take a short break before Part B.</p>
                <p>Press <strong>SPACE</strong> to continue</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'trail_making', section: 'part_a_complete', ...trailAData },
        post_trial_gap: 500
    };
}

function buildRestTrial() {
    return {
        type: 'canvas-countdown',
        duration: REST_DURATION_SECONDS,
        stimulus: `
            <div class="rest-screen">
                <h2>Rest Period</h2>
                <p>Take a moment to rest before Part B.</p>
                <p>Part B will begin automatically when the timer ends.</p>
            </div>
        `,
        data: { module: 'trail_making', section: 'rest' }
    };
}

function buildPartBInstructionsTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Part B — Instructions</h2>
                <p>You will see circles with numbers <strong>and</strong> letters.</p>
                <p>Click them in <strong>alternating order</strong>:</p>
                <p style="font-size: 1.3rem; margin: 1rem 0;">
                    1 → A → 2 → B → 3 → C → 4 → D ... → 13 → L
                </p>
                <p>This part is more challenging as it requires switching between numbers and letters.</p>
                <p style="margin-top: 1.5rem; color: #e74c3c;">
                    If you click the wrong circle, an error will be recorded.<br>
                    The test will continue — just click the correct next circle.
                </p>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start practice</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'trail_making', section: 'part_b_instructions' },
        post_trial_gap: 500
    };
}

function buildScoreSummaryTrial(results) {
    const trailA = results?.trail_a ?? {};
    const trailB = results?.trail_b ?? {};
    const derived = results?.derived ?? {};

    const trailATime = ((trailA.time_ms ?? 0) / 1000).toFixed(1);
    const trailBTime = ((trailB.time_ms ?? 0) / 1000).toFixed(1);
    const trailAErrors = trailA.error_count ?? 0;
    const trailBErrors = trailB.error_count ?? 0;
    const baDiff = ((derived?.trail_b_minus_a_diff_ms ?? 0) / 1000).toFixed(1);

    return {
        type: 'html-button-response',
        stimulus: `
            <div class="focus-box tmt-summary">
                <h2>Trail Making Results</h2>
                <div class="tmt-results-grid">
                    <div class="tmt-result-card">
                        <h3>Part A</h3>
                        <p><strong>Time:</strong> ${trailATime}s</p>
                        <p><strong>Errors:</strong> ${trailAErrors}</p>
                        <p><strong>T-Score:</strong> ${derived?.trail_a_t_score ?? '—'}</p>
                    </div>
                    <div class="tmt-result-card">
                        <h3>Part B</h3>
                        <p><strong>Time:</strong> ${trailBTime}s</p>
                        <p><strong>Errors:</strong> ${trailBErrors}</p>
                        <p><strong>T-Score:</strong> ${derived?.trail_b_t_score ?? '—'}</p>
                    </div>
                </div>
                <div class="tmt-diff-card">
                    <h3>B - A Difference</h3>
                    <p><strong>${baDiff}s</strong></p>
                    <p><em>${derived?.trail_b_minus_a_diffInterpreted ?? '—'}</em></p>
                    <p class="diff-note">Measures cognitive flexibility and set-switching ability</p>
                </div>
            </div>
        `,
        choices: ['Continue'],
        data: { module: 'trail_making', section: 'summary', ...results }
    };
}

// ---------------------------------------------------------------------
// Custom Plugin Registration (Canvas Click Response)
// ---------------------------------------------------------------------

/**
 * Register the canvas-click-response plugin with jsPsych
 */
function registerCanvasClickPlugin(jsPsych) {
    // Check if already registered
    if (jsPsych.plugins && jsPsych.plugins['canvas-click-response']) {
        return;
    }

    const plugin = {
        info: {
            name: 'canvas-click-response',
            parameters: {
                canvas_width: { type: jsPsych.utils.ParameterType.INT, default: 900 },
                canvas_height: { type: jsPsych.utils.ParameterType.INT, default: 600 },
                isPractice: { type: jsPsych.utils.ParameterType.BOOL, default: false }
            }
        },
        trial: async function(displayElement, trial) {
            // Merge default with trial parameters
            const params = {
                canvas_width: trial.canvas_width || 900,
                canvas_height: trial.canvas_height || 600
            };

            // Get circles and sequence from trial data
            const circles = trial.circles || [];
            const targets = trial.targets || [];
            const part = trial.part || 'A';
            const phase = trial.phase || 'test';
            const isPractice = trial.isPractice || false;
            const sessionId = trial.sessionId || null;

            // State tracking
            let currentIndex = 0;
            let clicks = [];
            let startTime = null;
            let errorIndices = [];
            let animationFrame = null;
            let pulsePhase = 0;
            let errorFlashIndex = null;
            let errorFlashTimeout = null;

            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = 'tmt-canvas';
            canvas.width = params.canvas_width;
            canvas.height = params.canvas_height;
            canvas.style.cursor = 'pointer';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';

            displayElement.innerHTML = '';
            displayElement.appendChild(canvas);

            // Draw initial state
            const ctx = canvas.getContext('2d');

            // Animation loop
            function animate() {
                pulsePhase += 0.08;
                drawTrailCanvas(ctx, circles, currentIndex, errorFlashIndex, part, pulsePhase);
                animationFrame = requestAnimationFrame(animate);
            }
            animate();

            // Click handler
            const handleClick = (event) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clickX = (event.clientX - rect.left) * scaleX;
                const clickY = (event.clientY - rect.top) * scaleY;

                const clickedIdx = detectClick(clickX, clickY, circles, part);

                if (clickedIdx === -1) {
                    // Clicked outside any circle - ignore
                    return;
                }

                const clickTime = Date.now();
                const rt = startTime ? clickTime - startTime : 0;

                // Start timer on first click
                if (startTime === null) {
                    startTime = clickTime;
                }

                const clickedCircle = circles[clickedIdx];
                const expectedTarget = targets[currentIndex];

                // Check if correct
                const isCorrect = clickedCircle.label === expectedTarget;

                clicks.push({
                    target: clickedCircle.label,
                    expectedTarget,
                    x: clickX,
                    y: clickY,
                    rt_ms: rt,
                    correct: isCorrect,
                    click_number: clicks.length + 1
                });

                if (isCorrect) {
                    // Mark as correct
                    clickedCircle.correct = true;
                    currentIndex++;

                    // Check completion
                    if (currentIndex >= targets.length) {
                        // Trial complete
                        stopTrial(true);
                    }
                } else {
                    // Error
                    errorIndices.push(clicks.length);

                    // Flash red
                    errorFlashIndex = clickedIdx;
                    if (errorFlashTimeout) clearTimeout(errorFlashTimeout);
                    errorFlashTimeout = setTimeout(() => {
                        errorFlashIndex = null;
                    }, 150);
                }

                // Save progress
                if (sessionId) {
                    saveProgress(sessionId, {
                        part,
                        phase,
                        circles: circles.map(c => ({ ...c })),
                        currentIndex,
                        clicks: [...clicks],
                        startTime,
                        errorIndices: [...errorIndices],
                        completed: false
                    });
                }
            };

            canvas.addEventListener('click', handleClick);

            // Stop trial function
            const stopTrial = (completed) => {
                // Cancel animation
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }

                // Clear error flash
                if (errorFlashTimeout) {
                    clearTimeout(errorFlashTimeout);
                }

                // Remove event listener
                canvas.removeEventListener('click', handleClick);

                // Calculate end time
                const endTime = Date.now();
                const totalTime = startTime ? endTime - startTime : 0;

                // Compute trial data
                const trialData = {
                    module: 'trail_making',
                    subtest: `trail_${part.toLowerCase()}`,
                    phase,
                    completed,
                    time_ms: totalTime,
                    error_count: errorIndices.length,
                    error_indices: errorIndices,
                    correct_click_sequence: clicks.filter(c => c.correct).map(c => c.target),
                    click_data: clicks,
                    startTime,
                    endTime
                };

                // Store results in module state
                if (part === 'A') {
                    moduleState.trailAResults = {
                        completed,
                        time_ms: totalTime,
                        error_count: errorIndices.length,
                        error_indices: errorIndices,
                        click_data: clicks
                    };
                } else {
                    moduleState.trailBResults = {
                        completed,
                        time_ms: totalTime,
                        error_count: errorIndices.length,
                        error_indices: errorIndices,
                        click_data: clicks
                    };
                }

                // Clear progress on completion
                if (sessionId && completed) {
                    clearProgress(sessionId);
                }

                // Finish trial
                jsPsych.finishTrial(trialData);
            };

            // Handle window resize for responsive canvas
            const handleResize = () => {
                const containerWidth = displayElement.clientWidth;
                const scale = Math.min(1, containerWidth / params.canvas_width);
                canvas.style.transform = `scale(${scale})`;
                canvas.style.transformOrigin = 'top center';
            };

            window.addEventListener('resize', handleResize);
            handleResize();
        }
    };

    // Register the plugin
    if (!jsPsych.plugins) jsPsych.plugins = {};
    jsPsych.plugins['canvas-click-response'] = plugin;
}

/**
 * Register the canvas-countdown plugin for rest periods
 */
function registerCanvasCountdownPlugin(jsPsych) {
    // Check if already registered
    if (jsPsych.plugins && jsPsych.plugins['canvas-countdown']) {
        return;
    }

    const plugin = {
        info: {
            name: 'canvas-countdown',
            parameters: {
                duration: { type: jsPsych.utils.ParameterType.INT, default: 30 }
            }
        },
        trial: async function(displayElement, trial) {
            const duration = trial.duration || 30;
            let remaining = duration;
            let countdownInterval = null;

            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 200;
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
            canvas.style.cursor = 'default';

            displayElement.innerHTML = '';
            displayElement.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            function drawCountdown() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw background
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw timer text
                ctx.fillStyle = '#2c3e50';
                ctx.font = 'bold 48px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${remaining}s`, canvas.width / 2, canvas.height / 2 - 20);

                // Draw label
                ctx.font = '18px sans-serif';
                ctx.fillText('Rest before Part B', canvas.width / 2, canvas.height / 2 + 30);

                // Draw progress ring
                const progress = remaining / duration;
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2 - 20;
                const radius = 50;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = 4;
                ctx.stroke();

                // Draw empty ring
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, -Math.PI / 2 + (Math.PI * 2 * progress), Math.PI * 1.5);
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            drawCountdown();

            countdownInterval = setInterval(() => {
                remaining--;
                drawCountdown();

                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    jsPsych.finishTrial({
                        module: 'trail_making',
                        section: 'rest',
                        duration
                    });
                }
            }, 1000);
        }
    };

    // Register the plugin
    if (!jsPsych.plugins) jsPsych.plugins = {};
    jsPsych.plugins['canvas-countdown'] = plugin;
}

// ---------------------------------------------------------------------
// Main Timeline Builder
// ---------------------------------------------------------------------

/**
 * Build the complete Trail Making A & B timeline
 * @param {Object} jsPsych - jsPsych instance
 * @param {string|null} sessionId - Session ID for storage
 * @returns {Array} Timeline array
 */
export function buildTrailMakingTimeline(jsPsych, sessionId = null) {
    // Register custom plugins
    registerCanvasClickPlugin(jsPsych);
    registerCanvasCountdownPlugin(jsPsych);

    resetModuleState();

    const timeline = [];

    // Intro screen
    timeline.push(buildIntroTrial());

    // Part A Instructions
    timeline.push(buildPartAInstructionsTrial());

    // Part A Practice
    const practiceAPositions = generateCirclePositions(PART_A_PRACTICE_COUNT, CANVAS_WIDTH, CANVAS_HEIGHT);
    const practiceASequence = getPartASequence(PART_A_PRACTICE_COUNT);

    timeline.push({
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        isPractice: true,
        data: {
            module: 'trail_making',
            subtest: 'trail_a',
            phase: 'practice',
            expected_sequence: practiceASequence
        },
        on_start: () => {
            moduleState.partAPracticeErrors = 0;
        }
    });

    // Part A Test
    const testAPositions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);
    const testASequence = getPartASequence(25);

    timeline.push({
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        isPractice: false,
        data: {
            module: 'trail_making',
            subtest: 'trail_a',
            phase: 'test',
            expected_sequence: testASequence
        },
        on_start: () => {
            moduleState.trailAResults = {
                completed: false,
                time_ms: 0,
                error_count: 0,
                error_indices: [],
                click_data: []
            };
        }
    });

    // Part A Complete
    timeline.push({
        type: 'html-keyboard-response',
        stimulus: '',
        choices: [' '],
        data: { module: 'trail_making', section: 'part_a_complete' },
        on_start: (trial) => {
            const results = moduleState.trailAResults || {};
            const timeSec = ((results.time_ms ?? 0) / 1000).toFixed(1);
            const errors = results.error_count ?? 0;
            trial.stimulus = `
                <div class="focus-box">
                    <h2>Part A Complete</h2>
                    <div class="tmt-results">
                        <p><strong>Time:</strong> ${timeSec} seconds</p>
                        <p><strong>Errors:</strong> ${errors}</p>
                    </div>
                    <p style="margin-top: 2rem;">Take a short break before Part B.</p>
                    <p>Press <strong>SPACE</strong> to continue</p>
                </div>
            `;
        }
    });

    // Rest Screen
    timeline.push({
        type: 'canvas-countdown',
        duration: REST_DURATION_SECONDS,
        data: { module: 'trail_making', section: 'rest' }
    });

    // Part B Instructions
    timeline.push(buildPartBInstructionsTrial());

    // Part B Practice
    const practiceBPositions = generateCirclePositions(PART_B_PRACTICE_COUNT, CANVAS_WIDTH, CANVAS_HEIGHT);
    const practiceBSequence = getPartBSequence(4, 3); // 4 numbers, 3 letters

    timeline.push({
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        isPractice: true,
        data: {
            module: 'trail_making',
            subtest: 'trail_b',
            phase: 'practice',
            expected_sequence: practiceBSequence
        },
        on_start: () => {
            moduleState.partBPracticeErrors = 0;
        }
    });

    // Part B Test
    const testBPositions = generateCirclePositions(25, CANVAS_WIDTH, CANVAS_HEIGHT);
    const testBSequence = getPartBSequence(13, 12);

    timeline.push({
        type: 'canvas-click-response',
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        isPractice: false,
        data: {
            module: 'trail_making',
            subtest: 'trail_b',
            phase: 'test',
            expected_sequence: testBSequence
        },
        on_start: () => {
            moduleState.trailBResults = {
                completed: false,
                time_ms: 0,
                error_count: 0,
                error_indices: [],
                click_data: []
            };
        }
    });

    // Score Summary
    timeline.push({
        type: 'html-button-response',
        stimulus: '',
        choices: ['Continue'],
        data: { module: 'trail_making', section: 'summary' },
        on_start: (trial) => {
            const results = {
                trail_a: moduleState.trailAResults || {},
                trail_b: moduleState.trailBResults || {}
            };

            // Calculate derived scores
            const derived = calculateTrailMakingScores(results.trail_a, results.trail_b);
            results.derived = derived;

            const trailA = results.trail_a;
            const trailB = results.trail_b;

            const trailATime = ((trailA?.time_ms ?? 0) / 1000).toFixed(1);
            const trailBTime = ((trailB?.time_ms ?? 0) / 1000).toFixed(1);
            const trailAErrors = trailA?.error_count ?? 0;
            const trailBErrors = trailB?.error_count ?? 0;
            const baDiff = ((derived?.trail_b_minus_a_diff_ms ?? 0) / 1000).toFixed(1);

            trial.stimulus = `
                <div class="focus-box tmt-summary">
                    <h2>Trail Making Results</h2>
                    <div class="tmt-results-grid">
                        <div class="tmt-result-card">
                            <h3>Part A</h3>
                            <p><strong>Time:</strong> ${trailATime}s</p>
                            <p><strong>Errors:</strong> ${trailAErrors}</p>
                            <p><strong>T-Score:</strong> ${derived?.trail_a_t_score ?? '—'}</p>
                        </div>
                        <div class="tmt-result-card">
                            <h3>Part B</h3>
                            <p><strong>Time:</strong> ${trailBTime}s</p>
                            <p><strong>Errors:</strong> ${trailBErrors}</p>
                            <p><strong>T-Score:</strong> ${derived?.trail_b_t_score ?? '—'}</p>
                        </div>
                    </div>
                    <div class="tmt-diff-card">
                        <h3>B - A Difference</h3>
                        <p><strong>${baDiff}s</strong></p>
                        <p><em>${derived?.trail_b_minus_a_diffInterpreted ?? '—'}</em></p>
                        <p class="diff-note">Measures cognitive flexibility and set-switching ability</p>
                    </div>
                </div>
            `;

            // Store results for main.js to collect
            trial.results = results;
        }
    });

    return timeline;
}

/**
 * Get Trail Making results from module state
 * @returns {Object} Combined results object
 */
export function getTrailMakingResults() {
    return {
        trail_a: moduleState.trailAResults || {},
        trail_b: moduleState.trailBResults || {}
    };
}

/**
 * Aggregate Trail Making results for storage
 * @param {Object} data - jsPsych trial data
 * @returns {Object} Aggregated module results
 */
export function aggregateTrailMakingResults(data) {
    const trailA = moduleState.trailAResults || {};
    const trailB = moduleState.trailBResults || {};
    const derived = calculateTrailMakingScores(trailA, trailB);

    return {
        trail_a: {
            completed: trailA.completed ?? false,
            time_ms: trailA.time_ms ?? 0,
            error_count: trailA.error_count ?? 0,
            error_indices: trailA.error_indices ?? [],
            correct_click_sequence: trailA.click_data?.filter(c => c.correct).map(c => c.target) ?? [],
            click_data: trailA.click_data ?? []
        },
        trail_b: {
            completed: trailB.completed ?? false,
            time_ms: trailB.time_ms ?? 0,
            error_count: trailB.error_count ?? 0,
            error_indices: trailB.error_indices ?? [],
            correct_click_sequence: trailB.click_data?.filter(c => c.correct).map(c => c.target) ?? [],
            click_data: trailB.click_data ?? []
        },
        derived,
        metadata: {
            completed_at: new Date().toISOString(),
            part_a_practice_errors: moduleState.partAPracticeErrors ?? 0,
            part_b_practice_errors: moduleState.partBPracticeErrors ?? 0,
            device_pixel_ratio: window.devicePixelRatio || 1
        }
    };
}

// Export for testing
export { getPartASequence, getPartBSequence, generateCirclePositions, detectClick };
