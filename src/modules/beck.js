/**
 * Beck Inventories Module (BDI-II + BAI)
 *
 * Beck Depression Inventory (BDI-II): 21 items, 0-3 each, max 63
 * Beck Anxiety Inventory (BAI): 21 items, 0-3 each, max 63
 *
 * Grid UI: 7 questions per page × 3 pages per inventory
 * Page navigation with progress bar and back/next support
 *
 * @see SPEC-Beck.md for full specification
 */

const SESSION_STORAGE_KEY = 'beck_progress_';

// BDI-II Questions (21 items, standard BDI-II wording)
const BDI2_QUESTIONS = [
  { id: 'bdi2_q1',  text: 'Sadness', options: ['I do not feel sad.', 'I feel sad much of the time.', 'I am sad all the time.', 'I am so sad or unhappy that I cannot stand it.'] },
  { id: 'bdi2_q2',  text: 'Pessimism', options: ['I am not pessimistic about the future.', 'I feel more pessimistic about the future than I used to.', 'I do not expect things to work out the way I want them to.', 'I feel that my future is hopeless and will only get worse.'] },
  { id: 'bdi2_q3',  text: 'Past Failure', options: ['I do not feel like a failure.', 'I feel I have failed more than the average person.', 'When I look back at my life, all I can see is a lot of failures.', 'I feel I am a total failure as a person.'] },
  { id: 'bdi2_q4',  text: 'Loss of Pleasure', options: ['I get as much pleasure as I ever did from the things I enjoy.', 'I do not enjoy things as much as I used to.', 'I get very little pleasure from the things I used to enjoy.', 'I cannot get any pleasure from the things I used to enjoy.'] },
  { id: 'bdi2_q5',  text: 'Guilty Feelings', options: ['I do not feel particularly guilty.', 'I feel guilty over many things I have done or should have done.', 'I feel quite guilty most of the time.', 'I feel guilty all the time.'] },
  { id: 'bdi2_q6',  text: 'Punishment Feelings', options: ['I do not feel I am being punished.', 'I feel I may be punished.', 'I expect to be punished.', 'I feel I am being punished.'] },
  { id: 'bdi2_q7',  text: 'Self-Dislike', options: ['I feel the same about myself as ever.', 'I have lost confidence in myself.', 'I am disappointed in myself.', 'I dislike myself.'] },
  { id: 'bdi2_q8',  text: 'Self-Criticalness', options: ['I do not criticize or blame myself more than usual.', 'I am more critical of myself than I used to be.', 'I criticize myself for all of my faults.', 'I blame myself for everything bad that happens.'] },
  { id: 'bdi2_q9',  text: 'Suicidal Thoughts or Wishes', options: ['I do not have any thoughts of killing myself.', 'I have thoughts of killing myself, but I would not carry them out.', 'I would like to kill myself.', 'I would kill myself if I had the chance.'] },
  { id: 'bdi2_q10', text: 'Crying', options: ['I do not cry any more than I used to.', 'I cry more than I used to.', 'I cry over every little thing.', 'I feel like crying but I cannot.'] },
  { id: 'bdi2_q11', text: 'Agitation', options: ['I am no more restless or wound up than usual.', 'I feel more restless or wound up than usual.', 'I am so restless or agitated that it is hard to stay still.', 'I am so restless or agitated that I have to keep moving or doing something.'] },
  { id: 'bdi2_q12', text: 'Loss of Interest', options: ['I have not lost interest in other people or activities.', 'I am less interested in other people or things than before.', 'I have lost most of my interest in other people or things.', 'It is hard to get interested in anything.'] },
  { id: 'bdi2_q13', text: 'Indecisiveness', options: ['I make decisions about as well as I ever could.', 'I put off making decisions more than I used to.', 'I have greater difficulty in making decisions than before.', 'I cannot make any decisions at all.'] },
  { id: 'bdi2_q14', text: 'Worthlessness', options: ['I do not feel worthless.', 'I do not consider myself as worthwhile as I used to.', 'I feel more worthless as compared to other people.', 'I feel utterly worthless.'] },
  { id: 'bdi2_q15', text: 'Loss of Energy', options: ['I have as much energy as ever.', 'I have less energy than I used to have.', 'I do not have enough energy to do very much.', 'I do not have enough energy to do anything.'] },
  { id: 'bdi2_q16', text: 'Changes in Sleeping Pattern', options: ['I have not experienced any change in my sleep.', 'I sleep somewhat more than usual.', 'I sleep somewhat less than usual.', 'I sleep a lot more than usual, or I sleep a lot less than usual.'] },
  { id: 'bdi2_q17', text: 'Irritability', options: ['I am no more irritable than usual.', 'I am more irritable than usual.', 'I am much more irritable than usual.', 'I am irritable all the time.'] },
  { id: 'bdi2_q18', text: 'Changes in Appetite', options: ['I have not experienced any change in my appetite.', 'My appetite is somewhat less than usual.', 'My appetite is somewhat greater than usual.', 'My appetite is much less than usual, or much greater than usual.'] },
  { id: 'bdi2_q19', text: 'Concentration Difficulty', options: ['I can concentrate as well as ever.', 'I cannot concentrate as well as usual.', 'It is hard to keep my mind on anything for long.', 'I find I cannot concentrate on anything.'] },
  { id: 'bdi2_q20', text: 'Tiredness or Fatigue', options: ['I do not feel more tired than usual.', 'I get tired more easily than I used to.', 'I feel too tired to do a lot of things I used to do.', 'I am too tired to do almost anything.'] },
  { id: 'bdi2_q21', text: 'Loss of Interest in Sex', options: ['I have not noticed any recent change in my interest in sex.', 'I am less interested in sex than I used to be.', 'I am much less interested in sex now.', 'I have lost interest in sex completely.'] },
];

