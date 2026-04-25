/**
 * Wisconsin Card Sorting Test (WCST) Module
 *
 * Implements WCST — 64-card version with 3 categories (color/shape/number).
 * Category switches after 10 consecutive correct sorts.
 * RT timeout: 5000ms per trial.
 *
 * Card dimensions:
 *   - Color: red, blue, yellow, green
 *   - Shape: circle, triangle, square, star
 *   - Number: 1, 2, 3, 4
 *
 * 4 key cards always visible (one representative of each category value):
 *   Key 1 → a color card, Key 2 → a shape card, Key 3 → a number card,
 *   Key 4 → a second color/shape/number (second value of whichever category
 *   wasn't already covered by keys 1-3)
 *
 * @see SPEC-WCST.md
 */

import { calculateWCSTScores, interpretWCSTScore } from '../scoring/wcst.js';

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['red', 'blue', 'yellow', 'green'];
const SHAPES = ['circle', 'triangle', 'square', 'star'];
const NUMBERS = [1, 2, 3, 4];
const TOTAL_TEST_TRIALS = 64;
const PRACTICE_TRIALS = 3;
const CONSECUTIVE_CORRECT_TO_SWITCH = 10;
const RT_TIMEOUT_MS = 5000;

const COLOR_HEX = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#27ae60',
};

// ── Card generation ────────────────────────────────────────────────────────

/**
 * Generate all 64 unique cards (4 colors × 4 shapes × 4 numbers)
 */
function generateAllCards() {
  const cards = [];
  for (const color of COLORS) {
    for (const shape of SHAPES) {
      for (const number of NUMBERS) {
        cards.push({ color, shape, number });
      }
    }
  }
  return cards;
}

/**
 * Fisher-Yates shuffle
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
 * Get a random card from the deck (removing it)
 */
function drawCard(deck) {
  return deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
}

// ── Key card configuration ─────────────────────────────────────────────────

/**
 * The 4 key cards represent one value from each category.
 * Key 1 = color (e.g. red), Key 2 = shape (e.g. circle),
 * Key 3 = number (e.g. 1), Key 4 = second color (e.g. blue)
 * Positions: 1=Top-Left, 2=Top-Right, 3=Bottom-Left, 4=Bottom-Right
 */
const KEY_CARDS = [
  { key: '1', category: 'color',    value: 'red',     color: 'red',     shape: 'circle', number: 1 },
  { key: '2', category: 'shape',   value: 'circle',  color: 'red',     shape: 'circle', number: 1 },
  { key: '3', category: 'number',  value: 1,         color: 'red',     shape: 'circle', number: 1 },
  { key: '4', category: 'color2',  value: 'blue',    color: 'blue',    shape: 'circle', number: 1 },
];

/**
 * Given the current category, return which key index matches.
 * @param {string} category - 'color' | 'shape' | 'number'
 * @param {Object} testCard - the test card object
 * @returns {'1'|'2'|'3'|'4'}
 */
function getCorrectKey(category, testCard) {
  if (category === 'color') {
    // Key cards 1 and 4 are color cards — find the one matching test card color
    for (const kc of KEY_CARDS) {
      if (kc.category === 'color' && kc.value === testCard.color) return kc.key;
      if (kc.category === 'color2' && kc.value === testCard.color) return kc.key;
    }
  } else if (category === 'shape') {
    for (const kc of KEY_CARDS) {
      if (kc.category === 'shape' && kc.value === testCard.shape) return kc.key;
    }
  } else if (category === 'number') {
    for (const kc of KEY_CARDS) {
      if (kc.category === 'number' && kc.value === testCard.number) return kc.key;
    }
  }
  return '1'; // fallback
}

// ── Card HTML rendering ────────────────────────────────────────────────────

function shapeSvg(shape, color) {
  const c = COLOR_HEX[color] || '#888';
  const size = 50;
  if (shape === 'circle') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${c}" />
    </svg>`;
  } else if (shape === 'triangle') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <polygon points="${size/2},4 ${size-4},${size-4} 4,${size-4}" fill="${c}" />
    </svg>`;
  } else if (shape === 'square') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect x="4" y="4" width="${size-8}" height="${size-8}" fill="${c}" />
    </svg>`;
  } else if (shape === 'star') {
    const pts = "50,4 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35";
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <polygon points="${pts}" fill="${c}" />
    </svg>`;
  }
  return '';
}

