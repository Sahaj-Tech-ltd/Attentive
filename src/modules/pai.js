/**
 * PAI Module (Personality Assessment Inventory — Short Form)
 *
 * 66 items across 11 scales, each rated 0-3:
 * 0 = False, 1 = Somewhat true, 2 = Mostly true, 3 = Very true
 *
 * Paginated: 11 pages, 6 items per page grouped by scale
 * Progress saved to sessionStorage per page
 *
 * @see SPEC-PAI.md
 */

import { scorePAI } from '../scoring/pai.js';

const SESSION_STORAGE_KEY = 'pai_progress_';

const ITEMS_PER_PAGE = 6;

const SCALE_ORDER = ['INF', 'NIM', 'PIM', 'SOM', 'ANX', 'DEP', 'MAN', 'PAR', 'ALC', 'DRG'];

const SCALE_NAMES = {
  INF: 'Infrequency',
  NIM: 'Negative Impression',
  PIM: 'Positive Impression',
  SOM: 'Somatic Complaints',
  ANX: 'Anxiety',
  DEP: 'Depression',
  MAN: 'Mania',
  PAR: 'Paranoia',
  ALC: 'Alcohol Problems',
  DRG: 'Drug Problems',
};

const SCALE_DESCRIPTIONS = {
  INF: 'Detects inconsistent or random responding',
  NIM: 'Measures tendency to present an exaggerated negative impression',
  PIM: 'Measures tendency to present an overly favorable impression',
  SOM: 'Physical symptoms and health concerns',
  ANX: 'General anxiety symptoms and worry',
  DEP: 'Depressive symptoms including mood and cognition',
  MAN: 'Manic symptoms including energy and impulsivity',
  PAR: 'Paranoid ideation and distrust',
  ALC: 'Alcohol use patterns and consequences',
  DRG: 'Drug use patterns and consequences',
};

