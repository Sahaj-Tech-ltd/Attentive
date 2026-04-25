/**
 * D-KEFS Verbal Fluency Module
 *
 * Implements the Delis-Kaplan Executive Function System (D-KEFS) Verbal Fluency subtests:
 * - Letter Fluency: F, A, S (60s each)
 * - Category Fluency: Animals, Fruits (60s each)
 *
 * @see SPEC-DKEFS.md for full specification
 */

const SESSION_STORAGE_KEY = 'dkefs_progress_';

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------

const CONFIG = {
  trialDuration: 60000,       // 60 seconds per subtest in ms
  restDuration: 20000,        // 20 seconds rest between trials
  warningThreshold1: 10000,   // 10 seconds - amber warning
  warningThreshold2: 5000,   // 5 seconds - red warning
  minWordLength: 0,           // 0 means any non-empty word
  maxWordsPerList: 200,       // Safety cap
};

// Subtest definitions
const SUBTESTS = [
  {
    id: 'F',
    label: 'Letter F',
    instruction: 'Say as many words as you can that start with the letter <strong>F</strong>.<br>Do not say the same word twice.<br>Do not say names (first names, last names, places) or numbers.',
    type: 'letter',
    letter: 'f',
  },
  {
    id: 'A',
    label: 'Letter A',
    instruction: 'Say as many words as you can that start with the letter <strong>A</strong>.<br>Do not say the same word twice.<br>Do not say names (first names, last names, places) or numbers.',
    type: 'letter',
    letter: 'a',
  },
  {
    id: 'S',
    label: 'Letter S',
    instruction: 'Say as many words as you can that start with the letter <strong>S</strong>.<br>Do not say the same word twice.<br>Do not say names (first names, last names, places) or numbers.',
    type: 'letter',
    letter: 's',
  },
  {
    id: 'animals',
    label: 'Animals',
    instruction: 'Name as many animals as you can.<br>You may say any animal — real, imaginary, or fictional.',
    type: 'category',
    category: 'animals',
  },
  {
    id: 'fruits',
    label: 'Fruits',
    instruction: 'Name as many fruits as you can.',
    type: 'category',
    category: 'fruits',
  },
];

// ---------------------------------------------------------------------
// Session Storage Helpers
// ---------------------------------------------------------------------

function saveProgress(sessionId, progressData) {
  const key = `${SESSION_STORAGE_KEY}${sessionId}`;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      ...progressData,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // sessionStorage not available
  }
}

function loadProgress(sessionId) {
  const key = `${SESSION_STORAGE_KEY}${sessionId}`;
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function clearProgress(sessionId) {
  const key = `${SESSION_STORAGE_KEY}${sessionId}`;
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    // sessionStorage not available
  }
}

// ---------------------------------------------------------------------
// Word Utilities
// ---------------------------------------------------------------------

/**
 * Normalize word for duplicate checking (lowercase, trimmed)
 */
function normalizeWord(word) {
  return word.trim().toLowerCase();
}

/**
 * Check if word is valid (non-empty after trim)
 */
function isValidWord(word) {
  return word.trim().length > 0;
}

/**
 * Check if a word starts with a given letter
 */
function startsWithLetter(word, letter) {
  return normalizeWord(word).startsWith(letter);
}

// ---------------------------------------------------------------------
// Build D-KEFS Verbal Fluency Timeline
// ---------------------------------------------------------------------

/**
 * Build the full D-KEFS Verbal Fluency timeline
 * @param {object} jsPsych - jsPsych instance
 * @param {string|null} sessionId - Session ID for storage
 * @returns {Array} jsPsych timeline array
 */
