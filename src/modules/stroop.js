/**
 * Victoria Stroop Test Module
 *
 * Implements the Victoria Stroop Test — 3 conditions × 30 trials:
 * 1. Word Reading — read color words printed in black ink
 * 2. Color Naming — name the ink color of XXXXXX strings
 * 3. Inhibition — name the ink color of conflicting color words (Stroop effect)
 *
 * Key mapping: 1=Red, 2=Blue, 3=Green, 4=Yellow
 * RT timeout: 3000ms
 *
 * @see SPEC-Stroop.md
 */

import { calculateStroopScores } from '../scoring/stroop.js';

const KEY_MAP = {
  '1': 'red',
  '2': 'blue',
  '3': 'green',
  '4': 'yellow',
};

const COLOR_HEX = {
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f',
};

const COLOR_NAMES = ['red', 'blue', 'green', 'yellow'];

// Module state (persists across trials)
let moduleState = {
  wordReading: [],
  colorNaming: [],
  inhibition: [],
  ageGroup: '30-44',
};

function resetModuleState() {
  moduleState = {
    wordReading: [],
    colorNaming: [],
    inhibition: [],
    ageGroup: '30-44',
  };
}

/**
 * Get a random color that differs from the given word (for conflict stimuli)
 */
function getConflictingColor(wordColor) {
  const others = COLOR_NAMES.filter(c => c !== wordColor);
  return others[Math.floor(Math.random() * others.length)];
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate the color sequence for a block of trials
 * Ensures balanced representation of each color
 */
function generateColorSequence(count = 30) {
  // Start with 4 colors × 7 = 28 (balanced base)
  const base = [];
  for (let i = 0; i < 7; i++) {
    base.push(...COLOR_NAMES);
  }
  // Shuffle the base
  const shuffled = shuffle(base);
  // Truncate or extend to exact count
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  // Final shuffle of the full sequence to avoid obvious pattern at start
  return shuffle(result);
}

/**
 * Generate conflict sequence for Inhibition block
 * Each item: { word: 'RED', ink: 'blue' } etc.
 */
function generateConflictSequence(count = 30) {
  const sequence = [];
  const words = shuffle([...COLOR_NAMES]);
  for (let i = 0; i < count; i++) {
    const word = words[i % 4];
    const ink = getConflictingColor(word);
    sequence.push({ word, ink });
  }
  return sequence;
}

// ─────────────────────────────────────────────────────────────
// jsPsych Plugin: stroop-key-response
// ─────────────────────────────────────────────────────────────

function registerStroopPlugin(jsPsych) {
  if (jsPsych.plugins && jsPsych.plugins['stroop-key-response']) return;

  const plugin = {
    info: {
      name: 'stroop-key-response',
      parameters: {
        condition: { type: jsPsych.utils.ParameterType.STRING },
        stimulus_type: { type: jsPsych.utils.ParameterType.STRING },
        // For word_reading: { text: 'RED', word: null, ink: null }
        // For color_naming: { text: 'XXXXXX', word: null, ink: 'red' }
        // For inhibition: { text: null, word: 'RED', ink: 'blue' }
        stimulus_config: { type: jsPsych.utils.ParameterType.OBJECT },
        trial_index: { type: jsPsych.utils.ParameterType.INT },
        is_practice: { type: jsPsych.utils.ParameterType.BOOL, default: false },
        timeout_ms: { type: jsPsych.utils.ParameterType.INT, default: 3000 },
      },
    },

    trial: async function(displayElement, trial) {
      const {
        condition,
        stimulus_type, // 'word_reading' | 'color_naming' | 'inhibition'
        stimulus_config,
        trial_index,
        is_practice = false,
        timeout_ms = 3000,
      } = trial;

      const sc = stimulus_config;
      let stimulusHtml = '';
      let correctKey = null;

      if (stimulus_type === 'word_reading') {
        // Color word in BLACK
        const color = sc.word; // 'red', 'blue', etc.
        const text = sc.word.toUpperCase();
        stimulusHtml = `<div class="stroop-word" style="color: #1a1a1a; font-size: 4rem; font-weight: bold; font-family: sans-serif;">${text}</div>`;
        correctKey = KEY_MAP[Object.keys(KEY_MAP).find(k => KEY_MAP[k] === color)];
      } else if (stimulus_type === 'color_naming') {
        // XXXXXX in colored ink
        const color = sc.ink;
        const hex = COLOR_HEX[color];
        stimulusHtml = `<div class="stroop-word" style="color: ${hex}; font-size: 4rem; font-weight: bold; font-family: sans-serif;">XXXXXX</div>`;
        correctKey = Object.keys(KEY_MAP).find(k => KEY_MAP[k] === color);
      } else if (stimulus_type === 'inhibition') {
        // Word in conflicting ink
        const wordText = sc.word.toUpperCase();
        const inkColor = sc.ink;
        const hex = COLOR_HEX[inkColor];
        stimulusHtml = `<div class="stroop-word" style="color: ${hex}; font-size: 4rem; font-weight: bold; font-family: sans-serif;">${wordText}</div>`;
        correctKey = Object.keys(KEY_MAP).find(k => KEY_MAP[k] === inkColor);
      }

      const keyPrompt = `
        <div class="stroop-key-prompt">
          <span style="color:${COLOR_HEX.red}">1=Red</span> &nbsp;
          <span style="color:${COLOR_HEX.blue}">2=Blue</span> &nbsp;
          <span style="color:${COLOR_HEX.green}">3=Green</span> &nbsp;
          <span style="color:${COLOR_HEX.yellow}">4=Yellow</span>
        </div>
      `;

      displayElement.innerHTML = `
        <div class="stroop-container">
          <div class="stroop-stimulus">${stimulusHtml}</div>
          ${keyPrompt}
        </div>
      `;

      const startTime = Date.now();
      let responded = false;
      let userKey = null;
      let rt = null;
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        if (!responded) {
          responded = true;
          timedOut = true;
          rt = timeout_ms;
          finishTrial();
        }
      }, timeout_ms);

      const finishTrial = () => {
        clearTimeout(timeoutId);
        const correct = !timedOut && userKey === correctKey;

        const trialData = {
          module: 'stroop',
          condition,
          stimulus_type,
          trial_index: trial_index,
          is_practice: is_practice,
          word: sc.word || null,
          ink: sc.ink || null,
          correct_key: correctKey,
          user_key: userKey,
          correct,
          timed_out: timedOut,
          rt_ms: rt,
          start_time: startTime,
        };

        // Record in module state
        if (condition === 'word_reading') moduleState.wordReading.push(trialData);
        else if (condition === 'color_naming') moduleState.colorNaming.push(trialData);
        else if (condition === 'inhibition') moduleState.inhibition.push(trialData);

        jsPsych.finishTrial(trialData);
      };

      const handleKey = (info) => {
        if (responded) return;
        const key = String(info.key).replace(/['"]/g, '');
        if (!KEY_MAP[key]) return; // Ignore non-mapped keys
        responded = true;
        userKey = key;
        rt = Date.now() - startTime;
        finishTrial();
      };

      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: handleKey,
        valid_responses: Object.keys(KEY_MAP),
        rt_method: 'performance',
        persist: false,
      });
    },
  };

  if (!jsPsych.plugins) jsPsych.plugins = {};
  jsPsych.plugins['stroop-key-response'] = plugin;
}