const PAGES = [
  {
    scale: 'INF',
    questions: [
      { id: 'inf_q1', text: 'I have never told a single lie in my entire life' },
      { id: 'inf_q2', text: 'I sometimes hear voices telling me what to do when alone' },
      { id: 'inf_q3', text: 'I have never been angry at anyone' },
      { id: 'inf_q4', text: 'I sometimes feel that strangers are watching me' },
      { id: 'inf_q5', text: 'I never have disturbing thoughts or images' },
      { id: 'inf_q6', text: 'I am always completely honest with everyone' },
    ],
  },
  {
    scale: 'NIM',
    questions: [
      { id: 'nim_q1', text: 'Everything I do turns out wrong' },
      { id: 'nim_q2', text: 'Nothing ever works out the way I want it to' },
      { id: 'nim_q3', text: 'My life is completely worthless' },
      { id: 'pim_q1', text: 'I am always completely honest' },
      { id: 'pim_q2', text: 'I have never said anything just to impress someone' },
      { id: 'pim_q3', text: 'I never complain about anything' },
    ],
    note: 'This page contains NIM (3 items) and PIM (3 items)',
  },
  {
    scale: 'SOM',
    questions: [
      { id: 'som_q1', text: 'I frequently have headaches' },
      { id: 'som_q2', text: 'My stomach is often upset' },
      { id: 'som_q3', text: 'I often feel dizzy or lightheaded' },
      { id: 'som_q4', text: 'I have chest pains or heart palpitations' },
      { id: 'som_q5', text: 'I frequently feel nauseous or sick to my stomach' },
      { id: 'som_q6', text: 'I have trouble sleeping most nights' },
    ],
  },
  {
    scale: 'ANX',
    questions: [
      { id: 'anx_q1', text: 'I feel nervous most of the time' },
      { id: 'anx_q2', text: 'I worry about bad things happening to me' },
      { id: 'anx_q3', text: 'I have panic attacks or feel suddenly very anxious' },
      { id: 'anx_q4', text: 'I feel restless and cannot sit still' },
      { id: 'anx_q5', text: 'I get nervous when I have to speak in front of people' },
      { id: 'anx_q6', text: 'I often feel on edge or keyed up' },
    ],
  },
  {
    scale: 'DEP',
    questions: [
      { id: 'dep_q1', text: 'I feel sad or blue most of the time' },
      { id: 'dep_q2', text: 'I feel hopeless about the future' },
      { id: 'dep_q3', text: 'I have lost interest in things I used to enjoy' },
      { id: 'dep_q4', text: 'I feel like a failure' },
      { id: 'dep_q5', text: 'I have trouble concentrating' },
      { id: 'dep_q6', text: 'I think about death or suicide' },
    ],
  },
  {
    scale: 'MAN',
    questions: [
      { id: 'man_q1', text: 'I have too much energy' },
      { id: 'man_q2', text: 'I talk much faster than usual' },
      { id: 'man_q3', text: 'I need very little sleep' },
      { id: 'man_q4', text: 'I get involved in many activities at once' },
      { id: 'man_q5', text: 'I spend money recklessly' },
      { id: 'man_q6', text: 'I do things that could get me in trouble' },
    ],
  },
  {
    scale: 'PAR',
    questions: [
      { id: 'par_q1', text: 'Other people are against me' },
      { id: 'par_q2', text: 'I cannot trust people' },
      { id: 'par_q3', text: 'People are looking at me strangely' },
      { id: 'par_q4', text: 'I feel that people are plotting against me' },
      { id: 'par_q5', text: 'I feel that others have it out for me' },
      { id: 'par_q6', text: 'I feel like I am being followed or watched' },
    ],
  },
  {
    scale: 'ALC',
    questions: [
      { id: 'alc_q1', text: 'I drink alcohol frequently' },
      { id: 'alc_q2', text: 'I have had problems because of my drinking' },
      { id: 'alc_q3', text: 'I have driven a car after drinking too much' },
      { id: 'alc_q4', text: 'Others have criticized my drinking' },
      { id: 'alc_q5', text: 'I need a drink in the morning to get started' },
      { id: 'alc_q6', text: 'I have missed work or obligations because of drinking' },
    ],
  },
  {
    scale: 'DRG',
    questions: [
      { id: 'drg_q1', text: 'I use recreational drugs' },
      { id: 'drg_q2', text: 'I have had problems because of drug use' },
      { id: 'drg_q3', text: 'I have used drugs to get through the day' },
      { id: 'drg_q4', text: 'Others have criticized my drug use' },
      { id: 'drg_q5', text: 'I have done things I regret while using drugs' },
      { id: 'drg_q6', text: 'I have used drugs even when they caused problems' },
    ],
  },
];

const OPTIONS = [
  { value: 0, label: 'False' },
  { value: 1, label: 'Somewhat' },
  { value: 2, label: 'Mostly' },
  { value: 3, label: 'Very' },
];

