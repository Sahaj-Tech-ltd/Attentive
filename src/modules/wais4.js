/**
 * WAIS-IV Cognitive Subtests Module
 * 
 * Implements three subtests per WAIS-IV manual:
 * 1. Digit Span Forward (DSF) — lengths 3-9, 2 trials each
 * 2. Digit Span Backward (DSB) — lengths 2-8, 2 trials each
 * 3. Coding / Symbol Search — 90 seconds, 9 symbol-digit pairs
 * 
 * @see SPEC-WAIS-IV.md for full specification
 */

import { calculateWAIS4Scores } from '../scoring/wais4.js';

// Session storage key prefix for progress backup
const SESSION_STORAGE_KEY = 'wais4_progress_';

// ---------------------------------------------------------------------------
// Digit Sequences (per WAIS-IV manual)
// ---------------------------------------------------------------------------

/**
 * DSF sequences: lengths 3-9, 2 trials each
 * Format: [length][trialIndex] where trialIndex 0=A, 1=B
 */
const DSF_SEQUENCES = {
    3: [['4', '7', '1'], ['5', '8', '2']],
    4: [['2', '6', '9', '3'], ['3', '5', '2', '8']],
    5: [['8', '1', '4', '7', '3'], ['6', '2', '5', '9', '1']],
    6: [['7', '3', '8', '6', '1', '4'], ['4', '9', '2', '7', '3', '5']],
    7: [['3', '8', '2', '5', '7', '1', '9'], ['5', '2', '8', '4', '6', '9', '3']],
    8: [['6', '1', '9', '4', '8', '2', '7', '3'], ['9', '5', '8', '1', '3', '7', '6', '2']],
    9: [['7', '4', '9', '2', '6', '8', '1', '5', '3'], ['5', '8', '3', '9', '2', '4', '7', '6', '1']]
};

/**
 * DSB sequences: same strings as DSF but lengths 2-8
 * DSB uses reverse order of DSF sequences
 */
const DSB_SEQUENCES = {
    2: [['7', '4'], ['3', '8']],
    3: [['4', '7', '1'], ['5', '8', '2']],
    4: [['2', '6', '9', '3'], ['3', '5', '2', '8']],
    5: [['8', '1', '4', '7', '3'], ['6', '2', '5', '9', '1']],
    6: [['7', '3', '8', '6', '1', '4'], ['4', '9', '2', '7', '3', '5']],
    7: [['3', '8', '2', '5', '7', '1', '9'], ['5', '2', '8', '4', '6', '9', '3']],
    8: [['6', '1', '9', '4', '8', '2', '7', '3'], ['9', '5', '8', '1', '3', '7', '6', '2']]
};

// ---------------------------------------------------------------------------
// Coding Symbol-Digit Pairs
// ---------------------------------------------------------------------------

const SYMBOL_DIGIT_PAIRS = [
    { symbol: '★', digit: '7' },
    { symbol: '●', digit: '2' },
    { symbol: '▲', digit: '4' },
    { symbol: '■', digit: '9' },
    { symbol: '◆', digit: '5' },
    { symbol: '◀', digit: '3' },
    { symbol: '▶', digit: '1' },
    { symbol: '▼', digit: '8' },
    { symbol: '⬟', digit: '6' }
];

// ---------------------------------------------------------------------------
// Session Storage Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Audio Helper (Web Speech API)
// ---------------------------------------------------------------------------

let audioContext = null;

/**
 * Get or create AudioContext for speech synthesis
 */
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

/**
 * Speak a single digit using Web Speech API
 * @param {string} digit 
 * @returns {Promise}
 */
function speakDigit(digit) {
    return new Promise((resolve) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(digit);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.onend = resolve;
            utterance.onerror = resolve;
            speechSynthesis.speak(utterance);
        } else {
            setTimeout(resolve, 300);
        }
    });
}

/**
 * Play a sequence of digits with 1-second intervals
 * @param {string[]} digits 
 */
async function playDigitSequence(digits) {
    for (let i = 0; i < digits.length; i++) {
        await speakDigit(digits[i]);
        if (i < digits.length - 1) {
            await new Promise(r => setTimeout(r, 700)); // ~1 second gap
        }
    }
    // Play end tone
    playEndTone();
}