// ─────────────────────────────────────────────────────────────
// Instruction Screens
// ─────────────────────────────────────────────────────────────

function buildIntroTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Victoria Stroop Test</h2>
        <p class="interview-description">
          This test measures how quickly you can name colors and read words.
        </p>
        <div class="stroop-info">
          <p><strong>3 parts</strong></p>
          <ul style="text-align: left; display: inline-block; line-height: 2;">
            <li>Word Reading — read color words (RED, BLUE, GREEN, YELLOW)</li>
            <li>Color Naming — name the color of XXXXXX text</li>
            <li>Inhibition — name the color of the INK (not the word)</li>
          </ul>
        </div>
        <div class="interview-instructions">
          <p>• Press <strong>1</strong> for Red, <strong>2</strong> for Blue, <strong>3</strong> for Green, <strong>4</strong> for Yellow</p>
          <p>• Respond as <strong>quickly and accurately</strong> as possible</p>
          <p>• If you don't respond in 3 seconds, it counts as an error</p>
        </div>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'intro' },
    post_trial_gap: 500,
  };
}

function buildWordReadingInstructionsTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Part 1 — Word Reading</h2>
        <p>You will see color words: <strong>RED</strong>, <strong>BLUE</strong>, <strong>GREEN</strong>, <strong>YELLOW</strong></p>
        <p>The words are printed in <strong style="color:#1a1a1a">BLACK ink</strong>.</p>
        <p>Simply <strong>read the word</strong> out loud as fast as possible.</p>
        <p style="margin-top:1.5rem;">Press <strong>1</strong>=Red, <strong>2</strong>=Blue, <strong>3</strong>=Green, <strong>4</strong>=Yellow</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'word_reading_instructions' },
    post_trial_gap: 500,
  };
}

function buildColorNamingInstructionsTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Part 2 — Color Naming</h2>
        <p>You will see: <span style="color:${COLOR_HEX.red}; font-weight:bold; font-size:1.5rem;">XXXXXX</span></p>
        <p>The X's are colored. <strong>Name the COLOR</strong>, not any word.</p>
        <p style="margin-top:1.5rem;">Press <strong>1</strong>=Red, <strong>2</strong>=Blue, <strong>3</strong>=Green, <strong>4</strong>=Yellow</p>
        <p style="margin-top:1rem; color:#e74c3c;">Try to go as fast as you can without making mistakes.</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start practice</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'color_naming_instructions' },
    post_trial_gap: 500,
  };
}

function buildColorNamingPracticeComplete() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Color Naming Practice Complete</h2>
        <p>Great work! Now you'll do the real Color Naming test.</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'color_naming_practice_complete' },
    post_trial_gap: 500,
  };
}

function buildInhibitionInstructionsTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Part 3 — Inhibition</h2>
        <p>You will see color words printed in a <strong>different colored ink</strong>.</p>
        <p>Example: the word <strong style="color:${COLOR_HEX.blue}; font-size:1.5rem;">RED</strong> is printed in BLUE ink.</p>
        <p style="margin-top:1rem; color:#e74c3c; font-weight:bold;">Say the COLOR of the INK, NOT the word!</p>
        <p style="margin-top:1rem;">This part is harder — your brain will want to read the word.</p>
        <p style="margin-top:1.5rem;">Press <strong>1</strong>=Red, <strong>2</strong>=Blue, <strong>3</strong>=Green, <strong>4</strong>=Yellow</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start practice</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'inhibition_instructions' },
    post_trial_gap: 500,
  };
}

function buildInhibitionPracticeComplete() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Inhibition Practice Complete</h2>
        <p>Great work! Now you'll do the real Inhibition test.</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'stroop', section: 'inhibition_practice_complete' },
    post_trial_gap: 500,
  };
}

// ─────────────────────────────────────────────────────────────
// Practice Phase Builder
// ─────────────────────────────────────────────────────────────

/**
 * Build practice trials for a condition
 * @param {string} condition — 'color_naming' | 'inhibition'
 * @param {number} count — number of practice trials
 * @returns {Array} jsPsych trials
 */
function buildPracticeTrials(condition, count = 10) {
  const trials = [];
  let colorSeq;

  if (condition === 'color_naming') {
    colorSeq = generateColorSequence(count);
    for (let i = 0; i < count; i++) {
      const ink = colorSeq[i];
      trials.push({
        type: 'stroop-key-response',
        condition: 'color_naming',
        stimulus_type: 'color_naming',
        stimulus_config: { text: 'XXXXXX', ink },
        trial_index: i,
        is_practice: true,
        data: { module: 'stroop', condition: 'color_naming', is_practice: true, trial_index: i },
      });
    }
  } else if (condition === 'inhibition') {
    const conflictSeq = generateConflictSequence(count);
    for (let i = 0; i < count; i++) {
      const { word, ink } = conflictSeq[i];
      trials.push({
        type: 'stroop-key-response',
        condition: 'inhibition',
        stimulus_type: 'inhibition',
        stimulus_config: { word, ink },
        trial_index: i,
        is_practice: true,
        data: { module: 'stroop', condition: 'inhibition', is_practice: true, trial_index: i },
      });
    }
  }

  return trials;
}