function saveProgress(sessionId, responses, page) {
  const key = `${SESSION_STORAGE_KEY}${sessionId}`;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      responses,
      page,
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

function buildPageStimulus(pageIdx, totalPages, pageData, savedResponses) {
  const progressPct = Math.round(((pageIdx + 1) / totalPages) * 100);
  const scaleAbbr = pageData.scale;
  const scaleName = SCALE_NAMES[scaleAbbr];
  const scaleDesc = SCALE_DESCRIPTIONS[scaleAbbr];

  let questionsHTML = '';
  let globalQNum = 0;
  for (let p = 0; p < pageIdx; p++) {
    globalQNum += PAGES[p].questions.length;
  }

  pageData.questions.forEach((q, idx) => {
    const qNum = globalQNum + idx + 1;
    const savedVal = savedResponses[q.id] !== undefined ? String(savedResponses[q.id]) : '';
    questionsHTML += `
      <div class="pai-question" data-question-id="${q.id}">
        <div class="pai-q-label">
          <span class="pai-q-num">${qNum}.</span>
          <span class="pai-q-text">${q.text}</span>
        </div>
        <div class="pai-q-options">
          ${OPTIONS.map(opt => `
            <button class="pai-option-btn ${savedVal === String(opt.value) ? 'selected' : ''}"
                    data-option="${opt.value}"
                    data-question="${q.id}"
                    type="button">
              <span class="pai-option-score">${opt.value}</span>
              <span class="pai-option-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });

  return `
    <div class="pai-page">
      <div class="pai-header">
        <div class="pai-scale-title">${scaleName}${pageData.note ? ' / Positive Impression' : ''}</div>
        ${scaleDesc ? `<div class="pai-scale-desc">${scaleDesc}</div>` : ''}
        <div class="pai-progress-bar">
          <div class="pai-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="pai-page-indicator">Page ${pageIdx + 1} of ${totalPages}</div>
      </div>
      <div class="pai-questions">
        ${questionsHTML}
      </div>
      <div class="pai-page-nav">
        ${pageIdx > 0 ? '<button class="pai-nav-btn" id="pai-prev">&larr; Previous</button>' : '<span></span>'}
        ${pageIdx < totalPages - 1
          ? '<button class="pai-nav-btn" id="pai-next">Next Page &rarr;</button>'
          : '<button class="pai-nav-btn pai-complete-btn" id="pai-next">Complete</button>'}
      </div>
    </div>
    <style>
      .pai-page {
        max-width: 700px;
        margin: 0 auto;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .pai-header {
        margin-bottom: 1.5rem;
      }
      .pai-scale-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #4ecdc4;
        margin-bottom: 0.25rem;
      }
      .pai-scale-desc {
        font-size: 0.85rem;
        color: #888;
        margin-bottom: 0.5rem;
      }
      .pai-progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.25rem;
      }
      .pai-progress-fill {
        height: 100%;
        background: #4ecdc4;
        transition: width 0.3s ease;
      }
      .pai-page-indicator {
        font-size: 0.85rem;
        color: #888;
      }
      .pai-questions {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .pai-question {
        background: rgba(255,255,255,0.03);
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .pai-q-label {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.95rem;
        color: #ddd;
      }
      .pai-q-num {
        color: #4ecdc4;
        font-weight: 600;
        min-width: 1.5rem;
      }
      .pai-q-text {
        color: #fff;
        font-weight: 500;
      }
      .pai-q-options {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
      }
      @media (max-width: 600px) {
        .pai-q-options { grid-template-columns: repeat(2, 1fr); }
      }
      .pai-option-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.6rem 0.25rem;
        background: rgba(255,255,255,0.05);
        border: 2px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        color: #ccc;
        font-size: 0.8rem;
        transition: all 0.15s ease;
        gap: 0.25rem;
      }
      .pai-option-btn:hover {
        background: rgba(78,205,196,0.1);
        border-color: rgba(78,205,196,0.3);
        color: #fff;
      }
      .pai-option-btn.selected {
        background: rgba(78,205,196,0.2);
        border-color: #4ecdc4;
        color: #fff;
      }
      .pai-option-score {
        font-size: 1.1rem;
        font-weight: 700;
        color: #4ecdc4;
      }
      .pai-option-label {
        font-size: 0.7rem;
        text-align: center;
        line-height: 1.2;
        opacity: 0.8;
      }
      .pai-page-nav {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .pai-nav-btn {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        background: rgba(78,205,196,0.15);
        color: #4ecdc4;
        border: 1px solid rgba(78,205,196,0.3);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .pai-nav-btn:hover {
        background: rgba(78,205,196,0.25);
        border-color: #4ecdc4;
      }
      .pai-complete-btn {
        background: rgba(78,205,196,0.3);
      }
    </style>
  `;
}

function collectPageResponses(display, pageQuestions) {
  const responses = {};
  pageQuestions.forEach(q => {
    const selectedBtn = display.querySelector(`.pai-option-btn[data-question="${q.id}"].selected`);
    if (selectedBtn) {
      responses[q.id] = parseInt(selectedBtn.dataset.option);
    }
  });
  return responses;
}

function attachPageHandlers(jsPsych, pageIdx, pageData, sessionId, savedResponses) {
  const display = jsPsych.getDisplayElement();

  display.querySelectorAll('.pai-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.question;
      display.querySelectorAll(`.pai-option-btn[data-question="${qId}"]`).forEach(b => {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
      savedResponses[qId] = parseInt(btn.dataset.option);
    });
  });

  const prevBtn = display.querySelector('#pai-prev');
  const nextBtn = display.querySelector('#pai-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const responses = collectPageResponses(display, pageData.questions);
      if (sessionId) {
        const saved = loadProgress(sessionId) || { responses: {} };
        const allResp = { ...saved.responses, ...responses };
        saveProgress(sessionId, allResp, pageIdx);
      }
      jsPsych.finishTrial({ direction: 'prev', responses });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const responses = collectPageResponses(display, pageData.questions);
      let allAnswered = true;
      pageData.questions.forEach(q => {
        if (responses[q.id] === undefined || responses[q.id] === null) {
          allAnswered = false;
        }
      });

      if (!allAnswered) {
        display.querySelectorAll('.pai-question').forEach(qEl => {
          const qId = qEl.dataset.questionId;
          if (responses[qId] === undefined || responses[qId] === null) {
            qEl.style.borderColor = '#e74c3c';
            setTimeout(() => { qEl.style.borderColor = ''; }, 2000);
          }
        });
        return;
      }

      if (sessionId) {
        const saved = loadProgress(sessionId) || { responses: {} };
        const allResp = { ...saved.responses, ...responses };
        saveProgress(sessionId, allResp, pageIdx);
      }
      jsPsych.finishTrial({ direction: 'next', responses });
    });
  }
}