// BAI Questions (21 items, standard BAI wording)
const BAI_QUESTIONS = [
  { id: 'bai_q1',  text: 'Numbness or tingling', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q2',  text: 'Feeling hot', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q3',  text: 'Wobbliness in legs', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q4',  text: 'Unable to relax', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q5',  text: 'Fear of worst happening', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q6',  text: 'Dizzy or lightheaded', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q7',  text: 'Heart pounding or racing', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q8',  text: 'Unsteady', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q9',  text: 'Terrified or afraid', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q10', text: 'Nervous', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q11', text: 'Feeling of choking', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q12', text: 'Hands trembling', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q13', text: 'Shaking', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q14', text: 'Fear of losing control', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q15', text: 'Difficulty breathing', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q16', text: 'Fear of dying', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q17', text: 'Scared', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q18', text: 'Indigestion', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q19', text: 'Faint or lightheaded', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q20', text: 'Face flushed', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
  { id: 'bai_q21', text: 'Hot/cold sweats', options: ['Not at all', 'Mildly', 'Moderately', 'Severely'] },
];

const QUESTIONS_PER_PAGE = 7;

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
// Scoring
// ---------------------------------------------------------------------

export function calculateBDI2Score(responses) {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 21; i++) {
    const key = `bdi2_q${i}`;
    const val = responses[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 3) {
        total += num;
        count++;
      }
    }
  }
  return { total, count, max: 63 };
}

export function calculateBAIScore(responses) {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 21; i++) {
    const key = `bai_q${i}`;
    const val = responses[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 3) {
        total += num;
        count++;
      }
    }
  }
  return { total, count, max: 63 };
}

export function interpretBDI2(score) {
  const s = parseInt(score) || 0;
  if (s <= 13) return 'Minimal depression';
  if (s <= 19) return 'Mild depression';
  if (s <= 25) return 'Moderate depression';
  return 'Severe depression';
}

export function interpretBAI(score) {
  const s = parseInt(score) || 0;
  if (s <= 7) return 'Minimal anxiety';
  if (s <= 15) return 'Mild anxiety';
  if (s <= 25) return 'Moderate anxiety';
  return 'Severe anxiety';
}

// ---------------------------------------------------------------------
// Results Aggregation
// ---------------------------------------------------------------------