export function buildDKEFSVerbalFluencyTimeline(jsPsych, sessionId = null) {
  const timeline = [];

  // --- Intro Screen ---
  timeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box" style="max-width: 700px; text-align: left;">
        <h2>D-KEFS Verbal Fluency</h2>
        <p>This assessment measures how quickly you can produce words.</p>
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #444;">
        <h3>Instructions</h3>
        <p>You will complete <strong>5 verbal fluency trials</strong>:</p>
        <ul style="line-height: 2; margin: 0.5rem 0;">
          <li><strong>Letters F, A, S</strong> — name as many words starting with each letter</li>
          <li><strong>Animals</strong> — name as many animals as you can</li>
          <li><strong>Fruits</strong> — name as many fruits as you can</li>
        </ul>
        <p>Each trial lasts <strong>60 seconds</strong>. You will see a timer on screen.</p>
        <p style="margin-top: 1rem;">Type each word and press <strong>Enter</strong> to submit.</p>
        <p class="dkefs-duplicate-note" style="color: #888; font-size: 0.9rem; margin-top: 0.5rem;">
          Note: Repeated words (same word said twice) will not be counted.
        </p>
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #444;">
        <p style="text-align: center; margin-top: 1.5rem;">
          Press <strong>SPACE</strong> to begin
        </p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
    data: { module: 'dkefs_verbal_fluency', trial_type: 'intro' },
  });

  // --- Build each subtest trial with rest screens ---
  let completedSubtests = [];

  // Load progress if resuming
  if (sessionId) {
    const saved = loadProgress(sessionId);
    if (saved && saved.completedSubtests) {
      completedSubtests = saved.completedSubtests;
    }
  }

  SUBTESTS.forEach((subtest, index) => {
    // Check if already completed (resume support)
    if (completedSubtests.includes(subtest.id)) {
      return; // Skip already completed
    }

    // Subtest trial (60s)
    timeline.push(buildFluencyTrial(jsPsych, subtest, sessionId, index));

    // Rest screen (except after last subtest)
    if (index < SUBTESTS.length - 1) {
      timeline.push(buildRestScreen(jsPsych, sessionId, index, completedSubtests));
    }
  });

  // --- Completion Screen ---
  timeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Verbal Fluency Complete</h2>
        <p>You have finished all five fluency trials.</p>
        <p style="margin-top: 1rem; color: #888; font-size: 0.9rem;">
          Your responses have been saved.
        </p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
      </div>
    `,
    choices: [' '],
    data: { module: 'dkefs_verbal_fluency', trial_type: 'complete' },
  });

  return timeline;
}

/**
 * Build a single fluency trial (60s word-entry)
 */
function buildFluencyTrial(jsPsych, subtest, sessionId, subtestIndex) {
  return {
    type: 'html-keyboard-response',
    stimulus: buildFluencyStimulus(subtest),
    choices: [], // No keyboard choices - handled manually
    trial_duration: CONFIG.trialDuration + 500, // Extra 500ms buffer for cleanup
    show_progress_bar: false,
    data: { module: 'dkefs_verbal_fluency', subtest: subtest.id, trial_type: 'fluency' },
    on_start: (trial) => {
      // Initialize trial state when trial starts
      const container = document.querySelector('#dkefs-fluency-container');
      if (container) {
        initFluencyTrial(container, subtest, sessionId);
      }
    },
    on_load: (trial) => {
      // Ensure input is focused after load
      const input = document.querySelector('#dkefs-word-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    },
  };
}

/**
 * Build the fluency trial HTML
 */
function buildFluencyStimulus(subtest) {
  return `
    <div id="dkefs-fluency-container" class="dkefs-fluency-container">
      <div class="dkefs-header">
        <div class="dkefs-subtest-label">${subtest.label}</div>
        <div id="dkefs-timer" class="dkefs-timer">1:00</div>
      </div>
      <div class="dkefs-instruction">${subtest.instruction}</div>
      <div class="dkefs-input-area">
        <input
          type="text"
          id="dkefs-word-input"
          class="dkefs-word-input"
          placeholder="Type a word and press Enter..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <button id="dkefs-submit-btn" class="dkefs-submit-btn">Enter</button>
      </div>
      <div id="dkefs-feedback" class="dkefs-feedback" aria-live="polite"></div>
      <div class="dkefs-word-count">
        <span id="dkefs-count">0</span> words
      </div>
      <div id="dkefs-word-list" class="dkefs-word-list"></div>
    </div>

    <style>
      .dkefs-fluency-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
        box-sizing: border-box;
      }

      .dkefs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .dkefs-subtest-label {
        font-size: 1.5rem;
        font-weight: 600;
        color: #fff;
      }

      .dkefs-timer {
        font-size: 2.5rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: #27ae60;
        background: rgba(255,255,255,0.1);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        min-width: 100px;
        text-align: center;
      }

      .dkefs-timer.warning-1 { color: #f39c12; }
      .dkefs-timer.warning-2 { color: #e74c3c; }

      .dkefs-instruction {
        color: #ccc;
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
      }

      .dkefs-input-area {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .dkefs-word-input {
        flex: 1;
        padding: 1rem 1.25rem;
        font-size: 1.25rem;
        border: 2px solid #444;
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: #fff;
        outline: none;
        transition: border-color 0.2s;
      }

      .dkefs-word-input:focus {
        border-color: #27ae60;
      }

      .dkefs-word-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .dkefs-submit-btn {
        padding: 1rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        background: #27ae60;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .dkefs-submit-btn:hover {
        background: #219a52;
      }

      .dkefs-submit-btn:disabled {
        background: #555;
        cursor: not-allowed;
      }

      .dkefs-feedback {
        min-height: 1.5rem;
        font-size: 0.9rem;
        margin-bottom: 1rem;
        color: #e74c3c;
        text-align: center;
      }

      .dkefs-feedback.duplicate {
        color: #f39c12;
      }

      .dkefs-word-count {
        font-size: 1.1rem;
        color: #888;
        margin-bottom: 1rem;
      }

      .dkefs-word-count span {
        font-size: 1.5rem;
        font-weight: 700;
        color: #27ae60;
      }

      .dkefs-word-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
      }

      .dkefs-word-tag {
        background: rgba(39, 174, 96, 0.2);
        color: #27ae60;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .dkefs-duplicate-note {
        font-style: italic;
      }
    </style>
  `;
}

/**
 * Initialize the fluency trial logic
 */
function initFluencyTrial(container, subtest, sessionId) {
  const timerEl = document.getElementById('dkefs-timer');
  const inputEl = document.getElementById('dkefs-word-input');
  const submitBtn = document.getElementById('dkefs-submit-btn');
  const feedbackEl = document.getElementById('dkefs-feedback');
  const countEl = document.getElementById('dkefs-count');
  const wordListEl = document.getElementById('dkefs-word-list');

  let words = [];
  let startTime = Date.now();
  let remainingMs = CONFIG.trialDuration;
  let timerInterval = null;
  let isFinished = false;

  // Word submission handler
  function submitWord() {
    if (isFinished) return;

    const rawWord = inputEl.value;
    const word = rawWord.trim();

    // Validation
    if (!isValidWord(word)) {
      return;
    }

    const normalized = normalizeWord(word);

    // Check for duplicates
    if (words.includes(normalized)) {
      feedbackEl.textContent = 'Already said — try another word';
      feedbackEl.className = 'dkefs-feedback duplicate';
      inputEl.value = '';
      setTimeout(() => {
        if (feedbackEl.textContent === 'Already said — try another word') {
          feedbackEl.textContent = '';
          feedbackEl.className = 'dkefs-feedback';
        }
      }, 1500);
      return;
    }

    // Letter fluency: check first letter
    if (subtest.type === 'letter') {
      if (!startsWithLetter(word, subtest.letter)) {
        feedbackEl.textContent = `Word must start with "${subtest.letter.toUpperCase()}"`;
        feedbackEl.className = 'dkefs-feedback duplicate';
        inputEl.value = '';
        setTimeout(() => {
          if (feedbackEl.textContent === `Word must start with "${subtest.letter.toUpperCase()}"`) {
            feedbackEl.textContent = '';
            feedbackEl.className = 'dkefs-feedback';
          }
        }, 1500);
        return;
      }
    }

    // Add word
    words.push(normalized);
    countEl.textContent = words.length;

    // Add to word list
    const tag = document.createElement('span');
    tag.className = 'dkefs-word-tag';
    tag.textContent = word;
    wordListEl.appendChild(tag);

    // Scroll to bottom of word list
    wordListEl.scrollTop = wordListEl.scrollHeight;

    // Clear input
    inputEl.value = '';
    feedbackEl.textContent = '';
    feedbackEl.className = 'dkefs-feedback';

    // Focus input again
    inputEl.focus();
  }

  // Submit on button click
  submitBtn.addEventListener('click', submitWord);

  // Submit on Enter key
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitWord();
    }
  });

  // Timer countdown
  function updateTimer() {
    const elapsed = Date.now() - startTime;
    remainingMs = CONFIG.trialDuration - elapsed;

    if (remainingMs <= 0) {
      remainingMs = 0;
      timerEl.textContent = '0:00';
      finishTrial();
      return;
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Warning colors
    if (remainingMs <= CONFIG.warningThreshold2) {
      timerEl.className = 'dkefs-timer warning-2';
    } else if (remainingMs <= CONFIG.warningThreshold1) {
      timerEl.className = 'dkefs-timer warning-1';
    } else {
      timerEl.className = 'dkefs-timer';
    }
  }

  function finishTrial() {
    if (isFinished) return;
    isFinished = true;

    clearInterval(timerInterval);

    // Disable input
    inputEl.disabled = true;
    submitBtn.disabled = true;

    // Show time's up
    feedbackEl.textContent = "Time's up!";
    feedbackEl.className = 'dkefs-feedback';

    // Save trial data to jsPsych data
    const trialData = {
      module: 'dkefs_verbal_fluency',
      subtest: subtest.id,
      word_count: words.length,
      words: [...words],
      errors: 0, // Could track invalid entries here
      duration_ms: CONFIG.trialDuration,
      response_times_ms: [], // Per-word RTs could be tracked here
    };

    // Store in sessionStorage for progress
    if (sessionId) {
      const key = `dkefs_trial_${subtest.id}_${sessionId}`;
      try {
        sessionStorage.setItem(key, JSON.stringify(trialData));
      } catch (e) { }
    }

    // Add data to jsPsych's data collection
    jsPsych.data.get().push(trialData);

    // Save progress
    if (sessionId) {
      const saved = loadProgress(sessionId) || { completedSubtests: [] };
      if (!saved.completedSubtests.includes(subtest.id)) {
        saved.completedSubtests.push(subtest.id);
      }
      saveProgress(sessionId, saved);
    }

    // Advance after a short delay
    setTimeout(() => {
      jsPsych.endCurrentTimeline();
    }, 1000);
  }

  // Start timer
  updateTimer();
  timerInterval = setInterval(updateTimer, 100);
}

/**
 * Build rest screen between trials
 */
function buildRestScreen(jsPsych, sessionId, currentIndex, completedSubtests) {
  const nextSubtest = SUBTESTS[currentIndex + 1];

  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Rest</h2>
        <p>Take a short break.</p>
        <p style="margin-top: 1rem; color: #888;">
          Next: <strong>${nextSubtest.label}</strong>
        </p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
    data: { module: 'dkefs_verbal_fluency', trial_type: 'rest', next_subtest: nextSubtest.id },
  };
}

// ---------------------------------------------------------------------
// Aggregation (for main.js to collect results)
// ---------------------------------------------------------------------

/**
 * Aggregate D-KEFS Verbal Fluency results from jsPsych data
 * @param {Array} data - jsPsych data array
 * @returns {object} Aggregated results
 */
export function aggregateDKEFSResults(data) {
  const fluencyTrials = data.filter(d => d.module === 'dkefs_verbal_fluency' && d.trial_type === 'fluency');

  const letterFluency = { F: null, A: null, S: null };
  const categoryFluency = { animals: null, fruits: null };

  fluencyTrials.forEach(t => {
    const result = {
      words: t.words || [],
      count: t.word_count || 0,
      duration_ms: t.duration_ms || 60000,
      errors: t.errors || 0,
    };

    if (['F', 'A', 'S'].includes(t.subtest)) {
      letterFluency[t.subtest] = result;
    } else if (t.subtest === 'animals' || t.subtest === 'fruits') {
      categoryFluency[t.subtest] = result;
    }
  });

  const fasTotal = (letterFluency.F?.count || 0) + (letterFluency.A?.count || 0) + (letterFluency.S?.count || 0);
  const categoryTotal = (categoryFluency.animals?.count || 0) + (categoryFluency.fruits?.count || 0);

  return {
    letter_fluency: {
      ...letterFluency,
      total_fas: fasTotal,
    },
    category_fluency: {
      ...categoryFluency,
      total_category: categoryTotal,
    },
    summary: {
      total_words: fasTotal + categoryTotal,
      combined_fas_score: fasTotal,
      combined_category_score: categoryTotal,
      combined_total: fasTotal + categoryTotal,
    },
    metadata: {
      subtests_order: ['F', 'A', 'S', 'animals', 'fruits'],
    },
  };
}

/**
 * Get D-KEFS results from sessionStorage (used by main.js on_finish)
 * @param {string} sessionId
 * @returns {object|null}
 */
export function getDKEFSResults(sessionId) {
  const results = {};
  SUBTESTS.forEach(st => {
    const key = `dkefs_trial_${st.id}_${sessionId}`;
    try {
      const data = sessionStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        results[st.id] = parsed;
      }
    } catch (e) { }
  });
  return Object.keys(results).length > 0 ? results : null;
}