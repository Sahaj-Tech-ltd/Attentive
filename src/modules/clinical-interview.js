/**
 * Clinical Interview Module
 * Structured intake questionnaire for ADHD assessment
 * 
 * 26 questions across 7 sections:
 * 1. Demographics (Q1-Q4)
 * 2. ADHD History (Q5-Q10)
 * 3. Medical History (Q11-Q14)
 * 4. Family History (Q15-Q17)
 * 5. Mood & Anxiety - PHQ-4 (Q18-Q21)
 * 6. Sleep (Q22-Q24)
 * 7. Substance Use (Q25-Q26)
 * 
 * @see SPEC.md for full specification
 */

import { calculateClinicalScores } from '../scoring/clinical-interview.js';

// Session storage key prefix
const SESSION_STORAGE_KEY = 'ci_progress_';

// PHQ-4 question labels (Q18-Q21)
const PHQ4_LABELS = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying'
];

// Question definitions per SPEC.md
const QUESTIONS = [
    // Section 1: Demographics (Q1-Q4)
    {
        id: 'q1',
        section: 'demographics',
        label: 'What is your age?',
        type: 'survey-text',
        required: true,
        validation: { min: 18, max: 100, type: 'integer' }
    },
    {
        id: 'q2',
        section: 'demographics',
        label: 'What is your sex?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
    },
    {
        id: 'q3',
        section: 'demographics',
        label: 'What is your highest level of education?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Some high school', 'High school diploma', 'Some college', "Associate's degree", "Bachelor's degree", 'Graduate degree', 'Doctorate']
    },
    {
        id: 'q4',
        section: 'demographics',
        label: 'What is your occupation? (optional)',
        type: 'survey-text',
        required: false,
        maxLength: 100
    },

    // Section 2: ADHD History (Q5-Q10)
    {
        id: 'q5',
        section: 'adhd_history',
        label: 'Have you ever been assessed for ADHD?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Yes', 'No', 'Not sure']
    },
    {
        id: 'q6',
        section: 'adhd_history',
        label: 'Have you ever been diagnosed with ADHD or ADD?',
        type: 'survey-multi-choice',
        required: false,
        options: ['Yes, ADHD', 'Yes, ADD', 'No', 'Not sure'],
        showIf: { question: 'q5', value: 'Yes' }
    },
    {
        id: 'q7',
        section: 'adhd_history',
        label: 'At what age did your ADHD symptoms first begin?',
        type: 'survey-text',
        required: true,
        placeholder: 'Enter age in years (e.g., 8) or "Unsure"',
        maxLength: 20
    },
    {
        id: 'q8',
        section: 'adhd_history',
        label: 'Are you currently taking medication for ADHD?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Yes', 'No', 'Prefer not to say']
    },
    {
        id: 'q9',
        section: 'adhd_history',
        label: 'What is the name of your current ADHD medication?',
        type: 'survey-text',
        required: false,
        placeholder: 'Enter medication name',
        maxLength: 100,
        showIf: { question: 'q8', value: 'Yes' }
    },
    {
        id: 'q10',
        section: 'adhd_history',
        label: 'How much do your ADHD symptoms interfere with your daily functioning?',
        type: 'survey-likert',
        required: true,
        scale: ['Not at all', 'A little', 'Moderately', 'Quite a bit', 'Very much']
    },

    // Section 3: Medical History (Q11-Q14)
    {
        id: 'q11',
        section: 'medical_history',
        label: 'Do you have any of the following chronic medical conditions?',
        type: 'survey-multi-choice',
        required: true,
        options: ['None', 'Diabetes', 'Hypertension', 'Thyroid disorder', 'Migraine', 'Other']
    },
    {
        id: 'q12',
        section: 'medical_history',
        label: 'Please describe your chronic condition(s):',
        type: 'survey-text',
        required: false,
        placeholder: 'Describe your condition(s)',
        maxLength: 500,
        showIf: { question: 'q11', notValue: 'None' }
    },
    {
        id: 'q13',
        section: 'medical_history',
        label: 'Are you currently taking any psychiatric medications?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Yes', 'No', 'Not sure']
    },
    {
        id: 'q14',
        section: 'medical_history',
        label: 'Please list your current psychiatric medication(s):',
        type: 'survey-text',
        required: false,
        placeholder: 'Enter medication name(s) and dosage if known',
        maxLength: 500,
        showIf: { question: 'q13', value: 'Yes' }
    },

    // Section 4: Family History (Q15-Q17)
    {
        id: 'q15',
        section: 'family_history',
        label: 'Has a first-degree relative (parent, sibling, or child) been diagnosed with ADHD?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Yes', 'No', 'Unsure']
    },
    {
        id: 'q16',
        section: 'family_history',
        label: 'Which relatives have been diagnosed with ADHD?',
        type: 'survey-multi-choice',
        required: false,
        options: ['Mother', 'Father', 'Sibling', 'Child'],
        multiple: true,
        showIf: { question: 'q15', value: 'Yes' }
    },
    {
        id: 'q17',
        section: 'family_history',
        label: 'Are there other psychiatric conditions that run in your family? (optional)',
        type: 'survey-text',
        required: false,
        placeholder: 'e.g., Depression, Anxiety, Bipolar disorder',
        maxLength: 500
    },

    // Section 5: Mood & Anxiety - PHQ-4 (Q18-Q21)
    {
        id: 'q18',
        section: 'phq4',
        label: PHQ4_LABELS[0],
        type: 'survey-likert',
        required: true,
        scale: ['Never', 'Several days', 'More than half the days', 'Nearly every day'],
        phq4Item: 'q18'
    },
    {
        id: 'q19',
        section: 'phq4',
        label: PHQ4_LABELS[1],
        type: 'survey-likert',
        required: true,
        scale: ['Never', 'Several days', 'More than half the days', 'Nearly every day'],
        phq4Item: 'q19'
    },
    {
        id: 'q20',
        section: 'phq4',
        label: PHQ4_LABELS[2],
        type: 'survey-likert',
        required: true,
        scale: ['Never', 'Several days', 'More than half the days', 'Nearly every day'],
        phq4Item: 'q20'
    },
    {
        id: 'q21',
        section: 'phq4',
        label: PHQ4_LABELS[3],
        type: 'survey-likert',
        required: true,
        scale: ['Never', 'Several days', 'More than half the days', 'Nearly every day'],
        phq4Item: 'q21'
    },

    // Section 6: Sleep (Q22-Q24)
    {
        id: 'q22',
        section: 'sleep',
        label: 'On average, how many hours of sleep do you get per night?',
        type: 'survey-text',
        required: true,
        placeholder: 'Enter a number (e.g., 7.5)',
        validation: { min: 0, max: 24, type: 'float' }
    },
    {
        id: 'q23',
        section: 'sleep',
        label: 'How would you rate your overall sleep quality?',
        type: 'survey-likert',
        required: true,
        scale: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']
    },
    {
        id: 'q24',
        section: 'sleep',
        label: 'How often do you have trouble falling or staying asleep?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
    },

    // Section 7: Substance Use (Q25-Q26)
    {
        id: 'q25',
        section: 'substance_use',
        label: 'How many alcoholic drinks do you typically consume per week?',
        type: 'survey-text',
        required: true,
        placeholder: 'Enter number (0-100)',
        validation: { min: 0, max: 100, type: 'integer' }
    },
    {
        id: 'q26',
        section: 'substance_use',
        label: 'Have you used recreational drugs in the past 30 days?',
        type: 'survey-multi-choice',
        required: true,
        options: ['Yes', 'No', 'Prefer not to say']
    }
];