export function aggregateBeckResults(data) {
  const bdi2Responses = {};
  const baiResponses = {};
  let bdi2Page = 1;
  let baiPage = 1;

  data.forEach(d => {
    if (d.module !== 'beck_inventories') return;
    const inv = d.inventory;
    const qid = d.question_id;
    if (!qid) return;

    if (inv === 'bdi2') {
      bdi2Responses[qid] = d.response;
      bdi2Page = d.page || 1;
    } else if (inv === 'bai') {
      baiResponses[qid] = d.response;
      baiPage = d.page || 1;
    }
  });

  const bdi2Score = calculateBDI2Score(bdi2Responses);
  const baiScore = calculateBAIScore(baiResponses);

  return {
    bdi2: {
      responses: bdi2Responses,
      total_score: bdi2Score.total,
      interpretation: interpretBDI2(bdi2Score.total),
      item_count: bdi2Score.count,
    },
    bai: {
      responses: baiResponses,
      total_score: baiScore.total,
      interpretation: interpretBAI(baiScore.total),
      item_count: baiScore.count,
    },
    _meta: { bdi2Page, baiPage },
  };
}

// ---------------------------------------------------------------------
// Build Beck Inventories Timeline
// ---------------------------------------------------------------------

/**
 * Build the full Beck Inventories timeline (BDI-II + BAI)
 * @param {object} jsPsych - jsPsych instance
 * @param {string|null} sessionId - Session ID for storage
 * @returns {Array} jsPsych timeline array
 */
export function buildBeckInventoriesTimeline(jsPsych, sessionId = null) {
  const timeline = [];

  // --- Beck Intro Screen ---
  timeline.push(buildBeckIntroScreen());

  // --- BDI-II (3 pages × 7 questions) ---
  const bdi2Pages = buildInventoryPages(jsPsych, 'bdi2', BDI2_QUESTIONS, sessionId);
  timeline.push(...bdi2Pages);

  // --- BDI-II Completion Screen ---
  timeline.push(buildInventoryCompletionScreen(jsPsych, 'bdi2'));

  // --- BAI (3 pages × 7 questions) ---
  const baiPages = buildInventoryPages(jsPsych, 'bai', BAI_QUESTIONS, sessionId);
  timeline.push(...baiPages);

  // --- BAI Completion Screen ---
  timeline.push(buildInventoryCompletionScreen(jsPsych, 'bai'));

  // --- Beck Summary Screen ---
  timeline.push(buildBeckSummaryScreen(jsPsych));

  return timeline;
}

function buildBeckIntroScreen() {
  return {
    type: 'html-keyboard-response',
    stimulus: `
      <div class="beck-intro focus-box">
        <h2>Beck Inventories</h2>
        <p>This assessment includes two validated questionnaires:</p>
        <div class="beck-inv-descriptions">
          <div class="beck-inv-card">
            <h3>BDI-II</h3>
            <p>Beck Depression Inventory</p>
            <ul>
              <li>21 questions about depression symptoms</li>
              <li>Scores range from 0–63</li>
              <li>Each question scored 0–3</li>
            </ul>
          </div>
          <div class="beck-inv-card">
            <h3>BAI</h3>
            <p>Beck Anxiety Inventory</p>
            <ul>
              <li>21 questions about anxiety symptoms</li>
              <li>Scores range from 0–63</li>
              <li>Each question scored 0–3</li>
            </ul>
          </div>
        </div>
        <p class="beck-instructions">
          Each question has 4 response options. Select the one that best describes how you have felt <strong>over the past two weeks</strong>.
        </p>
        <p style="margin-top: 1.5rem;">Press <strong>SPACE</strong> to begin BDI-II</p>
      </div>
      <style>
        .beck-inv-descriptions {
          display: flex;
          gap: 1rem;
          margin: 1.5rem 0;
          flex-wrap: wrap;
        }
        .beck-inv-card {
          flex: 1;
          min-width: 200px;
          background: rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: 8px;
          text-align: left;
        }
        .beck-inv-card h3 { margin-top: 0; color: #4ecdc4; }
        .beck-inv-card ul { margin: 0.5rem 0; padding-left: 1.2rem; line-height: 1.8; color: #ccc; }
        .beck-instructions { color: #888; font-size: 0.95rem; }
      </style>
    `,
    choices: [' '],
    data: { module: 'beck_inventories', trial_type: 'intro' },
  };
}