function buildResultsHTML(results) {
  const { tScores, validityFlags, elevatedScales, markedlyElevatedScales, interpretation, hasValidityConcern } = results;

  const scaleRows = Object.entries(SCALE_NAMES).map(([abbr, name]) => {
    const key = abbr.toLowerCase();
    const t = tScores[key];
    const interp = interpretation[key];
    let colorClass = 'pai-wnl';
    if (t >= 80) colorClass = 'pai-marked';
    else if (t >= 70) colorClass = 'pai-elevated';
    else if (t >= 60) colorClass = 'pai-borderline';
    return `
      <tr>
        <td class="pai-scale-abbr">${abbr}</td>
        <td>${name}</td>
        <td class="${colorClass}">${t}</td>
        <td class="${colorClass}">${interp}</td>
      </tr>
    `;
  }).join('');

  const validityHTML = hasValidityConcern
    ? `<div class="pai-validity-warning">
         <strong>Validity Concern:</strong> One or more validity scales are elevated.
         ${Object.entries(validityFlags).filter(([,v]) => v).map(([k]) => k.toUpperCase()).join(', ')}
       </div>`
    : '<div class="pai-validity-ok">No validity concerns detected.</div>';

  return `
    <div class="pai-results focus-box">
      <h2>PAI Results</h2>
      <p class="pai-results-sub">Personality Assessment Inventory — Short Form</p>

      ${validityHTML}

      <table class="pai-scale-table">
        <thead>
          <tr>
            <th>Scale</th>
            <th>Name</th>
            <th>T-Score</th>
            <th>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          ${scaleRows}
        </tbody>
      </table>

      <div class="pai-legend">
        <strong>T-Score Ranges:</strong>
        &lt;60 = Within normal limits &middot;
        60–69 = Borderline &middot;
        70–79 = Elevated &middot;
        &ge;80 = Markedly elevated
      </div>

      <p style="margin-top: 1.5rem;">Press <strong>SPACE</strong> to continue</p>
    </div>
    <style>
      .pai-results { max-width: 720px; margin: 0 auto; }
      .pai-results-sub { color: #888; margin-bottom: 1.5rem; }
      .pai-validity-warning {
        background: rgba(231,76,60,0.15);
        border: 1px solid rgba(231,76,60,0.3);
        color: #e74c3c;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .pai-validity-ok {
        background: rgba(39,174,96,0.1);
        border: 1px solid rgba(39,174,96,0.2);
        color: #27ae60;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .pai-scale-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        margin-top: 0.5rem;
      }
      .pai-scale-table th {
        text-align: left;
        color: #888;
        font-weight: 600;
        padding: 0.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .pai-scale-table td {
        padding: 0.5rem;
        color: #ccc;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .pai-scale-table td:nth-child(3),
      .pai-scale-table td:nth-child(4),
      .pai-scale-table th:nth-child(3),
      .pai-scale-table th:nth-child(4) {
        text-align: center;
      }
      .pai-scale-abbr {
        font-weight: 600;
        color: #4ecdc4;
      }
      .pai-wnl { color: #27ae60; }
      .pai-borderline { color: #f39c12; }
      .pai-elevated { color: #e67e22; }
      .pai-marked { color: #e74c3c; font-weight: 600; }
      .pai-legend {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: #888;
        text-align: center;
      }
    </style>
  `;
}