/**
 * Filter questions based on conditional logic (showIf)
 * @param {Array} questions - All questions
 * @param {Object} responses - Current responses object
 * @returns {Array} Filtered questions that should be shown
 */
function filterConditionalQuestions(questions, responses) {
    return questions.filter(q => {
        if (!q.showIf) return true;
        
        const { question, value, notValue } = q.showIf;
        const response = responses[question];
        
        if (value !== undefined && response === value) return true;
        if (notValue !== undefined && response !== notValue) return true;
        
        return false;
    });
}

/**
 * Save progress to sessionStorage for refresh resilience
 */
function saveProgress(sessionId, currentQuestionIndex, responses) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    const progress = {
        currentQuestion: currentQuestionIndex,
        responses: responses,
        timestamp: Date.now()
    };
    sessionStorage.setItem(key, JSON.stringify(progress));
}

/**
 * Load progress from sessionStorage
 */
function loadProgress(sessionId) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Clear progress from sessionStorage on completion
 */
function clearProgress(sessionId) {
    const key = `${SESSION_STORAGE_KEY}${sessionId}`;
    sessionStorage.removeItem(key);
}

/**
 * Build intro screen trial
 */
function buildIntroTrial() {
    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box clinical-interview-intro">
                <h2>Clinical Interview</h2>
                <p class="interview-description">
                    This intake questionnaire gathers comprehensive information about your 
                    background, medical history, and current symptoms to support your 
                    ADHD assessment.
                </p>
                <div class="interview-info">
                    <p><strong>26 questions</strong> across 7 sections</p>
                    <p>Estimated time: <strong>5-10 minutes</strong></p>
                </div>
                <div class="interview-instructions">
                    <p>• Each question appears on its own screen</p>
                    <p>• Progress is automatically saved</p>
                    <p>• You can skip optional questions</p>
                </div>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to begin</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'clinical_interview', section: 'intro' },
        post_trial_gap: 500
    };
}

