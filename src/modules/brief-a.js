/**
 * BRIEF-A Module (Behavior Rating Inventory of Executive Function – Adult)
 *
 * 87 items across 9 clinical scales. Each item rated 0–3:
 * 0 = Never, 1 = Sometimes, 2 = Often, 3 = Very Often
 *
 * Scales: INH(10), SFT(10), EMC(10), SMO(9), POG(10), TSK(9), OMA(10), WKM(9), INI(10)
 * Indices: BRI (INH+SFT+EMC+SMO), MI (POG+TSK+OMA+WKM+INI), GEC (BRI+MI)
 *
 * One item per screen with scale name displayed.
 * Progress saved to sessionStorage on each response.
 *
 * @see SPEC-Brief-A.md
 */

import {
  aggregateBriefAResults as scoreBriefAResponses,
  interpretScore,
} from '../scoring/brief-a.js';

const SESSION_STORAGE_KEY = 'brief_a_progress_';

// ---------------------------------------------------------------------
// Item Definitions — all 87 items verbatim from BRIEF-A
// ---------------------------------------------------------------------

const ITEMS = [
  // Inhibit (10 items) — inh_q1–inh_q10
  { id: 'inh_q1',  scale: 'INH', text: 'I have trouble controlling my impulses.' },
  { id: 'inh_q2',  scale: 'INH', text: 'I say things without thinking about the consequences.' },
  { id: 'inh_q3',  scale: 'INH', text: 'I do things that embarrass my friends or family.' },
  { id: 'inh_q4',  scale: 'INH', text: 'I interrupt people when they are talking.' },
  { id: 'inh_q5',  scale: 'INH', text: 'I have difficulty waiting for my turn in games or activities.' },
  { id: 'inh_q6',  scale: 'INH', text: 'I act too wild or "out of control."' },
  { id: 'inh_q7',  scale: 'INH', text: 'I have trouble stopping an activity even when I know I should.' },
  { id: 'inh_q8',  scale: 'INH', text: 'I interrupt others\' activities or conversations.' },
  { id: 'inh_q9',  scale: 'INH', text: 'I do not think before acting.' },
  { id: 'inh_q10', scale: 'INH', text: 'I grab things away from others.' },

  // Shift (10 items) — sft_q1–sft_q10
  { id: 'sft_q1',  scale: 'SFT', text: 'I get stuck on one topic or activity and cannot move on.' },
  { id: 'sft_q2',  scale: 'SFT', text: 'I have difficulty switching from one activity to another.' },
  { id: 'sft_q3',  scale: 'SFT', text: 'When tasks become challenging, I give up easily.' },
  { id: 'sft_q4',  scale: 'SFT', text: 'I have trouble changing the topic of conversation.' },
  { id: 'sft_q5',  scale: 'SFT', text: 'I resist changes to my routine or schedule.' },
  { id: 'sft_q6',  scale: 'SFT', text: 'I have difficulty adjusting to new situations.' },
  { id: 'sft_q7',  scale: 'SFT', text: 'I get confused when the rules for an activity change.' },
  { id: 'sft_q8',  scale: 'SFT', text: 'I prefer familiar tasks over new ones.' },
  { id: 'sft_q9',  scale: 'SFT', text: 'I have difficulty changing plans when something unexpected happens.' },
  { id: 'sft_q10', scale: 'SFT', text: 'I get stuck thinking about one thing and cannot let it go.' },

  // Emotional Control (10 items) — emc_q1–emc_q10
  { id: 'emc_q1',  scale: 'EMC', text: 'My emotions get out of control easily.' },
  { id: 'emc_q2',  scale: 'EMC', text: 'I have mood swings that are noticeable to others.' },
  { id: 'emc_q3',  scale: 'EMC', text: 'I get upset and cannot calm down quickly.' },
  { id: 'emc_q4',  scale: 'EMC', text: 'I get frustrated when tasks are too difficult.' },
  { id: 'emc_q5',  scale: 'EMC', text: 'My emotions change quickly from one to another.' },
  { id: 'emc_q6',  scale: 'EMC', text: 'I become overwhelmed by my feelings.' },
  { id: 'emc_q7',  scale: 'EMC', text: 'I have difficulty dealing with minor setbacks.' },
  { id: 'emc_q8',  scale: 'EMC', text: 'My tearfulness or anger surprises others.' },
  { id: 'emc_q9',  scale: 'EMC', text: 'I have trouble managing stress.' },
  { id: 'emc_q10', scale: 'EMC', text: 'I lose my temper over small things.' },

  // Self-Monitor (9 items) — smo_q1–smo_q9
  { id: 'smo_q1',  scale: 'SMO', text: 'People tell me I am not aware of how my behavior affects others.' },
  { id: 'smo_q2',  scale: 'SMO', text: 'I do not realize how my behavior impacts the people around me.' },
  { id: 'smo_q3',  scale: 'SMO', text: 'I overlook social cues that others notice.' },
  { id: 'smo_q4',  scale: 'SMO', text: 'I am unaware of how others perceive me.' },
  { id: 'smo_q5',  scale: 'SMO', text: 'I have difficulty understanding how my actions affect others.' },
  { id: 'smo_q6',  scale: 'SMO', text: 'I say or do things that are socially inappropriate without noticing.' },
  { id: 'smo_q7',  scale: 'SMO', text: 'I do not notice when others are upset or uncomfortable.' },
  { id: 'smo_q8',  scale: 'SMO', text: 'I misread social situations and respond incorrectly.' },
  { id: 'smo_q9',  scale: 'SMO', text: 'I need others to tell me how I come across in social situations.' },

  // Plan/Organize (10 items) — pog_q1–pog_q10
  { id: 'pog_q1',  scale: 'POG', text: 'I have difficulty organizing my tasks or activities.' },
  { id: 'pog_q2',  scale: 'POG', text: 'I start tasks without thinking through all the steps.' },
  { id: 'pog_q3',  scale: 'POG', text: 'I have trouble planning ahead for projects or activities.' },
  { id: 'pog_q4',  scale: 'POG', text: 'I put things off until the last minute.' },
  { id: 'pog_q5',  scale: 'POG', text: 'My work is messy and disorganized.' },
  { id: 'pog_q6',  scale: 'POG', text: 'I have difficulty breaking large tasks into smaller steps.' },
  { id: 'pog_q7',  scale: 'POG', text: 'I miss deadlines because I under-estimate how long things take.' },
  { id: 'pog_q8',  scale: 'POG', text: 'I have trouble knowing what to prioritize.' },
  { id: 'pog_q9',  scale: 'POG', text: 'I do not anticipate problems before they occur.' },
  { id: 'pog_q10', scale: 'POG', text: 'My approach to tasks is disorganized and inefficient.' },

  // Task-Monitor (9 items) — tsk_q1–tsk_q9
  { id: 'tsk_q1',  scale: 'TSK', text: 'I have difficulty checking my work for mistakes.' },
  { id: 'tsk_q2',  scale: 'TSK', text: 'I do not review my work before submitting it.' },
  { id: 'tsk_q3',  scale: 'TSK', text: 'I miss important details in my work.' },
  { id: 'tsk_q4',  scale: 'TSK', text: 'I do not notice when I make errors in my tasks.' },
  { id: 'tsk_q5',  scale: 'TSK', text: 'I have trouble tracking multiple steps in a process.' },
  { id: 'tsk_q6',  scale: 'TSK', text: 'I get distracted and lose track of what I was doing.' },
  { id: 'tsk_q7',  scale: 'TSK', text: 'I need to have things repeated because I was not paying attention.' },
  { id: 'tsk_q8',  scale: 'TSK', text: 'I overlook changes in my environment or situation.' },
  { id: 'tsk_q9',  scale: 'TSK', text: 'I have difficulty staying focused on a task until it is complete.' },

  // Organization of Materials (10 items) — oma_q1–oma_q10
  { id: 'oma_q1',  scale: 'OMA', text: 'My workspace is messy and disorganized.' },
  { id: 'oma_q2',  scale: 'OMA', text: 'I have difficulty finding things when I need them.' },
  { id: 'oma_q3',  scale: 'OMA', text: 'I lose track of important papers and documents.' },
  { id: 'oma_q4',  scale: 'OMA', text: 'I forget where I put things.' },
  { id: 'oma_q5',  scale: 'OMA', text: 'My belongings are in disarray.' },
  { id: 'oma_q6',  scale: 'OMA', text: 'I have trouble keeping track of items I need.' },
  { id: 'oma_q7',  scale: 'OMA', text: 'My study or work area is chaotic.' },
  { id: 'oma_q8',  scale: 'OMA', text: 'I spend a lot of time looking for things.' },
  { id: 'oma_q9',  scale: 'OMA', text: 'I misplace important items (wallet, keys, phone, etc.).' },
  { id: 'oma_q10', scale: 'OMA', text: 'I have difficulty maintaining an organized system for my belongings.' },

  // Working Memory (9 items) — wkm_q1–wkm_q9
  { id: 'wkm_q1',  scale: 'WKM', text: 'I have trouble holding information in my mind while doing something.' },
  { id: 'wkm_q2',  scale: 'WKM', text: 'I forget what I was just about to say.' },
  { id: 'wkm_q3',  scale: 'WKM', text: 'I lose my place in conversations or instructions.' },
  { id: 'wkm_q4',  scale: 'WKM', text: 'I forget to follow through on things I was supposed to do.' },
  { id: 'wkm_q5',  scale: 'WKM', text: 'I have difficulty keeping track of what I am doing.' },
  { id: 'wkm_q6',  scale: 'WKM', text: 'I need to re-read information to understand it.' },
  { id: 'wkm_q7',  scale: 'WKM', text: 'I forget what I was doing in the middle of a task.' },
  { id: 'wkm_q8',  scale: 'WKM', text: 'I have trouble with multi-step instructions.' },
  { id: 'wkm_q9',  scale: 'WKM', text: 'I start something and then forget what I intended to do.' },

  // Initiate (10 items) — ini_q1–ini_q10
  { id: 'ini_q1',  scale: 'INI', text: 'I have trouble getting started on tasks or activities.' },
  { id: 'ini_q2',  scale: 'INI', text: 'I procrastinate and put things off.' },
  { id: 'ini_q3',  scale: 'INI', text: 'I need others to push me to get started.' },
  { id: 'ini_q4',  scale: 'INI', text: 'I delay starting tasks because they seem overwhelming.' },
  { id: 'ini_q5',  scale: 'INI', text: 'I have difficulty beginning projects or assignments.' },
  { id: 'ini_q6',  scale: 'INI', text: 'I wait until the last minute to start things.' },
  { id: 'ini_q7',  scale: 'INI', text: 'I do not take initiative even on tasks I am able to do.' },
  { id: 'ini_q8',  scale: 'INI', text: 'I need prompting to begin tasks that are not immediately interesting.' },
  { id: 'ini_q9',  scale: 'INI', text: 'I have difficulty getting myself to do things without external pressure.' },
  { id: 'ini_q10', scale: 'INI', text: 'I miss opportunities because I do not act in time.' },
];