function renderCard(card, size = 80) {
  const svg = shapeSvg(card.shape, card.color);
  const num = card.number;
  return `
    <div class="wcst-card" style="
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      width: ${size}px; height: ${size}px;
      border: 2px solid #555; border-radius: 8px;
      background: #fff; font-family: sans-serif;">
      <div style="margin-bottom: 4px;">${svg}</div>
      <div style="font-weight: bold; font-size: 1.2rem;">${num}</div>
    </div>
  `;
}

// ── Module state ────────────────────────────────────────────────────────────

let moduleState = {
  testTrials: [],       // all 64 test trial results
  practiceTrials: [],   // practice trial results
  currentCategory: 'color',
  consecutiveCorrect: 0,
  categoriesCompleted: 0,
  completedCategoryInfo: [], // { dimension, cards_to_complete }
  categoryStartTrial: 0,
  ageGroup: '30-44',
  // runtime
  deck: [],
  currentTestCard: null,
  sessionId: null,
};

function resetModuleState() {
  moduleState = {
    testTrials: [],
    practiceTrials: [],
    currentCategory: 'color',
    consecutiveCorrect: 0,
    categoriesCompleted: 0,
    completedCategoryInfo: [],
    categoryStartTrial: 0,
    ageGroup: '30-44',
    deck: [],
    currentTestCard: null,
    sessionId: null,
  };
}

// ── jsPsych Plugin: wcst-key-response ───────────────────────────────────────

function registerWCSTPlugin(jsPsych) {
  if (jsPsych.plugins && jsPsych.plugins['wcst-key-response']) return;

  const plugin = {
    info: {
      name: 'wcst-key-response',
      parameters: {
        test_card:        { type: jsPsych.utils.ParameterType.OBJECT },
        current_category: { type: jsPsych.utils.ParameterType.STRING },
        trial_index:      { type: jsPsych.utils.ParameterType.INT },
        is_practice:     { type: jsPsych.utils.ParameterType.BOOL, default: false },
        timeout_ms:       { type: jsPsych.utils.ParameterType.INT, default: 5000 },
        category_start_trial: { type: jsPsych.utils.ParameterType.INT, default: 0 },
      },
    },

    trial: async function(displayElement, trial) {
      const {
        test_card: testCard,
        current_category: currentCategory,
        trial_index: trialIndex,
        is_practice = false,
        timeout_ms = 5000,
        category_start_trial: categoryStartTrial = 0,
      } = trial;

      const correctKey = getCorrectKey(currentCategory, testCard);

      // Feedback element (hidden initially)
      const feedbackHtml = `<div id="wcst-feedback" style="
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem; display: none; z-index: 10;"></div>`;

      displayElement.innerHTML = `
        <div class="wcst-container" style="
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 100vh; font-family: sans-serif; position: relative;">
          ${feedbackHtml}
          <div class="wcst-key-cards" style="
            display: grid; grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 16px; margin-bottom: 32px;">
            ${KEY_CARDS.map(kc => `
              <div class="wcst-key-card" data-key="${kc.key}" style="
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                padding: 12px; border: 3px solid #aaa;
                border-radius: 8px; background: #fafafa; cursor: default;">
                <div style="margin-bottom: 6px;">${renderCard(
                  { color: kc.color, shape: kc.shape, number: kc.number },
                  70
                )}</div>
                <div style="
                  background: #333; color: #fff;
                  padding: 2px 10px; border-radius: 4px;
                  font-weight: bold; font-size: 0.9rem;">${kc.key}</div>
              </div>
            `).join('')}
          </div>
          <div class="wcst-test-card" style="
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            margin-bottom: 24px;">
            <div style="margin-bottom: 8px; color: #666; font-size: 0.9rem;">
              Match by <strong>${currentCategory.toUpperCase()}</strong>
            </div>
            ${renderCard(testCard, 110)}
          </div>
          <div class="wcst-keys-legend" style="
            color: #888; font-size: 0.85rem; margin-top: 8px;">
            Press <strong>1</strong>=Top-Left &nbsp;
            <strong>2</strong>=Top-Right &nbsp;
            <strong>3</strong>=Bottom-Left &nbsp;
            <strong>4</strong>=Bottom-Right
          </div>
          <div id="wcst-timeout-msg" style="
            margin-top: 12px; color: #e74c3c; font-size: 0.9rem;
            display: none;">Time running out!</div>
        </div>
      `;

      const feedbackEl = displayElement.querySelector('#wcst-feedback');
      const timeoutMsg = displayElement.querySelector('#wcst-timeout-msg');

      const startTime = Date.now();
      let responded = false;
      let userKey = null;
      let rt = null;
      let timedOut = false;
      let timeoutWarningShown = false;

      const timeoutId = setTimeout(() => {
        if (!responded) {
          responded = true;
          timedOut = true;
          rt = timeout_ms;
          showFeedback(false);
          finishTrial();
        }
      }, timeout_ms);

      // Warning at 3 seconds
      const warningId = setTimeout(() => {
        if (!responded && timeoutMsg) {
          timeoutMsg.style.display = 'block';
        }
      }, 3000);

      const showFeedback = (correct) => {
        if (feedbackEl) {
          feedbackEl.textContent = correct ? '✓' : '✗';
          feedbackEl.style.color = correct ? '#27ae60' : '#e74c3c';
          feedbackEl.style.display = 'block';
        }
      };

      const finishTrial = () => {
        clearTimeout(timeoutId);
        clearTimeout(warningId);

        const correct = !timedOut && userKey === correctKey;

        const trialData = {
          module: 'wcst',
          trial_type: currentCategory, // 'color' | 'shape' | 'number'
          trial_index: trialIndex,
          is_practice: is_practice,
          current_category: currentCategory,
          categories_completed: moduleState.categoriesCompleted,
          correct,
          user_key: userKey,
          correct_key: correctKey,
          timed_out: timedOut,
          rt_ms: rt,
          test_card: testCard,
          start_time: startTime,
          is_perseverative_error: false, // filled in later
          is_non_perseverative_error: false,
          category_start_trial: categoryStartTrial,
        };

        if (is_practice) {
          moduleState.practiceTrials.push(trialData);
        } else {
          moduleState.testTrials.push(trialData);
        }

        jsPsych.finishTrial(trialData);
      };

      const handleKey = (info) => {
        if (responded) return;
        const key = String(info.key).replace(/['"]/g, '');
        if (!['1', '2', '3', '4'].includes(key)) return;
        responded = true;
        userKey = key;
        rt = Date.now() - startTime;
        showFeedback(userKey === correctKey);
        finishTrial();
      };

      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: handleKey,
        valid_responses: ['1', '2', '3', '4'],
        rt_method: 'performance',
        persist: false,
      });
    },
  };

  if (!jsPsych.plugins) jsPsych.plugins = {};
  jsPsych.plugins['wcst-key-response'] = plugin;
}