/**
 * Play a distinct tone at sequence end
 */
function playEndTone() {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Audio not supported
    }
}

// ---------------------------------------------------------------------------
// Trial Result Tracking
// ---------------------------------------------------------------------------

// Global tracking object for trial results
const trialResults = {
    dsf: [],
    dsb: [],
    coding: []
};

// Global state for DSF/DSB discontinuation
let dsfDiscontinued = false;
let dsbDiscontinued = false;

// ---------------------------------------------------------------------------
// WAIS-IV Intro Screen
// ---------------------------------------------------------------------------

function buildIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box wais-intro">
                <h2>WAIS-IV Cognitive Assessment</h2>
                <p class="interview-description">
                    This module measures your cognitive abilities including 
                    attention, working memory, and processing speed.
                </p>
                <div class="wais-info">
                    <p><strong>3 subtests</strong></p>
                    <ul style="text-align: left; display: inline-block; line-height: 2;">
                        <li>Digit Span Forward — Listen and repeat numbers</li>
                        <li>Digit Span Backward — Listen, reverse, and repeat</li>
                        <li>Coding — Match symbols to digits quickly</li>
                    </ul>
                </div>
                <div class="interview-instructions">
                    <p>• Listen carefully to each sequence</p>
                    <p>• Enter digits using number keys</p>
                    <p>• Work as quickly and accurately as possible</p>
                </div>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'wais4', section: 'intro' },
        post_trial_gap: 500
    };
}

// ---------------------------------------------------------------------------
// DSF Subtest
// ---------------------------------------------------------------------------

/**
 * Build DSF intro trial (before DSF starts)
 */
function buildDSFIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Digit Span Forward</h2>
                <p>You will hear a sequence of numbers.</p>
                <p>Listen carefully, then enter the numbers <strong>in the same order</strong> you heard them.</p>
                <p>Press <strong>SPACE</strong> when you are ready to begin.</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'wais4', section: 'dsf_intro' },
        post_trial_gap: 500
    };
}

/**
 * Build a DSF trial
 */
function buildDSFTrial(length, trialIndex, sessionId) {
    const sequence = DSF_SEQUENCES[length][trialIndex];
    const trialLetter = trialIndex === 0 ? 'A' : 'B';
    
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box digit-span-trial">
                <div class="listening-indicator">
                    <p class="listening-text">Listen...</p>
                    <p class="sequence-display">...</p>
                </div>
            </div>
        `,
        choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        timing_response: -1,
        response_ends_trial: true,
        data: {
            module: 'wais4',
            subtest: 'dsf',
            length,
            trial: trialLetter,
            correctSequence: sequence.join(''),
            correctResponse: null
        },
        on_start: () => {
            // Save current progress
            saveProgress(sessionId, {
                currentSubtest: 'dsf',
                dsfResults: trialResults.dsf
            });
            
            // Play the digit sequence
            setTimeout(() => {
                playDigitSequence(sequence);
            }, 500);
            
            // Update display to show "..." then digits
            setTimeout(() => {
                const display = document.querySelector('.sequence-display');
                if (display) {
                    display.innerHTML = sequence.map(d => `<span class="digit-spoken">${d}</span>`).join(' ');
                }
            }, 200);
        },
        on_finish: (data) => {
            const userResponse = data.response !== null ? String(data.response).replace(/[^0-9]/g, '') : '';
            const correct = userResponse === sequence.join('');
            
            trialResults.dsf.push({
                length,
                trial: trialLetter,
                correct: correct ? 1 : 0,
                user_response: userResponse,
                rt_ms: data.rt ?? 0
            });
            
            data.correctResponse = correct;
            data.user_response = userResponse;
            
            // Save progress
            saveProgress(sessionId, {
                currentSubtest: 'dsf',
                dsfResults: trialResults.dsf
            });
        }
    };
}

/**
 * Build DSF feedback trial
 */
function buildDSFFeedbackTrial(length, trialIndex, wasCorrect) {
    const trialLetter = trialIndex === 0 ? 'A' : 'B';
    
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box feedback-trial ${wasCorrect ? 'correct' : 'incorrect'}">
                <p class="feedback-icon">${wasCorrect ? '✓' : '✗'}</p>
                <p class="feedback-text">${wasCorrect ? 'Correct!' : 'Incorrect'}</p>
                <p class="feedback-detail">${wasCorrect ? 'Good job!' : 'The correct answer was: ' + DSF_SEQUENCES[length][trialIndex].join(' ')}</p>
            </div>
        `,
        choices: [' '],
        timing_response: 800,
        response_ends_trial: true,
        data: {
            module: 'wais4',
            subtest: 'dsf_feedback',
            length,
            trial: trialLetter,
            correct: wasCorrect ? 1 : 0
        }
    };
}