function buildInventoryPages(jsPsych, inventory, questions, sessionId) {
  const pages = [];
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  // Load saved progress
  let savedResponses = {};
  let savedPage = 1;
  if (sessionId) {
    const saved = loadProgress(sessionId);
    if (saved && saved[inventory]) {
      savedResponses = saved[inventory].responses || {};
      savedPage = saved[inventory].page || 1;
    }
  }

  for (let page = 1; page <= totalPages; page++) {
    const startIdx = (page - 1) * QUESTIONS_PER_PAGE;
    const pageQuestions = questions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);

    pages.push({
      type: 'html-button-response',
      stimulus: buildPageStimulus(inventory, page, totalPages, pageQuestions, savedResponses),
      choices: ['Next Page', 'Previous Page'],
      button_html: (choice, choiceIndex) => {
        const isFirstPage = page === 1;
        const isLastPage = page === totalPages;
        const labels = [];
        if (!isFirstPage) labels.push('<button class="beck-nav-btn" id="beck-prev">← Previous</button>');
        if (isLastPage) labels.push('<button class="beck-nav-btn beck-complete-btn" id="beck-next">Complete</button>');
        else labels.push('<button class="beck-nav-btn" id="beck-next">Next Page →</button>');
        if (!isLastPage && !isFirstPage) labels.push('<button class="beck-nav-btn" id="beck-prev">← Previous</button>');
        return labels.join('');
      },
      data: { module: 'beck_inventories', inventory, page, trial_type: 'page' },
      on_start: () => {
        // Initialize page state
        if (sessionId) {
          const saved = loadProgress(sessionId);
          if (saved && saved[inventory]) {
            savedResponses = saved[inventory].responses || {};
          }
        }
      },
      on_load: () => {
        attachPageHandlers(jsPsych, inventory, page, totalPages, pageQuestions, sessionId, savedResponses);
      },
      on_finish: (data) => {
        // Collect responses from the display element
        const display = jsPsych.getDisplayElement();
        const responses = collectPageResponses(display, pageQuestions);
        // Merge with previously saved responses
        if (sessionId) {
          const saved = loadProgress(sessionId) || {};
          const prevResponses = (saved[inventory] || {}).responses || {};
          const allResponses = { ...prevResponses, ...responses };
          saveProgress(sessionId, {
            ...saved,
            [inventory]: {
              responses: allResponses,
              page: page,
            },
          });
        }
        data.responses = responses;
      },
    });
  }

  return pages;
}