const SCALE_NAMES = {
  INH: 'Inhibit',
  SFT: 'Shift',
  EMC: 'Emotional Control',
  SMO: 'Self-Monitor',
  POG: 'Plan/Organize',
  TSK: 'Task-Monitor',
  OMA: 'Organization of Materials',
  WKM: 'Working Memory',
  INI: 'Initiate',
};

const LIKERT_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Often' },
  { value: 3, label: 'Very Often' },
];

// ---------------------------------------------------------------------
// Session Storage
// ---------------------------------------------------------------------

function saveProgress(sessionId, responses, currentIndex) {
  const key = `${SESSION_STORAGE_KEY}${sessionId}`;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      responses,
      currentIndex,
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
// HTML Builders
// ---------------------------------------------------------------------

function buildItemHTML(item, itemIndex, totalItems, savedValue, scaleLabel) {
  const progressPct = Math.round(((itemIndex + 1) / totalItems) * 100);
  const qNum = itemIndex + 1;

  return `
    <div class="briefa-screen">
      <div class="briefa-header">
        <div class="briefa-scale-label">${scaleLabel}</div>
        <div class="briefa-progress-bar">
          <div class="briefa-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="briefa-progress-text">${qNum} / ${totalItems}</div>
      </div>
      <div class="briefa-question">
        <div class="briefa-q-text">${item.text}</div>
        <div class="briefa-options">
          ${LIKERT_OPTIONS.map(opt => `
            <button class="briefa-option-btn ${savedValue === opt.value ? 'selected' : ''}"
                    data-value="${opt.value}"
                    data-question="${item.id}"
                    type="button">
              <span class="briefa-option-score">${opt.value}</span>
              <span class="briefa-option-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    <style>
      .briefa-screen {
        max-width: 680px;
        margin: 0 auto;
        padding: 1.5rem 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .briefa-header {
        margin-bottom: 2rem;
      }
      .briefa-scale-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #4ecdc4;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }
      .briefa-progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.25rem;
      }
      .briefa-progress-fill {
        height: 100%;
        background: #4ecdc4;
        transition: width 0.3s ease;
      }
      .briefa-progress-text {
        font-size: 0.85rem;
        color: #888;
        text-align: right;
      }
      .briefa-question {
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .briefa-q-text {
        font-size: 1.15rem;
        color: #fff;
        line-height: 1.6;
        margin-bottom: 1.5rem;
        font-weight: 500;
      }
      .briefa-options {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
      }
      @media (max-width: 500px) {
        .briefa-options { grid-template-columns: repeat(2, 1fr); }
      }
      .briefa-option-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem 0.5rem;
        background: rgba(255,255,255,0.05);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        color: #ccc;
        font-size: 0.85rem;
        transition: all 0.15s ease;
        gap: 0.4rem;
      }
      .briefa-option-btn:hover {
        background: rgba(78,205,196,0.1);
        border-color: rgba(78,205,196,0.3);
        color: #fff;
      }
      .briefa-option-btn.selected {
        background: rgba(78,205,196,0.2);
        border-color: #4ecdc4;
        color: #fff;
      }
      .briefa-option-score {
        font-size: 1.2rem;
        font-weight: 700;
        color: #4ecdc4;
      }
      .briefa-option-label {
        font-size: 0.8rem;
        color: #aaa;
        text-align: center;
      }
      .briefa-option-btn.selected .briefa-option-label {
        color: #fff;
      }
    </style>
  `;
}

function buildIntroScreen() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="briefa-intro focus-box">
        <h2>BRIEF-A</h2>
        <p>Behavior Rating Inventory of Executive Function – Adult</p>
        <div class="briefa-info-cards">
          <div class="briefa-info-card">
            <h3>87 Questions</h3>
            <p>Across 9 clinical scales assessing executive function</p>
          </div>
          <div class="briefa-info-card">
            <h3>How to Respond</h3>
            <p>Rate each statement: Never / Sometimes / Often / Very Often</p>
          </div>
          <div class="briefa-info-card">
            <h3>Your Responses</h3>
            <p>Think about how you typically behave — not just recently or in one situation.</p>
          </div>
        </div>
        <p style="margin-top: 1.5rem;">Press <strong>SPACE</strong> to begin</p>
      </div>
      <style>
        .briefa-info-cards {
          display: flex;
          gap: 1rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }
        .briefa-info-card {
          flex: 1;
          min-width: 160px;
          background: rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
        }
        .briefa-info-card h3 { margin-top: 0; color: #4ecdc4; font-size: 1rem; }
        .briefa-info-card p { margin: 0.5rem 0 0; font-size: 0.85rem; color: #ccc; line-height: 1.5; }
      </style>
    `,
    choices: [' '],
    data: { module: 'brief_a', trial_type: 'intro' },
  };
}