/**
 * Build a single question trial
 */
function buildQuestionTrial(question, index, totalQuestions, sessionId) {
    const trial = {
        type: question.type,
        data: {
            module: 'clinical_interview',
            question_id: question.id,
            section: question.section,
            required: question.required
        },
        on_finish: (data) => {
            // Save response to sessionStorage
            const responses = {};
            responses[question.id] = data.response;
            saveProgress(sessionId, index, responses);
        }
    };

    // Build questions array based on plugin type
    if (question.type === 'survey-likert') {
        trial.questions = [question.label];
        trial.options = question.scale.map((label, i) => ({
            value: i,
            text: label
        }));
        trial.scale_width = 100;
        trial.button_select = true;
    } else if (question.type === 'survey-multi-choice') {
        trial.questions = [question.label];
        trial.options = question.options.map(opt => opt);
        trial.button_select = true;
        trial.required = question.required;
    } else if (question.type === 'survey-text') {
        trial.questions = [
            {
                prompt: question.label,
                placeholder: question.placeholder || '',
                rows: 1,
                columns: 40
            }
        ];
        trial.required = question.required;
    }

    return trial;
}

/**
 * Build completion screen trial
 */
function buildCompletionTrial(phq4Score, gad4Score) {
    const phq4Interpretation = getPHQ4Interpretation(phq4Score);
    const gad4Interpretation = getGAD4Interpretation(gad4Score);

    return {
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box clinical-interview-complete">
                <h2>Interview Complete</h2>
                <div class="completion-message">
                    <p>Thank you for completing the clinical interview.</p>
                    <p>Your responses have been recorded and will be used to support your assessment.</p>
                </div>
                <div class="score-summary">
                    <h3>Mood & Anxiety Screening (PHQ-4)</h3>
                    <div class="score-display">
                        <span class="score-value">${phq4Score}</span>
                        <span class="score-max">/12</span>
                    </div>
                    <p class="score-interpretation ${phq4Interpretation.toLowerCase()}">${phq4Interpretation}</p>
                    
                    <h3>Anxiety Screening (GAD-4)</h3>
                    <div class="score-display">
                        <span class="score-value">${gad4Score}</span>
                        <span class="score-max">/6</span>
                    </div>
                    <p class="score-interpretation ${gad4Interpretation.toLowerCase()}">${gad4Interpretation}</p>
                </div>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue to the next assessment</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'clinical_interview', section: 'complete' },
        post_trial_gap: 500
    };
}

/**
 * Get PHQ-4 interpretation label
 */