/**
 * Check if DSF should discontinue (0 correct on both trials at a length)
 */
function checkDSFDiscontinuation(length) {
    const trials = trialResults.dsf.filter(t => t.length === length);
    if (trials.length === 2) {
        const correctCount = trials.reduce((sum, t) => sum + t.correct, 0);
        if (correctCount === 0) {
            dsfDiscontinued = true;
            return true;
        }
    }
    return false;
}

/**
 * Build the complete DSF timeline section
 */
function buildDSFTimeline(jsPsych, sessionId) {
    const timeline = [];
    
    timeline.push(buildDSFIntroTrial());
    
    const lengths = [3, 4, 5, 6, 7, 8, 9];
    
    for (const length of lengths) {
        // Trial A
        const trialA = buildDSFTrial(length, 0, sessionId);
        timeline.push(trialA);
        
        // Feedback A
        const feedbackA = {
            type: 'html-keyboard-response',
            stimulus: '',
            choices: [' '],
            timing_response: 800,
            data: { module: 'wais4', subtest: 'dsf_feedback' },
            on_start: (trial) => {
                const lastResult = trialResults.dsf[trialResults.dsf.length - 1];
                trial.stimulus = `
                    <div class="focus-box feedback-trial ${lastResult && lastResult.correct ? 'correct' : 'incorrect'}">
                        <p class="feedback-icon">${lastResult && lastResult.correct ? '✓' : '✗'}</p>
                        <p class="feedback-text">${lastResult && lastResult.correct ? 'Correct!' : 'Incorrect'}</p>
                        <p class="feedback-detail">${lastResult && lastResult.correct ? 'Good job!' : 'The correct answer was: ' + DSF_SEQUENCES[length][0].join(' ')}</p>
                    </div>
                `;
            }
        };
        timeline.push(feedbackA);
        
        // Check discontinuation after Trial A
        if (checkDSFDiscontinuation(length)) {
            break;
        }
        
        // Trial B
        const trialB = buildDSFTrial(length, 1, sessionId);
        timeline.push(trialB);
        
        // Feedback B
        const feedbackB = {
            type: 'html-keyboard-response',
            stimulus: '',
            choices: [' '],
            timing_response: 800,
            data: { module: 'wais4', subtest: 'dsf_feedback' },
            on_start: (trial) => {
                const lastResult = trialResults.dsf[trialResults.dsf.length - 1];
                trial.stimulus = `
                    <div class="focus-box feedback-trial ${lastResult && lastResult.correct ? 'correct' : 'incorrect'}">
                        <p class="feedback-icon">${lastResult && lastResult.correct ? '✓' : '✗'}</p>
                        <p class="feedback-text">${lastResult && lastResult.correct ? 'Correct!' : 'Incorrect'}</p>
                        <p class="feedback-detail">${lastResult && lastResult.correct ? 'Good job!' : 'The correct answer was: ' + DSF_SEQUENCES[length][1].join(' ')}</p>
                    </div>
                `;
            }
        };
        timeline.push(feedbackB);
        
        // Check discontinuation after Trial B
        if (checkDSFDiscontinuation(length)) {
            break;
        }
    }
    
    return timeline;
}

// ---------------------------------------------------------------------------
// DSB Subtest
// ---------------------------------------------------------------------------

/**
 * Build DSB intro trial
 */
function buildDSBIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Digit Span Backward</h2>
                <p>You will hear a sequence of numbers.</p>
                <p>Enter the numbers <strong>in reverse order</strong> (last digit first).</p>
                <p>For example: if you hear <strong>7-4</strong>, enter <strong>4-7</strong>.</p>
                <p>Press <strong>SPACE</strong> when you are ready to begin.</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'wais4', section: 'dsb_intro' },
        post_trial_gap: 500
    };
}