/**
 * Check practice results and return pass/fail
 */
function buildPracticeFeedbackTrial(condition) {
  return {
    type: 'html-keyboard-response',
    stimulus: '',
    choices: [' '],
    data: { module: 'stroop', section: `${condition}_practice_feedback` },
    on_start: (trial) => {
      const trials = moduleState[condition === 'color_naming' ? 'colorNaming' : 'inhibition'];
      const errors = trials.filter(t => !t.correct).length;
      const passed = errors <= 2;
      trial.stimulus = `
        <div class="focus-box">
          <h2>${passed ? '✅ Practice Passed' : '⚠️ Practice — Try Again'}</h2>
          <p>Errors: <strong>${errors}</strong> (max 2 to pass)</p>
          <p style="margin-top:1rem;">${passed ? 'You may proceed to the real test.' : 'Please try to be more careful.'}</p>
          <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
        </div>
      `;
    },
    on_finish: () => {
      // Clear practice trials from module state
      if (condition === 'color_naming') {
        moduleState.colorNaming = [];
      } else {
        moduleState.inhibition = [];
      }
    },
    post_trial_gap: 500,
  };
}

// ─────────────────────────────────────────────────────────────
// Test Block Builders
// ─────────────────────────────────────────────────────────────

/**
 * Build Word Reading test block (30 trials)
 */
function buildWordReadingTestTrials() {
  const trials = [];
  const colorSeq = generateColorSequence(30);
  for (let i = 0; i < 30; i++) {
    const word = colorSeq[i];
    trials.push({
      type: 'stroop-key-response',
      condition: 'word_reading',
      stimulus_type: 'word_reading',
      stimulus_config: { word },
      trial_index: i,
      is_practice: false,
      data: { module: 'stroop', condition: 'word_reading', is_practice: false, trial_index: i },
    });
  }
  return trials;
}

/**
 * Build Color Naming test block (30 trials)
 */
function buildColorNamingTestTrials() {
  const trials = [];
  const colorSeq = generateColorSequence(30);
  for (let i = 0; i < 30; i++) {
    const ink = colorSeq[i];
    trials.push({
      type: 'stroop-key-response',
      condition: 'color_naming',
      stimulus_type: 'color_naming',
      stimulus_config: { text: 'XXXXXX', ink },
      trial_index: i,
      is_practice: false,
      data: { module: 'stroop', condition: 'color_naming', is_practice: false, trial_index: i },
    });
  }
  return trials;
}

/**
 * Build Inhibition test block (30 trials)
 */
function buildInhibitionTestTrials() {
  const trials = [];
  const conflictSeq = generateConflictSequence(30);
  for (let i = 0; i < 30; i++) {
    const { word, ink } = conflictSeq[i];
    trials.push({
      type: 'stroop-key-response',
      condition: 'inhibition',
      stimulus_type: 'inhibition',
      stimulus_config: { word, ink },
      trial_index: i,
      is_practice: false,
      data: { module: 'stroop', condition: 'inhibition', is_practice: false, trial_index: i },
    });
  }
  return trials;
}

// ─────────────────────────────────────────────────────────────
// Results Screen
// ─────────────────────────────────────────────────────────────