export function aggregatePAIResults(data) {
  const responses = {};
  data.forEach(d => {
    if (d.module !== 'pai') return;
    if (d.responses) {
      Object.assign(responses, d.responses);
    }
  });
  return scorePAI(responses);
}

export function buildPAITimeline(jsPsych, sessionId = null) {
  const timeline = [];

  let savedResponses = {};
  if (sessionId) {
    const saved = loadProgress(sessionId);
    if (saved) {
      savedResponses = saved.responses || {};
    }
  }

  timeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="pai-intro focus-box">
        <h2>PAI</h2>
        <p>Personality Assessment Inventory — Short Form</p>
        <div class="pai-info-cards">
          <div class="pai-info-card">
            <h3>66 Questions</h3>
            <p>Across 11 scales measuring personality and validity</p>
          </div>
          <div class="pai-info-card">
            <h3>How to Respond</h3>
            <p>Rate each statement: False / Somewhat / Mostly / Very true</p>
          </div>
          <div class="pai-info-card">
            <h3>Your Responses</h3>
            <p>Answer honestly — there are no right or wrong answers.</p>
          </div>
        </div>
        <p style="margin-top: 1.5rem;">Press <strong>SPACE</strong> to begin</p>
      </div>
      <style>
        .pai-info-cards {
          display: flex;
          gap: 1rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }
        .pai-info-card {
          flex: 1;
          min-width: 160px;
          background: rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
        }
        .pai-info-card h3 { margin-top: 0; color: #4ecdc4; font-size: 1rem; }
        .pai-info-card p { margin: 0.5rem 0 0; font-size: 0.85rem; color: #ccc; line-height: 1.5; }
      </style>
    `,
    choices: [' '],
    data: { module: 'pai', trial_type: 'intro' },
  });

  const totalPages = PAGES.length;

  PAGES.forEach((pageData, pageIdx) => {
    timeline.push({
      type: 'html-button-response',
      stimulus: buildPageStimulus(pageIdx, totalPages, pageData, savedResponses),
      choices: ['placeholder'],
      button_html: () => '<button style="display:none"></button>',
      data: { module: 'pai', page: pageIdx, scale: pageData.scale, trial_type: 'page' },
      on_load: () => {
        attachPageHandlers(jsPsych, pageIdx, pageData, sessionId, savedResponses);
      },
      on_finish: (data) => {
        const display = jsPsych.getDisplayElement();
        const responses = collectPageResponses(display, pageData.questions);
        data.responses = responses;

        if (sessionId) {
          const saved = loadProgress(sessionId) || { responses: {} };
          const allResp = { ...saved.responses, ...responses };
          saveProgress(sessionId, allResp, pageIdx);
          Object.assign(savedResponses, allResp);
        }
      },
    });
  });

  const completionTrial = {
    type: 'html-keyboard-response',
    stimulus: '',
    choices: [' '],
    data: { module: 'pai', trial_type: 'completion' },
    on_start: () => {
      const results = scorePAI(savedResponses);
      if (sessionId) clearProgress(sessionId);
      completionTrial.stimulus = buildResultsHTML(results);
    },
  };

  timeline.push(completionTrial);

  return timeline;
}