/**
 * Build a DSB trial
 */
function buildDSBTrial(length, trialIndex, sessionId) {
    const sequence = DSB_SEQUENCES[length][trialIndex];
    const reversedSequence = [...sequence].reverse();
    const trialLetter = trialIndex === 0 ? 'A' : 'B';
    
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box digit-span-trial">
                <div class="listening-indicator">
                    <p class="listening-text">Listen...</p>
                    <p class="sequence-display">...</p>
                </div>
            </div>
        `,
        choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        timing_response: -1,
        response_ends_trial: true,
        data: {
            module: 'wais4',
            subtest: 'dsb',
            length,
            trial: trialLetter,
            correctSequence: reversedSequence.join(''),
            presentedSequence: sequence.join(''),
            correctResponse: null
        },
        on_start: () => {
            saveProgress(sessionId, {
                currentSubtest: 'dsb',
                dsfResults: trialResults.dsf,
                dsbResults: trialResults.dsb
            });
            
            setTimeout(() => {
                playDigitSequence(sequence);
            }, 500);
            
            setTimeout(() => {
                const display = document.querySelector('.sequence-display');
                if (display) {
                    display.innerHTML = sequence.map(d => `<span class="digit-spoken">${d}</span>`).join(' ');
                }
            }, 200);
        },
        on_finish: (data) => {
            const userResponse = data.response !== null ? String(data.response).replace(/[^0-9]/g, '') : '';
            const correct = userResponse === reversedSequence.join('');
            
            trialResults.dsb.push({
                length,
                trial: trialLetter,
                correct: correct ? 1 : 0,
                user_response: userResponse,
                rt_ms: data.rt ?? 0
            });
            
            data.correctResponse = correct;
            data.user_response = userResponse;
            
            saveProgress(sessionId, {
                currentSubtest: 'dsb',
                dsfResults: trialResults.dsf,
                dsbResults: trialResults.dsb
            });
        }
    };
}

/**
 * Check if DSB should discontinue
 */
function checkDSBDiscontinuation(length) {
    const trials = trialResults.dsb.filter(t => t.length === length);
    if (trials.length === 2) {
        const correctCount = trials.reduce((sum, t) => sum + t.correct, 0);
        if (correctCount === 0) {
            dsbDiscontinued = true;
            return true;
        }
    }
    return false;
}

/**
 * Build the complete DSB timeline section
 */
function buildDSBTimeline(jsPsych, sessionId) {
    const timeline = [];
    
    timeline.push(buildDSBIntroTrial());
    
    const lengths = [2, 3, 4, 5, 6, 7, 8];
    
    for (const length of lengths) {
        // Trial A
        const trialA = buildDSBTrial(length, 0, sessionId);
        timeline.push(trialA);
        
        // Feedback A
        const feedbackA = {
            type: 'html-keyboard-response',
            stimulus: '',
            choices: [' '],
            timing_response: 800,
            data: { module: 'wais4', subtest: 'dsb_feedback' },
            on_start: (trial) => {
                const lastResult = trialResults.dsb[trialResults.dsb.length - 1];
                const seq = DSB_SEQUENCES[length][0];
                trial.stimulus = `
                    <div class="focus-box feedback-trial ${lastResult && lastResult.correct ? 'correct' : 'incorrect'}">
                        <p class="feedback-icon">${lastResult && lastResult.correct ? '✓' : '✗'}</p>
                        <p class="feedback-text">${lastResult && lastResult.correct ? 'Correct!' : 'Incorrect'}</p>
                        <p class="feedback-detail">${lastResult && lastResult.correct ? 'Good job!' : 'The correct answer was: ' + [...seq].reverse().join(' ')}</p>
                    </div>
                `;
            }
        };
        timeline.push(feedbackA);
        
        if (checkDSBDiscontinuation(length)) {
            break;
        }
        
        // Trial B
        const trialB = buildDSBTrial(length, 1, sessionId);
        timeline.push(trialB);
        
        // Feedback B
        const feedbackB = {
            type: 'html-keyboard-response',
            stimulus: '',
            choices: [' '],
            timing_response: 800,
            data: { module: 'wais4', subtest: 'dsb_feedback' },
            on_start: (trial) => {
                const lastResult = trialResults.dsb[trialResults.dsb.length - 1];
                const seq = DSB_SEQUENCES[length][1];
                trial.stimulus = `
                    <div class="focus-box feedback-trial ${lastResult && lastResult.correct ? 'correct' : 'incorrect'}">
                        <p class="feedback-icon">${lastResult && lastResult.correct ? '✓' : '✗'}</p>
                        <p class="feedback-text">${lastResult && lastResult.correct ? 'Correct!' : 'Incorrect'}</p>
                        <p class="feedback-detail">${lastResult && lastResult.correct ? 'Good job!' : 'The correct answer was: ' + [...seq].reverse().join(' ')}</p>
                    </div>
                `;
            }
        };
        timeline.push(feedbackB);
        
        if (checkDSBDiscontinuation(length)) {
            break;
        }
    }
    
    return timeline;
}

// ---------------------------------------------------------------------------
// Coding / Symbol Search Subtest
// ---------------------------------------------------------------------------

/**
 * Build Coding intro trial
 */
function buildCodingIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Coding / Symbol Search</h2>
                <p>At the top of the screen, you will see <strong>9 symbol-digit pairs</strong>.</p>
                <p>A symbol will appear in the center. Find its matching digit and press the corresponding number key (1-9).</p>
                <p>Then press <strong>←</strong> or <strong>→</strong> to confirm your answer.</p>
                <p>You have <strong>90 seconds</strong>. Work as quickly as you can!</p>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin.</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'wais4', section: 'coding_intro' },
        post_trial_gap: 500
    };
}

/**
 * Build Coding pairs HTML
 */
function buildCodingPairsHTML() {
    return SYMBOL_DIGIT_PAIRS.map((pair, idx) => `
        <span class="coding-pair">
            <span class="symbol">${pair.symbol}</span>
            <span class="arrow">→</span>
            <kbd>${idx + 1}</kbd>
        </span>
    `).join('');
}

/**
 * Generate a random prompt symbol
 */
function getRandomSymbol() {
    const idx = Math.floor(Math.random() * SYMBOL_DIGIT_PAIRS.length);
    return SYMBOL_DIGIT_PAIRS[idx];
}

/**
 * Build the Coding trial (single 90-second timed trial with internal loop)
 */
function buildCodingTimeline(jsPsych, sessionId) {
    const timeline = [];
    
    timeline.push(buildCodingIntroTrial());
    
    // The actual coding trial with internal timing
    const codingTrial = {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="coding-container">
                <div class="coding-timer">
                    <span id="coding-time">1:30</span>
                </div>
                <div class="coding-pairs">
                    ${buildCodingPairsHTML()}
                </div>
                <div class="coding-prompt">
                    <span id="coding-symbol" class="symbol-large">★</span>
                    <p>Press the number of the matching digit, then ← or → to confirm</p>
                </div>
                <div id="coding-feedback" class="coding-feedback"></div>
            </div>
        `,
        choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'ArrowLeft', 'ArrowRight'],
        timing_response: -1,
        response_ends_trial: false, // We control when trial ends
        data: {
            module: 'wais4',
            subtest: 'coding',
            trial_start_time: null,
            correctResponse: null,
            selectedDigit: null,
            confirmed: false
        },
        on_start: (trial) => {
            trial.data.trial_start_time = Date.now();
            
            // Set up the coding state
            let currentSymbol = getRandomSymbol();
            let selectedDigit = null;
            let trialStartTime = Date.now();
            let timeRemaining = 90000; // 90 seconds
            let trialsCompleted = 0;
            let correctCount = 0;
            let lastResponseTime = 0;
            
            // Update symbol display
            const symbolEl = document.getElementById('coding-symbol');
            const feedbackEl = document.getElementById('coding-feedback');
            const timerEl = document.getElementById('coding-time');
            
            if (symbolEl) symbolEl.textContent = currentSymbol.symbol;
            
            // Timer update interval
            const timerInterval = setInterval(() => {
                timeRemaining -= 1000;
                const secs = Math.floor(timeRemaining / 1000);
                const mins = Math.floor(secs / 60);
                const displaySecs = secs % 60;
                if (timerEl) timerEl.textContent = `${mins}:${displaySecs.toString().padStart(2, '0')}`;
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    // End the trial
                    endCodingTrial();
                }
            }, 1000);
            
            // End trial function
            function endCodingTrial() {
                clearInterval(timerInterval);
                
                const trialData = {
                    coding_raw_score: correctCount,
                    coding_trials_attempted: trialsCompleted,
                    coding_time_elapsed_ms: 90000 - timeRemaining,
                    coding_time_remaining_ms: Math.max(0, timeRemaining)
                };
                
                // Save coding results
                trialResults.coding = {
                    raw_score: correctCount,
                    trials_attempted: trialsCompleted,
                    time_elapsed_ms: 90000 - timeRemaining,
                    time_remaining_ms: Math.max(0, timeRemaining)
                };
                
                // Show end screen
                const container = document.querySelector('.coding-container');
                if (container) {
                    container.innerHTML = `
                        <div class="coding-complete">
                            <h2>Time's Up!</h2>
                            <p>You completed <strong>${trialsCompleted}</strong> trials.</p>
                            <p>Correct responses: <strong>${correctCount}</strong></p>
                            <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue.</p>
                        </div>
                    `;
                }
                
                // End trial after a short delay
                setTimeout(() => {
                    jsPsych.endCurrentTimeline();
                }, 500);
            }
            
            // Handle key presses
            function handleKeyPress(e) {
                const key = e.key;
                
                if (key === ' ' && timeRemaining <= 0) {
                    document.removeEventListener('keydown', handleKeyPress);
                    return;
                }
                
                // Number key pressed
                if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
                    selectedDigit = key;
                    trial.data.selectedDigit = parseInt(key);
                    
                    // Highlight selected pair
                    document.querySelectorAll('.coding-pair').forEach((el, idx) => {
                        el.classList.toggle('selected', idx === parseInt(key) - 1);
                    });
                }
                
                // Arrow key confirmation
                if ((key === 'ArrowLeft' || key === 'ArrowRight') && selectedDigit !== null) {
                    const now = Date.now();
                    
                    // Enforce minimum 200ms between responses
                    if (now - lastResponseTime < 200) return;
                    lastResponseTime = now;
                    
                    const correctDigit = SYMBOL_DIGIT_PAIRS.findIndex(p => p.symbol === currentSymbol.symbol) + 1;
                    const isCorrect = parseInt(selectedDigit) === correctDigit;
                    
                    if (isCorrect) correctCount++;
                    trialsCompleted++;
                    
                    // Record trial data
                    trialResults.coding.trial_data = trialResults.coding.trial_data || [];
                    trialResults.coding.trial_data.push({
                        symbol: currentSymbol.symbol,
                        correct_digit: correctDigit,
                        selected_digit: parseInt(selectedDigit),
                        rt_ms: now - trialStartTime,
                        correct: isCorrect ? 1 : 0
                    });
                    
                    // Show feedback
                    if (feedbackEl) {
                        feedbackEl.innerHTML = isCorrect 
                            ? '<span class="correct-flash">✓</span>' 
                            : '<span class="incorrect-flash">✗</span>';
                        setTimeout(() => {
                            feedbackEl.innerHTML = '';
                        }, 150);
                    }
                    
                    // Get next symbol
                    currentSymbol = getRandomSymbol();
                    if (symbolEl) symbolEl.textContent = currentSymbol.symbol;
                    
                    // Clear selection
                    selectedDigit = null;
                    document.querySelectorAll('.coding-pair').forEach(el => {
                        el.classList.remove('selected');
                    });
                    
                    // Check if time expired
                    if (timeRemaining <= 0) {
                        document.removeEventListener('keydown', handleKeyPress);
                        endCodingTrial();
                    }
                }
            }
            
            document.addEventListener('keydown', handleKeyPress);
            
            // 3 second timeout for no response
            let responseTimeout = setTimeout(() => {
                if (selectedDigit === null && timeRemaining > 0) {
                    // Treat as incorrect, advance
                    trialsCompleted++;
                    
                    trialResults.coding.trial_data = trialResults.coding.trial_data || [];
                    trialResults.coding.trial_data.push({
                        symbol: currentSymbol.symbol,
                        correct_digit: SYMBOL_DIGIT_PAIRS.findIndex(p => p.symbol === currentSymbol.symbol) + 1,
                        selected_digit: null,
                        rt_ms: 3000,
                        correct: 0,
                        timeout: true
                    });
                    
                    // Next symbol
                    currentSymbol = getRandomSymbol();
                    if (symbolEl) symbolEl.textContent = currentSymbol.symbol;
                }
            }, 3000);
            
            // Clear timeout on response
            const originalHandleKeyPress = handleKeyPress;
            function handleKeyPress(e) {
                clearTimeout(responseTimeout);
                originalHandleKeyPress(e);
                responseTimeout = setTimeout(() => {
                    if (selectedDigit === null && timeRemaining > 0) {
                        trialsCompleted++;
                        
                        trialResults.coding.trial_data = trialResults.coding.trial_data || [];
                        trialResults.coding.trial_data.push({
                            symbol: currentSymbol.symbol,
                            correct_digit: SYMBOL_DIGIT_PAIRS.findIndex(p => p.symbol === currentSymbol.symbol) + 1,
                            selected_digit: null,
                            rt_ms: 3000,
                            correct: 0,
                            timeout: true
                        });
                        
                        currentSymbol = getRandomSymbol();
                        if (symbolEl) symbolEl.textContent = currentSymbol.symbol;
                    }
                }, 3000);
            }
            
            document.addEventListener('keydown', handleKeyPress);
        },
        on_finish: (data) => {
            // Save final coding results
            saveProgress(sessionId, {
                currentSubtest: 'coding',
                dsfResults: trialResults.dsf,
                dsbResults: trialResults.dsb,
                codingResults: trialResults.coding
            });
        }
    };
    
    timeline.push(codingTrial);
    
    return timeline;
}

