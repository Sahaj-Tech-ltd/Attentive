import 'jspsych/css/jspsych.css';
import { initJsPsych } from 'jspsych';
import { buildTimeline } from './timeline.js';
import { initDB, saveSession, saveModuleResults, saveTrials } from './storage/db.js';
import { exportResults } from './utils/export.js';
import { calculateCPTScores } from './modules/cpt3.js';
import { aggregateClinicalInterviewResults } from './modules/clinical-interview.js';
import { aggregateWAIS4Results, getWAIS4Results } from './modules/wais4.js';
import { aggregateTrailMakingResults } from './modules/trail-making.js';
import { aggregateDKEFSResults, getDKEFSResults } from './modules/dkefs.js';
import { aggregateBeckResults } from './modules/beck.js';

let globalSessionId = null;

const jsPsych = initJsPsych({
    on_finish: async () => {
        const data = jsPsych.data.get().values();
        
        // Collect Clinical Interview data
        const ciTrials = data.filter(d => d.module === 'clinical_interview' && d.question_id);
        if (ciTrials.length > 0) {
            const results = aggregateClinicalInterviewResults(data);
            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'clinical_interview', results);
            }
        }
        
        // Collect CPT-3 trial data
        const cptTrials = data.filter(d => d.module === 'cpt3');
        if (cptTrials.length > 0) {
            const scores = calculateCPTScores(cptTrials.map(t => ({
                id: t.trial_id,
                blockType: t.block_type,
                trialIndex: t.trial_index,
                type: t.stimulus_type,
                stimulus: t.stimulus,
                isDoubleX: t.is_double_x,
                stimulusDuration: t.stimulus_duration,
                isi: t.isi,
                correctResponse: t.correct,
                reactionTime: t.rt,
            })));
            
            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'cpt3', scores);
                await saveTrials(globalSessionId, cptTrials.map(t => ({
                    trial_id: t.trial_id,
                    block_type: t.block_type,
                    trial_index: t.trial_index,
                    stimulus_type: t.stimulus_type,
                    stimulus: t.stimulus,
                    is_double_x: t.is_double_x,
                    correct: t.correct,
                    rt: t.rt,
                    response: t.response,
                })));
            }
        }
        
        // Collect WAIS-IV trial data
        const waisTrials = data.filter(d => d.module === 'wais4');
        if (waisTrials.length > 0) {
            const waisResults = getWAIS4Results();
            const aggregatedResults = aggregateWAIS4Results(waisResults);
            
            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'wais4', aggregatedResults);
                
                // Save WAIS-IV trial data
                const waisTrialRecords = [];
                waisTrials.forEach((t, idx) => {
                    if (t.subtest === 'dsf' || t.subtest === 'dsb') {
                        waisTrialRecords.push({
                            trial_type: 'wais4',
                            subtest: t.subtest,
                            length: t.length,
                            trial: t.trial,
                            correct: t.correctResponse ? 1 : 0,
                            user_response: t.user_response || '',
                            rt_ms: t.rt || 0
                        });
                    } else if (t.subtest === 'coding' && t.correctResponse !== null) {
                        waisTrialRecords.push({
                            trial_type: 'wais4',
                            subtest: 'coding',
                            correct_digit: t.correct_digit,
                            selected_digit: t.selected_digit,
                            rt_ms: t.rt || 0,
                            correct: t.correctResponse ? 1 : 0
                        });
                    }
                });
                
                if (waisTrialRecords.length > 0) {
                    await saveTrials(globalSessionId, waisTrialRecords);
                }
            }
        }
        
        // Collect Trail Making A & B trial data
        const tmtTrials = data.filter(d => d.module === 'trail_making');
        if (tmtTrials.length > 0) {
            const tmtResults = aggregateTrailMakingResults(data);

            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'trail_making', tmtResults);

                // Save Trail Making per-click trial data
                const tmtTrialRecords = [];
                tmtTrials.forEach(t => {
                    if (t.click_data && Array.isArray(t.click_data)) {
                        t.click_data.forEach(click => {
                            tmtTrialRecords.push({
                                trial_type: 'trail_making',
                                subtest: t.subtest,
                                target: click.target,
                                expected_target: click.expected_target,
                                x: click.x,
                                y: click.y,
                                rt_ms: click.rt_ms,
                                correct: click.correct ? 1 : 0,
                                click_number: click.click_number
                            });
                        });
                    }
                });

                if (tmtTrialRecords.length > 0) {
                    await saveTrials(globalSessionId, tmtTrialRecords);
                }
            }
        }

        // Collect D-KEFS Verbal Fluency trial data
        const dkefsTrials = data.filter(d => d.module === 'dkefs_verbal_fluency' && d.trial_type === 'fluency');
        if (dkefsTrials.length > 0) {
            const dkefsResults = aggregateDKEFSResults(data);

            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'dkefs_verbal_fluency', dkefsResults);

                // Save per-subtest trial data
                const dkefsTrialRecords = dkefsTrials.map(t => ({
                    trial_type: 'dkefs_verbal_fluency',
                    subtest: t.subtest,
                    word_count: t.word_count || 0,
                    words: t.words || [],
                    errors: t.errors || 0,
                    duration_ms: t.duration_ms || 60000
                }));

                if (dkefsTrialRecords.length > 0) {
                    await saveTrials(globalSessionId, dkefsTrialRecords);
                }
            }
        }

        // Collect Beck Inventories (BDI-II + BAI) trial data
        const beckTrials = data.filter(d => d.module === 'beck_inventories' && d.question_id);
        if (beckTrials.length > 0) {
            const beckResults = aggregateBeckResults(data);

            if (globalSessionId) {
                await saveModuleResults(globalSessionId, 'beck_inventories', beckResults);
            }
        }

        if (globalSessionId) {
            console.log('Assessment complete. Session ID:', globalSessionId);
        }
        exportResults(data, 'Anchor_Assessment');
    },
    on_trial_start: () => {
        jsPsych.display_element.style.cursor = 'none';
    },
    on_trial_finish: () => {
        jsPsych.display_element.style.cursor = 'auto';
    }
});

// Initialize database and session before running
async function initAndRun() {
    await initDB();
    const sessionId = await saveSession('participant', { module: 'anchor_full' });
    globalSessionId = sessionId;
    
    const timeline = buildTimeline(jsPsych, sessionId);
    jsPsych.run(timeline);
}

initAndRun().catch(err => {
    console.error('Failed to initialize:', err);
    // Fallback: run without DB
    const timeline = buildTimeline(jsPsych, null);
    jsPsych.run(timeline);
});