function buildResultsTrial() {
  return {
    type: 'html-button-response',
    stimulus: '',
    choices: ['Continue'],
    data: { module: 'stroop', section: 'results' },
    on_start: (trial) => {
      const results = {
        word_reading: moduleState.wordReading,
        color_naming: moduleState.colorNaming,
        inhibition: moduleState.inhibition,
      };
      const scores = calculateStroopScores(results, moduleState.ageGroup);

      const wr = scores.word_reading;
      const cn = scores.color_naming;
      const inh = scores.inhibition;

      trial.stimulus = `
        <div class="focus-box stroop-results">
          <h2>Victoria Stroop Results</h2>
          <div class="stroop-results-grid">
            <div class="stroop-result-card">
              <h3>Word Reading</h3>
              <p><strong>Errors:</strong> ${wr.errors} / ${wr.total_trials}</p>
              <p><strong>Mean RT:</strong> ${wr.mean_rt_sec}s</p>
              <p><strong>T-Score:</strong> ${wr.t_score}</p>
            </div>
            <div class="stroop-result-card">
              <h3>Color Naming</h3>
              <p><strong>Errors:</strong> ${cn.errors} / ${cn.total_trials}</p>
              <p><strong>Mean RT:</strong> ${cn.mean_rt_sec}s</p>
              <p><strong>T-Score:</strong> ${cn.t_score}</p>
            </div>
            <div class="stroop-result-card">
              <h3>Inhibition</h3>
              <p><strong>Errors:</strong> ${inh.errors} / ${inh.total_trials}</p>
              <p><strong>Mean RT:</strong> ${inh.mean_rt_sec}s</p>
              <p><strong>T-Score:</strong> ${inh.t_score}</p>
            </div>
          </div>
          <div class="stroop-interference-card">
            <h3>Interference Score</h3>
            <p><strong>${scores.interference_score}s</strong></p>
            <p><em>${scores.interference_interpreted}</em></p>
            <p class="diff-note">Inhibition RT minus Color Naming RT — measures inhibitory control</p>
          </div>
        </div>
      `;
    },
    post_trial_gap: 500,
  };
}

// ─────────────────────────────────────────────────────────────
// Main Timeline Builder
// ─────────────────────────────────────────────────────────────

/**
 * Build the complete Victoria Stroop Test timeline
 * @param {Object} jsPsych — jsPsych instance
 * @param {string|null} sessionId — Session ID for storage
 * @param {string} ageGroup — Age group for T-score norms (default: '30-44')
 * @returns {Array} Timeline array
 */
export function buildStroopTimeline(jsPsych, sessionId = null, ageGroup = '30-44') {
  registerStroopPlugin(jsPsych);
  resetModuleState();
  moduleState.ageGroup = ageGroup;

  const timeline = [];

  // ── Intro ──
  timeline.push(buildIntroTrial());

  // ── Part 1: Word Reading ──
  timeline.push(buildWordReadingInstructionsTrial());
  timeline.push(...buildWordReadingTestTrials());

  // ── Part 2: Color Naming ──
  timeline.push(buildColorNamingInstructionsTrial());

  // Practice (color naming)
  timeline.push(...buildPracticeTrials('color_naming', 10));
  timeline.push(buildPracticeFeedbackTrial('color_naming'));

  // Test (color naming)
  timeline.push(...buildColorNamingTestTrials());

  // ── Part 3: Inhibition ──
  timeline.push(buildInhibitionInstructionsTrial());

  // Practice (inhibition)
  timeline.push(...buildPracticeTrials('inhibition', 10));
  timeline.push(buildPracticeFeedbackTrial('inhibition'));

  // Test (inhibition)
  timeline.push(...buildInhibitionTestTrials());

  // ── Results ──
  timeline.push(buildResultsTrial());

  return timeline;
}

/**
 * Get Stroop results from module state
 */
export function getStroopResults() {
  return {
    word_reading: moduleState.wordReading,
    color_naming: moduleState.colorNaming,
    inhibition: moduleState.inhibition,
  };
}

/**
 * Aggregate Stroop results for storage
 */
export function aggregateStroopResults(data, ageGroup = '30-44') {
  const scores = calculateStroopScores(data, ageGroup);
  return {
    ...scores,
    metadata: {
      completed_at: new Date().toISOString(),
      age_group: ageGroup,
    },
  };
}

// Export utilities for testing
export { generateColorSequence, generateConflictSequence, getConflictingColor, shuffle };