// ---------------------------------------------------------------------------
// Score Summary Screen
// ---------------------------------------------------------------------------

/**
 * Build score summary trial
 */
function buildScoreSummaryTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: '', // Filled in on_start
        choices: [' '],
        data: { module: 'wais4', section: 'summary' },
        on_start: (trial) => {
            // Calculate DSF score
            const dsfRaw = trialResults.dsf.reduce((sum, t) => sum + t.correct, 0);
            const dsbRaw = trialResults.dsb.reduce((sum, t) => sum + t.correct, 0);
            const codingRaw = trialResults.coding.raw_score || 0;
            
            // Get scaled scores (default age 18-29)
            const scaled = calculateWAIS4Scores({ dsf: dsfRaw, dsb: dsbRaw, coding: codingRaw });
            
            const dsfLengths = [...new Set(trialResults.dsf.map(t => t.length))];
            const dsbLengths = [...new Set(trialResults.dsb.map(t => t.length))];
            
            trial.stimulus = `
                <div class="focus-box wais-summary">
                    <h2>WAIS-IV Results</h2>
                    
                    <div class="summary-section">
                        <h3>Digit Span Forward</h3>
                        <div class="score-row">
                            <span class="score-label">Raw Score:</span>
                            <span class="score-value">${dsfRaw} / 14</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Scaled Score (est.):</span>
                            <span class="score-value scaled">${scaled.dsf_estimated}</span>
                        </div>
                        <div class="score-detail">
                            Lengths completed: ${dsfLengths.join(', ') || 'None'}
                            ${dsfDiscontinued ? '<br><em>Discontinued</em>' : ''}
                        </div>
                    </div>
                    
                    <div class="summary-section">
                        <h3>Digit Span Backward</h3>
                        <div class="score-row">
                            <span class="score-label">Raw Score:</span>
                            <span class="score-value">${dsbRaw} / 14</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Scaled Score (est.):</span>
                            <span class="score-value scaled">${scaled.dsb_estimated}</span>
                        </div>
                        <div class="score-detail">
                            Lengths completed: ${dsbLengths.join(', ') || 'None'}
                            ${dsbDiscontinued ? '<br><em>Discontinued</em>' : ''}
                        </div>
                    </div>
                    
                    <div class="summary-section">
                        <h3>Coding</h3>
                        <div class="score-row">
                            <span class="score-label">Raw Score:</span>
                            <span class="score-value">${codingRaw}</span>
                        </div>
                        <div class="score-row">
                            <span class="score-label">Scaled Score (est.):</span>
                            <span class="score-value scaled">${scaled.coding_estimated}</span>
                        </div>
                        <div class="score-detail">
                            Trials attempted: ${trialResults.coding.trials_attempted || 0}
                        </div>
                    </div>
                    
                    <p style="margin-top: 2rem; font-size: 0.9rem; color: #666;">
                        * Scaled scores are estimates based on age 18-29 norms.<br>
                        For clinical interpretation, consult a neuropsychologist.
                    </p>
                    
                    <p style="margin-top: 1.5rem;">Press <strong>SPACE</strong> to continue to the next assessment.</p>
                </div>
            `;
        },
        on_finish: (data) => {
            // Clear progress on completion
            // (Keep data for now in case user refreshes on summary screen)
        }
    };
}