function buildPageStimulus(inventory, page, totalPages, pageQuestions, savedResponses) {
  const inventoryLabel = inventory === 'bdi2' ? 'BDI-II' : 'BAI';
  const inventoryTitle = inventory === 'bdi2' ? 'Beck Depression Inventory' : 'Beck Anxiety Inventory';
  const progressPct = Math.round((page / totalPages) * 100);

  let questionsHTML = '';
  pageQuestions.forEach((q, idx) => {
    const qNum = pageQuestions.indexOf(q) + 1 + (page - 1) * QUESTIONS_PER_PAGE;
    const savedVal = savedResponses[q.id] !== undefined ? String(savedResponses[q.id]) : '';
    questionsHTML += `
      <div class="beck-question" data-question-id="${q.id}">
        <div class="beck-q-label">
          <span class="beck-q-num">${qNum}.</span>
          <span class="beck-q-text">${q.text}</span>
        </div>
        <div class="beck-q-options">
          ${q.options.map((opt, optIdx) => `
            <button class="beck-option-btn ${savedVal === String(optIdx) ? 'selected' : ''}"
                    data-option="${optIdx}"
                    data-question="${q.id}"
                    type="button">
              <span class="beck-option-score">${optIdx}</span>
              <span class="beck-option-label">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });

  return `
    <div class="beck-page">
      <div class="beck-header">
        <div class="beck-inv-title">${inventoryTitle}</div>
        <div class="beck-progress-bar">
          <div class="beck-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="beck-page-indicator">Page ${page} of ${totalPages}</div>
      </div>
      <div class="beck-questions">
        ${questionsHTML}
      </div>
      <div class="beck-page-nav">
        ${page > 1 ? '<button class="beck-nav-btn" id="beck-prev">← Previous</button>' : '<span></span>'}
        ${page < totalPages ? '<button class="beck-nav-btn" id="beck-next">Next Page →</button>' : `<button class="beck-nav-btn beck-complete-btn" id="beck-next">Complete</button>`}
      </div>
    </div>
    <style>
      .beck-page {
        max-width: 700px;
        margin: 0 auto;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .beck-header {
        margin-bottom: 1.5rem;
      }
      .beck-inv-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #4ecdc4;
        margin-bottom: 0.5rem;
      }
      .beck-progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.25rem;
      }
      .beck-progress-fill {
        height: 100%;
        background: #4ecdc4;
        transition: width 0.3s ease;
      }
      .beck-page-indicator {
        font-size: 0.85rem;
        color: #888;
      }
      .beck-questions {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .beck-question {
        background: rgba(255,255,255,0.03);
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .beck-q-label {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.95rem;
        color: #ddd;
      }
      .beck-q-num {
        color: #4ecdc4;
        font-weight: 600;
        min-width: 1.5rem;
      }
      .beck-q-text {
        color: #fff;
        font-weight: 500;
      }
      .beck-q-options {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
      }
      @media (max-width: 600px) {
        .beck-q-options { grid-template-columns: repeat(2, 1fr); }
      }
      .beck-option-btn {
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
      .beck-option-btn:hover {
        background: rgba(78,205,196,0.1);
        border-color: rgba(78,205,196,0.3);
        color: #fff;
      }
      .beck-option-btn.selected {
        background: rgba(78,205,196,0.2);
        border-color: #4ecdc4;
        color: #fff;
      }
      .beck-option-score {
        font-size: 1.1rem;
        font-weight: 700;
        color: #4ecdc4;
      }
      .beck-option-label {
        font-size: 0.7rem;
        text-align: center;
        line-height: 1.2;
        opacity: 0.8;
      }
      .beck-page-nav {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .beck-nav-btn {
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
      .beck-nav-btn:hover {
        background: rgba(78,205,196,0.25);
        border-color: #4ecdc4;
      }
      .beck-complete-btn {
        background: rgba(78,205,196,0.3);
      }
    </style>
  `;
}

function attachPageHandlers(jsPsych, inventory, page, totalPages, pageQuestions, sessionId, savedResponses) {
  const display = jsPsych.getDisplayElement();

  // Option button selection
  display.querySelectorAll('.beck-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.question;
      const optVal = btn.dataset.option;

      // Deselect siblings
      display.querySelectorAll(`.beck-option-btn[data-question="${qId}"]`).forEach(b => {
        b.classList.remove('selected');
      });

      // Select this one
      btn.classList.add('selected');

      // Update saved responses
      savedResponses[qId] = parseInt(optVal);
    });
  });

  // Keyboard: 1-4 to select current question's option
  const questionIds = pageQuestions.map(q => q.id);
  const focusQuestionIdx = 0; // Start at first question

  // Pre-fill from saved responses
  pageQuestions.forEach(q => {
    if (savedResponses[q.id] !== undefined) {
      const btns = display.querySelectorAll(`.beck-option-btn[data-question="${q.id}"]`);
      btns.forEach(b => {
        if (parseInt(b.dataset.option) === savedResponses[q.id]) {
          b.classList.add('selected');
        }
      });
    }
  });

  // Navigation: handle the trial buttons manually
  const prevBtn = display.querySelector('#beck-prev');
  const nextBtn = display.querySelector('#beck-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      // Save current page responses first
      const responses = collectPageResponses(display, pageQuestions);
      if (sessionId) {
        const saved = loadProgress(sessionId) || {};
        const prevResp = (saved[inventory] || {}).responses || {};
        const allResp = { ...prevResp, ...responses };
        saveProgress(sessionId, {
          ...saved,
          [inventory]: { responses: allResp, page: page },
        });
      }
      // Signal to jsPsych: this trial is done, proceed to previous
      jsPsych.finishTrial({ direction: 'prev', responses });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Validate all questions answered
      const responses = collectPageResponses(display, pageQuestions);
      let allAnswered = true;
      pageQuestions.forEach(q => {
        if (responses[q.id] === undefined || responses[q.id] === null) {
          allAnswered = false;
        }
      });

      if (!allAnswered) {
        // Highlight unanswered
        display.querySelectorAll('.beck-question').forEach(qEl => {
          const qId = qEl.dataset.questionId;
          if (responses[qId] === undefined || responses[qId] === null) {
            qEl.style.borderColor = '#e74c3c';
            setTimeout(() => { qEl.style.borderColor = ''; }, 2000);
          }
        });
        return;
      }

      // Save progress
      if (sessionId) {
        const saved = loadProgress(sessionId) || {};
        const prevResp = (saved[inventory] || {}).responses || {};
        const allResp = { ...prevResp, ...responses };
        saveProgress(sessionId, {
          ...saved,
          [inventory]: { responses: allResp, page: page },
        });
      }
      jsPsych.finishTrial({ direction: 'next', responses });
    });
  }
}