function getPHQ4Interpretation(score) {
    if (score <= 2) return 'Minimal';
    if (score <= 5) return 'Mild';
    if (score <= 8) return 'Moderate';
    return 'Severe';
}

/**
 * Get GAD-4 interpretation label
 */
function getGAD4Interpretation(score) {
    if (score <= 2) return 'Minimal';
    if (score <= 4) return 'Mild';
    if (score <= 6) return 'Moderate';
    return 'Severe';
}

/**
 * Build the clinical interview timeline
 * @param {Object} jsPsych - jsPsych instance
 * @param {string} sessionId - Session ID (can be null, results won't be saved)
 * @returns {Array} jsPsych timeline array
 */
export function buildClinicalInterviewTimeline(jsPsych, sessionId = null) {
    const timeline = [];
    
    // Add intro screen
    timeline.push(buildIntroTrial());
    
    // Determine starting point based on saved progress
    let startIndex = 0;
    let savedResponses = {};
    
    if (sessionId) {
        const savedProgress = loadProgress(sessionId);
        if (savedProgress && savedProgress.responses) {
            startIndex = savedProgress.currentQuestion || 0;
            savedResponses = savedProgress.responses;
        }
    }
    
    // Add question trials
    for (let i = startIndex; i < QUESTIONS.length; i++) {
        const question = QUESTIONS[i];
        timeline.push(buildQuestionTrial(question, i, QUESTIONS.length, sessionId));
    }
    
    // Add completion screen
    timeline.push({
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box clinical-interview-complete">
                <h2>Interview Complete</h2>
                <div class="completion-message">
                    <p>Thank you for completing the clinical interview.</p>
                    <p>Your responses have been recorded and will be used to support your assessment.</p>
                </div>
                <div class="score-summary">
                    <h3>Mood & Anxiety Screening (PHQ-4)</h3>
                    <p class="score-note">Scores calculated upon completion</p>
                </div>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue to the next assessment</p>
            </div>
        `,
        choices: [' '],
        data: { module: 'clinical_interview', section: 'complete' },
        post_trial_gap: 500
    });
    
    return timeline;
}

/**
 * Extract PHQ-4 responses from jsPsych data
 */
function calculatePHQ4FromData(data) {
    const responses = { q18: 0, q19: 0, q20: 0, q21: 0 };
    
    data.forEach(d => {
        if (d.question_id === 'q18' && d.response !== undefined) {
            responses.q18 = typeof d.response === 'object' ? d.response : parseInt(d.response) || 0;
        }
        if (d.question_id === 'q19' && d.response !== undefined) {
            responses.q19 = typeof d.response === 'object' ? d.response : parseInt(d.response) || 0;
        }
        if (d.question_id === 'q20' && d.response !== undefined) {
            responses.q20 = typeof d.response === 'object' ? d.response : parseInt(d.response) || 0;
        }
        if (d.question_id === 'q21' && d.response !== undefined) {
            responses.q21 = typeof d.response === 'object' ? d.response : parseInt(d.response) || 0;
        }
    });
    
    return responses;
}

/**
 * Build completion screen HTML
 */
function buildCompletionHTML(scores) {
    const phq4Class = scores.phq4_interpretation.toLowerCase();
    const gad4Class = scores.gad4_interpretation.toLowerCase();
    
    return `
        <div class="focus-box clinical-interview-complete">
            <h2>Interview Complete</h2>
            <div class="completion-message">
                <p>Thank you for completing the clinical interview.</p>
                <p>Your responses have been recorded and will be used to support your assessment.</p>
            </div>
            <div class="score-summary">
                <h3>Mood & Anxiety Screening (PHQ-4)</h3>
                <div class="score-display">
                    <span class="score-value">${scores.phq4_total}</span>
                    <span class="score-max">/12</span>
                </div>
                <p class="score-interpretation ${phq4Class}">${scores.phq4_interpretation}</p>
                
                <h3>Anxiety Screening (GAD-4)</h3>
                <div class="score-display">
                    <span class="score-value">${scores.gad4_total}</span>
                    <span class="score-max">/6</span>
                </div>
                <p class="score-interpretation ${gad4Class}">${scores.gad4_interpretation}</p>
            </div>
            <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue to the next assessment</p>
        </div>
    `;
}

/**
 * Aggregate clinical interview results from jsPsych data
 * @param {Array} data - jsPsych data array
 * @returns {Object} Aggregated results object
 */
export function aggregateClinicalInterviewResults(data) {
    const clinicalData = data.filter(d => d.module === 'clinical_interview');
    
    const responses = {};
    clinicalData.forEach(d => {
        if (d.question_id) {
            responses[d.question_id] = d.response;
        }
    });
    
    // Build results object per data model in SPEC.md
    const results = {
        demographics: {
            age: parseAgeResponse(responses.q1),
            sex: responses.q2 || null,
            education: responses.q3 || null,
            occupation: responses.q4 || null
        },
        adhd_history: {
            previously_assessed: responses.q5 || null,
            previous_diagnosis: responses.q6 || null,
            symptom_onset_age: responses.q7 || null,
            current_medication: responses.q8 || null,
            medication_name: responses.q9 || null,
            symptom_interference: parseInt(responses.q10) || null
        },
        medical_history: {
            conditions: parseConditions(responses.q11),
            condition_details: responses.q12 || null,
            psychiatric_medications: responses.q13 || null,
            psychiatric_med_details: responses.q14 || null
        },
        family_history: {
            relative_with_adhd: responses.q15 || null,
            which_relatives: parseRelatives(responses.q16),
            other_psychiatric: responses.q17 || null
        },
        phq4: {
            q18_interest: parsePHQItem(responses.q18),
            q19_depressed: parsePHQItem(responses.q19),
            q20_anxious: parsePHQItem(responses.q20),
            q21_worry: parsePHQItem(responses.q21),
            phq4_total: 0,
            phq4_interpretation: 'Minimal'
        },
        sleep: {
            hours_per_night: parseFloat(responses.q22) || null,
            sleep_quality: parseInt(responses.q23) || null,
            sleep_disorder: responses.q24 || null
        },
        substance_use: {
            alcohol_drinks_per_week: parseInt(responses.q25) || 0,
            recreational_drugs_30days: responses.q26 || null
        },
        metadata: {
            question_count: 26,
            optional_skipped: countOptionalSkipped(responses),
            completed_at: new Date().toISOString()
        }
    };
    
    // Calculate PHQ-4 and GAD-4 scores
    const phq4Data = {
        q18: results.phq4.q18_interest,
        q19: results.phq4.q19_depressed,
        q20: results.phq4.q20_anxious,
        q21: results.phq4.q21_worry
    };
    
    const scores = calculateClinicalScores(phq4Data);
    results.phq4.phq4_total = scores.phq4_total;
    results.phq4.phq4_interpretation = scores.phq4_interpretation;
    
    return results;
}

// Helper functions for parsing responses
function parseAgeResponse(value) {
    const num = parseInt(value);
    return (!isNaN(num) && num >= 18 && num <= 100) ? num : null;
}

function parseConditions(value) {
    if (!value) return [];
    if (value === 'None') return ['None'];
    if (Array.isArray(value)) return value;
    return [value];
}

function parseRelatives(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
}

function parsePHQItem(value) {
    const num = parseInt(value);
    return (!isNaN(num) && num >= 0 && num <= 3) ? num : 0;
}

function countOptionalSkipped(responses) {
    let count = 0;
    if (!responses.q4) count++; // occupation
    if (!responses.q6) count++; // previous diagnosis
    if (!responses.q9) count++; // medication name
    if (!responses.q12) count++; // condition details
    if (!responses.q14) count++; // psychiatric med details
    if (!responses.q16) count++; // which relatives
    if (!responses.q17) count++; // other psychiatric
    return count;
}

/**
 * Get progress info for resume functionality
 */
export function getClinicalInterviewProgress(sessionId) {
    return loadProgress(sessionId);
}

export { QUESTIONS, SESSION_STORAGE_KEY };