// ---------------------------------------------------------------------------
// Main Export: Build WAIS-IV Timeline
// ---------------------------------------------------------------------------

/**
 * Build the complete WAIS-IV timeline
 * 
 * @param {Object} jsPsych - jsPsych instance
 * @param {string} sessionId - Session ID (can be null, results won't be saved)
 * @returns {Array} jsPsych timeline array
 */
export function buildWAISIVTimeline(jsPsych, sessionId = null) {
    const timeline = [];
    
    // Reset trial results
    trialResults.dsf = [];
    trialResults.dsb = [];
    trialResults.coding = [];
    dsfDiscontinued = false;
    dsbDiscontinued = false;
    
    // Load progress if resuming
    if (sessionId) {
        const savedProgress = loadProgress(sessionId);
        if (savedProgress) {
            if (savedProgress.dsfResults) trialResults.dsf = savedProgress.dsfResults;
            if (savedProgress.dsbResults) trialResults.dsb = savedProgress.dsbResults;
            if (savedProgress.codingResults) trialResults.coding = savedProgress.codingResults;
        }
    }
    
    // Intro screen
    timeline.push(buildIntroTrial());
    
    // DSF section
    timeline.push(...buildDSFTimeline(jsPsych, sessionId));
    
    // DSB section
    timeline.push(...buildDSBTimeline(jsPsych, sessionId));
    
    // Coding section
    timeline.push(...buildCodingTimeline(jsPsych, sessionId));
    
    // Score summary
    timeline.push(buildScoreSummaryTrial());
    
    return timeline;
}