// ── Instruction Screens ────────────────────────────────────────────────────

function buildIntroTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Wisconsin Card Sorting Test</h2>
        <p class="interview-description">
          This test measures executive function and cognitive flexibility.
        </p>
        <div class="wcst-info" style="text-align:left; display:inline-block; line-height:2;">
          <p>• You will see a <strong>test card</strong> in the center.</p>
          <p>• Four <strong>key cards</strong> are shown above it.</p>
          <p>• Match the test card by <strong>one dimension</strong>:
            color, shape, or number.</p>
          <p>• After every <strong>10 correct</strong> matches, the rule changes
            — <strong>figure out the new rule!</strong></p>
        </div>
        <div class="wcst-key-layout" style="margin-top:1.5rem; display:grid; grid-template-columns:1fr 1fr; gap:8px; text-align:left; display:inline-block;">
          <div><strong>1</strong> = Top-Left</div>
          <div><strong>2</strong> = Top-Right</div>
          <div><strong>3</strong> = Bottom-Left</div>
          <div><strong>4</strong> = Bottom-Right</div>
        </div>
        <p style="margin-top:1.5rem; color:#e74c3c;">
          If you don't respond in <strong>5 seconds</strong>, it counts as an error.
        </p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'wcst', section: 'intro' },
    post_trial_gap: 500,
  };
}

function buildPracticeIntroTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>WCST — Practice</h2>
        <p>Let's try a few practice trials first.</p>
        <p>Match the test card by <strong>COLOR</strong> for these practice trials.</p>
        <p style="margin-top:1.5rem;">Press <strong>1</strong>=Top-Left &nbsp;
          <strong>2</strong>=Top-Right &nbsp;
          <strong>3</strong>=Bottom-Left &nbsp;
          <strong>4</strong>=Bottom-Right</p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'wcst', section: 'practice_intro' },
    post_trial_gap: 500,
  };
}