function collectPageResponses(display, pageQuestions) {
  const responses = {};
  pageQuestions.forEach(q => {
    const selectedBtn = display.querySelector(`.beck-option-btn[data-question="${q.id}"].selected`);
    if (selectedBtn) {
      responses[q.id] = parseInt(selectedBtn.dataset.option);
    }
  });
  return responses;
}

function buildInventoryCompletionScreen(jsPsych, inventory) {
  const isBDI2 = inventory === 'bdi2';
  const label = isBDI2 ? 'BDI-II' : 'BAI';
  const title = isBDI2 ? 'Beck Depression Inventory' : 'Beck Anxiety Inventory';
  const nextLabel = isBDI2 ? 'BAI' : 'Summary';

  return {
    type: 'html-keyboard-response',
    stimulus: () => {
      // Retrieve accumulated responses from sessionStorage
      const display = jsPsych.getDisplayElement();
      // The completion screen is shown after all pages are done
      // We'll show a placeholder score that gets updated on the summary screen
      return `
        <div class="beck-complete focus-box">
          <h2>${title} Complete</h2>
          <p>You have completed all 21 questions.</p>
          <p style="margin-top: 1rem; color: #888; font-size: 0.9rem;">
            Your results will be shown on the final summary screen.
          </p>
          <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue to ${nextLabel}</p>
        </div>
      `;
    },
    choices: [' '],
    data: { module: 'beck_inventories', inventory, trial_type: 'complete' },
  };
}

