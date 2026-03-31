import 'jspsych/css/jspsych.css';
import initJsPsych from 'jspsych';
import { buildTimeline } from './timeline.js';
import { initDB, saveSession, saveModuleResults } from './storage/db.js';
import { exportResults } from './utils/export.js';

const jsPsych = initJsPsych({
    on_finish: async () => {
        const data = jsPsych.data.get().values();
        const sessionId = await saveSession('participant', data);
        console.log('Assessment complete. Session ID:', sessionId);
        exportResults(data, 'Anchor_Assessment');
    },
    on_trial_start: () => {
        jsPsych.display_element.style.cursor = 'none';
    },
    on_trial_finish: () => {
        jsPsych.display_element.style.cursor = 'auto';
    }
});

const timeline = buildTimeline(jsPsych);

jsPsych.run(timeline);