/**
 * Get current WAIS-IV trial results
 * @returns {Object}
 */
export function getWAIS4Results() {
    const dsfRaw = trialResults.dsf.reduce((sum, t) => sum + t.correct, 0);
    const dsbRaw = trialResults.dsb.reduce((sum, t) => sum + t.correct, 0);
    const codingRaw = trialResults.coding.raw_score || 0;
    
    return {
        dsf_raw: dsfRaw,
        dsb_raw: dsbRaw,
        coding_raw: codingRaw,
        scaled: calculateWAIS4Scores({ dsf: dsfRaw, dsb: dsbRaw, coding: codingRaw }),
        trial_data: {
            dsf: [...trialResults.dsf],
            dsb: [...trialResults.dsb],
            coding: trialResults.coding
        },
        discontinued: {
            dsf: dsfDiscontinued,
            dsb: dsbDiscontinued
        }
    };
}

/**
 * Aggregate WAIS-IV results for storage
 * @param {Object} waisResults - Results from getWAIS4Results
 * @returns {Object}
 */
export function aggregateWAIS4Results(waisResults) {
    return {
        digit_span_forward: {
            raw_score: waisResults.dsf_raw,
            max_raw: 14,
            trial_data: waisResults.trial_data.dsf
        },
        digit_span_backward: {
            raw_score: waisResults.dsb_raw,
            max_raw: 14,
            trial_data: waisResults.trial_data.dsb
        },
        coding: {
            raw_score: waisResults.coding_raw,
            trials_attempted: waisResults.trial_data.coding.trials_attempted || 0,
            time_elapsed_ms: waisResults.trial_data.coding.time_elapsed_ms || 0,
            trial_data: waisResults.trial_data.coding.trial_data || []
        },
        scaled_scores: waisResults.scaled,
        metadata: {
            completed_at: new Date().toISOString(),
            dsf_discontinued: waisResults.discontinued.dsf,
            dsb_discontinued: waisResults.discontinued.dsb
        }
    };
}