function buildBeckSummaryScreen(jsPsych) {
  return {
    type: 'html-keyboard-response',
    stimulus: () => {
      // Get all beck data
      const allData = jsPsych.data.get().filter({ module: 'beck_inventories' }).values();

      // Collect all responses
      const bdi2Responses = {};
      const baiResponses = {};
      allData.forEach(d => {
        if (d.responses) {
          Object.entries(d.responses).forEach(([k, v]) => {
            if (k.startsWith('bdi2_')) bdi2Responses[k] = v;
            if (k.startsWith('bai_')) baiResponses[k] = v;
          });
        }
        if (d.inventory === 'bdi2' && d.question_id && d.response !== undefined) {
          bdi2Responses[d.question_id] = d.response;
        }
        if (d.inventory === 'bai' && d.question_id && d.response !== undefined) {
          baiResponses[d.question_id] = d.response;
        }
      });

      const bdi2Score = calculateBDI2Score(bdi2Responses);
      const baiScore = calculateBAIScore(baiResponses);
      const bdi2Interp = interpretBDI2(bdi2Score.total);
      const baiInterp = interpretBAI(baiScore.total);

      const bdi2Color = getScoreColor(bdi2Score.total, 'bdi2');
      const baiColor = getScoreColor(baiScore.total, 'bai');

      return `
        <div class="beck-summary focus-box">
          <h2>Beck Inventories — Summary</h2>

          <div class="beck-summary-cards">
            <div class="beck-summary-card">
              <h3>BDI-II</h3>
              <p class="beck-summary-subtitle">Beck Depression Inventory</p>
              <div class="beck-score ${bdi2Color}">${bdi2Score.total}</div>
              <div class="beck-score-label">out of 63</div>
              <div class="beck-interpretation">${bdi2Interp}</div>
            </div>
            <div class="beck-summary-card">
              <h3>BAI</h3>
              <p class="beck-summary-subtitle">Beck Anxiety Inventory</p>
              <div class="beck-score ${baiColor}">${baiScore.total}</div>
              <div class="beck-score-label">out of 63</div>
              <div class="beck-interpretation">${baiInterp}</div>
            </div>
          </div>

          <div class="beck-summary-notes">
            <h4>Score Interpretations</h4>
            <div class="beck-legend">
              <div><strong>BDI-II:</strong> 0–13 = Minimal, 14–19 = Mild, 20–25 = Moderate, 26+ = Severe</div>
              <div><strong>BAI:</strong> 0–7 = Minimal, 8–15 = Mild, 16–25 = Moderate, 26+ = Severe</div>
            </div>
          </div>

          <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
        </div>
        <style>
          .beck-summary-cards {
            display: flex;
            gap: 2rem;
            margin: 2rem 0;
            flex-wrap: wrap;
          }
          .beck-summary-card {
            flex: 1;
            min-width: 200px;
            background: rgba(255,255,255,0.05);
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
          }
          .beck-summary-card h3 {
            color: #4ecdc4;
            margin: 0 0 0.25rem;
            font-size: 1.5rem;
          }
          .beck-summary-subtitle {
            color: #888;
            font-size: 0.85rem;
            margin: 0 0 1.5rem;
          }
          .beck-score {
            font-size: 4rem;
            font-weight: 700;
            line-height: 1;
            margin: 0.5rem 0;
          }
          .beck-score-label {
            font-size: 0.9rem;
            color: #888;
            margin-bottom: 0.5rem;
          }
          .beck-interpretation {
            font-size: 1rem;
            font-weight: 600;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            display: inline-block;
          }
          .beck-score.score-minimal { color: #27ae60; }
          .beck-score.score-mild { color: #f39c12; }
          .beck-score.score-moderate { color: #e67e22; }
          .beck-score.score-severe { color: #e74c3c; }
          .beck-interpretation.score-minimal { background: rgba(39,174,96,0.2); color: #27ae60; }
          .beck-interpretation.score-mild { background: rgba(243,156,18,0.2); color: #f39c12; }
          .beck-interpretation.score-moderate { background: rgba(230,126,34,0.2); color: #e67e22; }
          .beck-interpretation.score-severe { background: rgba(231,76,60,0.2); color: #e74c3c; }
          .beck-summary-notes {
            text-align: left;
            background: rgba(255,255,255,0.03);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
          }
          .beck-summary-notes h4 { margin: 0 0 0.5rem; color: #888; font-size: 0.9rem; }
          .beck-legend { font-size: 0.85rem; color: #aaa; line-height: 1.8; }
        </style>
      `;
    },
    choices: [' '],
    data: { module: 'beck_inventories', trial_type: 'summary' },
    on_start: () => {
      if (sessionId) {
        clearProgress(sessionId);
      }
    },
  };
}

function getScoreColor(score, type) {
  const s = parseInt(score) || 0;
  if (type === 'bdi2') {
    if (s <= 13) return 'score-minimal';
    if (s <= 19) return 'score-mild';
    if (s <= 25) return 'score-moderate';
    return 'score-severe';
  } else {
    if (s <= 7) return 'score-minimal';
    if (s <= 15) return 'score-mild';
    if (s <= 25) return 'score-moderate';
    return 'score-severe';
  }
}

export { BDI2_QUESTIONS, BAI_QUESTIONS };