function buildPracticeFeedbackTrial() {
  return {
    type: 'html-keyboard-response',
    stimulus: '',
    choices: [' '],
    data: { module: 'wcst', section: 'practice_feedback' },
    on_start: (trial) => {
      const errors = moduleState.practiceTrials.filter(t => !t.correct).length;
      const passed = errors === 0;
      trial.stimulus = `
        <div class="focus-box">
          <h2>${passed ? '✅ Practice Passed' : '⚠️ Practice — Try Again'}</h2>
          <p>Errors: <strong>${errors}</strong></p>
          <p>${passed ? 'Great work! Now the real test begins.' : 'Try to match the COLOR correctly.'}</p>
          <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
        </div>
      `;
    },
    on_finish: () => {
      moduleState.practiceTrials = [];
    },
    post_trial_gap: 500,
  };
}

// ── Test card deck ──────────────────────────────────────────────────────────

function buildTestDeck() {
  // Generate and shuffle all 64 cards
  return shuffle(generateAllCards());
}

// ── Trial builders ───────────────────────────────────────────────────────────

/**
 * Build a single WCST test trial
 */
function buildWCSTTrial(jsPsych, trialIndex, isPractice = false) {
  const deck = isPractice ? null : moduleState.deck;

  if (!isPractice && deck.length === 0) return null; // deck exhausted

  const testCard = isPractice
    ? { color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        number: NUMBERS[Math.floor(Math.random() * NUMBERS.length)] }
    : drawCard(deck);

  if (!isPractice) {
    moduleState.deck = deck;
    moduleState.currentTestCard = testCard;
  }

  return {
    type: 'wcst-key-response',
    test_card: testCard,
    current_category: moduleState.currentCategory,
    trial_index: trialIndex,
    is_practice: isPractice,
    timeout_ms: RT_TIMEOUT_MS,
    category_start_trial: moduleState.categoryStartTrial,
    data: {
      module: 'wcst',
      trial_type: moduleState.currentCategory,
      is_practice: isPractice,
      trial_index: trialIndex,
    },
  };
}

/**
 * Build all 64 test trials, stopping early if all 3 categories completed
 */
function buildTestTrials(jsPsych) {
  const trials = [];
  let trialIndex = 0;

  // Initialize deck and tracking
  moduleState.deck = buildTestDeck();
  moduleState.currentCategory = 'color';
  moduleState.consecutiveCorrect = 0;
  moduleState.categoriesCompleted = 0;
  moduleState.completedCategoryInfo = [];
  moduleState.categoryStartTrial = 0;

  const categories = ['color', 'shape', 'number'];
  let currentCatIdx = 0;

  while (trialIndex < TOTAL_TEST_TRIALS && moduleState.deck.length > 0) {
    const testCard = drawCard(moduleState.deck);
    moduleState.currentTestCard = testCard;

    trials.push({
      type: 'wcst-key-response',
      test_card: testCard,
      current_category: categories[currentCatIdx],
      trial_index: trialIndex,
      is_practice: false,
      timeout_ms: RT_TIMEOUT_MS,
      category_start_trial: moduleState.categoryStartTrial,
      data: {
        module: 'wcst',
        trial_type: categories[currentCatIdx],
        is_practice: false,
        trial_index: trialIndex,
        current_category: categories[currentCatIdx],
      },
      on_finish: (trialData) => {
        // After trial data is recorded, check if we need to switch category
        const lastTrial = moduleState.testTrials[moduleState.testTrials.length - 1];
        if (!lastTrial) return;

        if (lastTrial.correct) {
          moduleState.consecutiveCorrect++;
          if (moduleState.consecutiveCorrect >= CONSECUTIVE_CORRECT_TO_SWITCH) {
            // Category complete!
            moduleState.completedCategoryInfo.push({
              dimension: categories[currentCatIdx],
              cards_to_complete: trialIndex - moduleState.categoryStartTrial + 1,
            });
            moduleState.categoriesCompleted++;
            currentCatIdx++;
            if (currentCatIdx < categories.length) {
              moduleState.currentCategory = categories[currentCatIdx];
              moduleState.consecutiveCorrect = 0;
              moduleState.categoryStartTrial = trialIndex + 1;
            }
          }
        } else {
          moduleState.consecutiveCorrect = 0;
        }
      },
    });

    trialIndex++;
  }

  return trials;
}

// ── Results screen ───────────────────────────────────────────────────────────