function buildCompletionScreen(jsPsych, results) {
  const { scales, indices } = results;

  const scaleRows = Object.entries(scales).map(([abbr, s]) => {
    const colorClass = s.interpretation === 'Elevated' ? 'score-elevated'
      : s.interpretation === 'Borderline' ? 'score-borderline'
      : 'score-wnl';
    return `
      <tr>
        <td>${SCALE_NAMES[abbr] || abbr}</td>
        <td>${s.raw}</td>
        <td class="${colorClass}">${s.t}</td>
        <td class="${colorClass}">${s.interpretation}</td>
      </tr>
    `;
  }).join('');

  const briColor = indices.BRI.interpretation === 'Elevated' ? 'score-elevated'
    : indices.BRI.interpretation === 'Borderline' ? 'score-borderline'
    : 'score-wnl';
  const miColor = indices.MI.interpretation === 'Elevated' ? 'score-elevated'
    : indices.MI.interpretation === 'Borderline' ? 'score-borderline'
    : 'score-wnl';
  const gecColor = indices.GEC.interpretation === 'Elevated' ? 'score-elevated'
    : indices.GEC.interpretation === 'Borderline' ? 'score-borderline'
    : 'score-wnl';

  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="briefa-complete focus-box">
        <h2>BRIEF-A Complete</h2>
        <p class="briefa-complete-sub">Behavior Rating Inventory of Executive Function</p>

        <div class="briefa-indices">
          <div class="briefa-index-card ${briColor}">
            <div class="briefa-index-label">BRI</div>
            <div class="briefa-index-value">${indices.BRI.t}</div>
            <div class="briefa-index-name">Behavioral Regulation</div>
            <div class="briefa-index-interpret">${indices.BRI.interpretation}</div>
          </div>
          <div class="briefa-index-card ${miColor}">
            <div class="briefa-index-label">MI</div>
            <div class="briefa-index-value">${indices.MI.t}</div>
            <div class="briefa-index-name">Metacognition</div>
            <div class="briefa-index-interpret">${indices.MI.interpretation}</div>
          </div>
          <div class="briefa-index-card ${gecColor}">
            <div class="briefa-index-label">GEC</div>
            <div class="briefa-index-value">${indices.GEC.t}</div>
            <div class="briefa-index-name">Global Executive</div>
            <div class="briefa-index-interpret">${indices.GEC.interpretation}</div>
          </div>
        </div>

        <table class="briefa-scale-table">
          <thead>
            <tr>
              <th>Scale</th>
              <th>Raw</th>
              <th>T</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            ${scaleRows}
          </tbody>
        </table>

        <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #666;">
          T-scores: ≥65 Elevated · 60–64 Borderline · &lt;60 Within Normal Limits
        </p>
        <p style="margin-top: 1rem;">Press <strong>SPACE</strong> to continue</p>
      </div>
      <style>
        .briefa-complete { max-width: 720px; margin: 0 auto; }
        .briefa-complete-sub { color: #888; margin-bottom: 1.5rem; }
        .briefa-indices {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .briefa-index-card {
          flex: 1;
          min-width: 140px;
          padding: 1.25rem;
          border-radius: 10px;
          text-align: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .briefa-index-label { font-size: 1.5rem; font-weight: 700; color: #4ecdc4; }
        .briefa-index-value { font-size: 2rem; font-weight: 700; color: #fff; }
        .briefa-index-name { font-size: 0.8rem; color: #888; margin: 0.25rem 0; }
        .briefa-index-interpret { font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem; }
        .score-elevated { color: #e74c3c; }
        .score-borderline { color: #f39c12; }
        .score-wnl { color: #27ae60; }
        .briefa-scale-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        .briefa-scale-table th {
          text-align: left;
          color: #888;
          font-weight: 600;
          padding: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .briefa-scale-table td {
          padding: 0.5rem;
          color: #ccc;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .briefa-scale-table td:last-child, .briefa-scale-table th:last-child,
        .briefa-scale-table td:nth-child(3), .briefa-scale-table th:nth-child(3) {
          text-align: center;
        }
      </style>
    `,
    choices: [' '],
    data: { module: 'brief_a', trial_type: 'completion' },
  };
}

// ---------------------------------------------------------------------
// Results Aggregation (for main.js)
// ---------------------------------------------------------------------

/**
 * Aggregate BRIEF-A results from jsPsych trial data
 * @param {Array} data - jsPsych data array
 * @returns {Object} BRIEF-A results object
 */
export function aggregateBriefAResults(data) {
  const responses = {};
  data.forEach(d => {
    if (d.module !== 'brief_a') return;
    if (!d.question_id) return;
    responses[d.question_id] = d.response;
  });
  return scoreBriefAResponses(responses);
}

// ---------------------------------------------------------------------
// Timeline Builder
// ---------------------------------------------------------------------

/**
 * Build the full BRIEF-A timeline
 * @param {object} jsPsych - jsPsych instance
 * @param {string|null} sessionId - Session ID for storage
 * @returns {Array} jsPsych timeline array
 */
export function buildBriefATimeline(jsPsych, sessionId = null) {
  const timeline = [];

  // Load saved progress
  let savedResponses = {};
  let currentIndex = 0;
  if (sessionId) {
    const saved = loadProgress(sessionId);
    if (saved) {
      savedResponses = saved.responses || {};
      currentIndex = saved.currentIndex || 0;
    }
  }

  // Intro screen
  timeline.push(buildIntroScreen());

  // One trial per item
  ITEMS.forEach((item, idx) => {
    timeline.push({
      type: 'html-button-response',
      stimulus: buildItemHTML(item, idx, ITEMS.length, savedResponses[item.id], SCALE_NAMES[item.scale]),
      choices: LIKERT_OPTIONS.map(opt => opt.label),
      button_html: (choice, choiceIndex) => {
        // Hide default buttons — we use custom Likert UI
        return `<button class="briefa-next-btn" id="briefa-next" style="
          margin-top: 1.5rem;
          padding: 0.75rem 2rem;
          background: #4ecdc4;
          color: #000;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: none;
        ">Next</button>`;
      },
      data: {
        module: 'brief_a',
        question_id: item.id,
        scale: item.scale,
        trial_type: 'item',
        item_index: idx,
      },
      on_load: () => {
        // Attach click handlers to Likert buttons
        const display = jsPsych.getDisplayElement();
        const optionBtns = display.querySelectorAll('.briefa-option-btn');
        const nextBtn = display.querySelector('#briefa-next');

        optionBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            // Deselect others
            optionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            // Show next button
            if (nextBtn) nextBtn.style.display = 'block';
          });
        });

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            // Find selected value
            const selected = display.querySelector('.briefa-option-btn.selected');
            const value = selected ? parseInt(selected.dataset.value) : 0;
            jsPsych.finishTrial({ response: value });
          });
        }
      },
      on_finish: (data) => {
        const display = jsPsych.getDisplayElement();
        const selected = display.querySelector('.briefa-option-btn.selected');
        const response = selected ? parseInt(selected.dataset.value) : 0;
        data.response = response;

        // Save progress
        if (sessionId) {
          const updatedResponses = { ...savedResponses, [item.id]: response };
          saveProgress(sessionId, updatedResponses, idx);
          // Update savedResponses for next iteration
          Object.assign(savedResponses, { [item.id]: response });
        }
      },
    });
  });

  // Completion screen — compute results inline from saved responses
  const completionTrial = {
    type: 'html-keyboard-response',
    stimulus: '', // filled in after aggregation
    choices: [' '],
    data: { module: 'brief_a', trial_type: 'completion' },
    on_start: () => {
      // Compute results from saved responses
      const results = scoreBriefAResponses(savedResponses);
      // Clear progress
      if (sessionId) clearProgress(sessionId);
      // Set stimulus dynamically
      completionTrial.stimulus = buildCompletionScreen(jsPsych, results).stimulus;
    },
  };

  timeline.push(completionTrial);

  return timeline;
}