function buildResultsTrial() {
  return {
    type: 'html-button-response',
    stimulus: '',
    choices: ['Continue'],
    data: { module: 'wcst', section: 'results' },
    on_start: (trial) => {
      const scores = calculateWCSTScores(moduleState.testTrials, moduleState.ageGroup);
      const interp = interpretWCSTScore(scores.t_score);

      const catCards = (cat) =>
        moduleState.completedCategoryInfo
          .filter(c => c.dimension === cat)
          .map(c => c.cards_to_complete)
          .join(' / ') || '—';

      trial.stimulus = `
        <div class="focus-box" style="max-width: 600px;">
          <h2>WCST Results</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align:left;">
            <div style="border: 1px solid #ddd; padding: 12px; border-radius: 8px;">
              <h3>Overall</h3>
              <p><strong>Categories Completed:</strong> ${scores.categories_completed} / 3</p>
              <p><strong>Total Trials:</strong> ${scores.total_trials}</p>
              <p><strong>Total Errors:</strong> ${scores.total_errors}</p>
              <p><strong>% Correct:</strong> ${scores.percent_correct}%</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 12px; border-radius: 8px;">
              <h3>Errors</h3>
              <p><strong>Perseverative:</strong> ${scores.perseverative_errors}</p>
              <p><strong>Non-Perseverative:</strong> ${scores.non_perseverative_errors}</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 12px; border-radius: 8px;">
              <h3>Speed</h3>
              <p><strong>Mean RT:</strong> ${scores.mean_rt_ms} ms</p>
            </div>
            <div style="border: 1px solid #ddd; padding: 12px; border-radius: 8px;">
              <h3>T-Score</h3>
              <p><strong>${scores.t_score}</strong></p>
              <p><em>${interp.level}</em></p>
            </div>
          </div>
          <div style="margin-top: 16px; text-align: left; border: 1px solid #ddd; padding: 12px; border-radius: 8px;">
            <h3>Categories</h3>
            <p><strong>Color:</strong> ${catCards('color')}</p>
            <p><strong>Shape:</strong> ${catCards('shape')}</p>
            <p><strong>Number:</strong> ${catCards('number')}</p>
          </div>
        </div>
      `;
    },
    post_trial_gap: 500,
  };
}

// ── Main timeline builder ───────────────────────────────────────────────────

/**
 * Build the complete WCST timeline
 * @param {Object} jsPsych — jsPsych instance
 * @param {string|null} sessionId — Session ID for storage
 * @param {string} ageGroup — Age group for T-score norms (default: '30-44')
 * @returns {Array} Timeline array
 */
export function buildWCSTTimeline(jsPsych, sessionId = null, ageGroup = '30-44') {
  registerWCSTPlugin(jsPsych);
  resetModuleState();
  moduleState.ageGroup = ageGroup;
  moduleState.sessionId = sessionId;

  const timeline = [];

  // Intro
  timeline.push(buildIntroTrial());

  // Practice intro (practice uses COLOR category)
  timeline.push(buildPracticeIntroTrial());

  // 3 practice trials (always color)
  for (let i = 0; i < PRACTICE_TRIALS; i++) {
    const testCard = {
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      number: NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
    };
    timeline.push({
      type: 'wcst-key-response',
      test_card: testCard,
      current_category: 'color',
      trial_index: i,
      is_practice: true,
      timeout_ms: RT_TIMEOUT_MS,
      category_start_trial: 0,
      data: { module: 'wcst', trial_type: 'color', is_practice: true, trial_index: i },
    });
  }

  // Practice feedback
  timeline.push(buildPracticeFeedbackTrial());

  // Test block — 64 trials
  const testTrials = buildTestTrials(jsPsych);
  timeline.push(...testTrials);

  // Results
  timeline.push(buildResultsTrial());

  return timeline;
}

/**
 * Aggregate WCST results for storage
 * Uses moduleState directly so on_finish category tracking is available.
 */
export function aggregateWCSTResults(data, ageGroup = '30-44') {
  // Use module state for complete picture including category tracking
  const trials = moduleState.testTrials;
  const scores = calculateWCSTScores(trials, ageGroup);
  const interp = interpretWCSTScores(scores);

  // Enrich scores with category completion data from moduleState
  scores.categories_completed = moduleState.categoriesCompleted;
  scores.completed_categories = moduleState.completedCategoryInfo.map(c => ({
    dimension: c.dimension,
    cards_to_complete: c.cards_to_complete,
  }));

  return {
    ...scores,
    interpretation: interp.level,
    metadata: {
      completed_at: new Date().toISOString(),
      age_group: ageGroup,
    },
  };
}

export { calculateWCSTScores, interpretWCSTScore };
