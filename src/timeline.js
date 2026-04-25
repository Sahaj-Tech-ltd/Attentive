import { buildCPTTimeline } from './modules/cpt3.js';
import { buildClinicalInterviewTimeline } from './modules/clinical-interview.js';
import { buildWAISIVTimeline } from './modules/wais4.js';
import { buildTrailMakingTimeline } from './modules/trail-making.js';
import { buildDKEFSVerbalFluencyTimeline } from './modules/dkefs.js';
import { buildBeckInventoriesTimeline } from './modules/beck.js';
import { buildBriefATimeline } from './modules/brief-a.js';
import { buildPAITimeline } from './modules/pai.js';
import { buildStroopTimeline } from './modules/stroop.js';

export function buildTimeline(jsPsych, sessionId = null) {
    const timeline = [];

    timeline.push({
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h1>Anchor</h1>
                <p>Comprehensive ADHD/ADD Assessment Platform</p>
                <p style="font-size: 0.9rem; color: #888;">
                    This tool is a screening instrument only.<br>
                    It does not provide a clinical diagnosis.
                </p>
                <p style="margin-top: 2rem;">
                    <strong>Assessment Modules:</strong>
                </p>
                <ol style="text-align: left; display: inline-block; line-height: 2;">
                    <li>Clinical Interview</li>
                    <li>WAIS-IV (Cognitive)</li>
                    <li>Trail Making A & B</li>
                    <li>Conners CPT-3 (Attention)</li>
                    <li>D-KEFS + Beck + BRIEF-A</li>
                    <li>Personality Assessment (PAI)</li>
                    <li>Victoria Stroop (Executive Function)</li>
                </ol>
                <p style="margin-top: 2rem; font-size: 1.1rem;">
                    Press <strong>SPACE</strong> to begin
                </p>
            </div>
        `,
        choices: [' '],
        post_trial_gap: 500
    });

    // Clinical Interview Module — runs before CPT-3
    if (sessionId) {
        timeline.push(...buildClinicalInterviewTimeline(jsPsych, sessionId));
    }

    // WAIS-IV Module — Digit Span Forward/Backward + Coding/Symbol Search
    if (sessionId) {
        timeline.push(...buildWAISIVTimeline(jsPsych, sessionId));
    }

    // Trail Making A & B Module
    if (sessionId) {
        timeline.push(...buildTrailMakingTimeline(jsPsych, sessionId));
    }

    // D-KEFS Verbal Fluency Module
    if (sessionId) {
        timeline.push(...buildDKEFSVerbalFluencyTimeline(jsPsych, sessionId));
    }

    // Beck Inventories (BDI-II + BAI)
    if (sessionId) {
        timeline.push(...buildBeckInventoriesTimeline(jsPsych, sessionId));
    }

    // BRIEF-A (Behavior Rating Inventory of Executive Function – Adult)
    if (sessionId) {
        timeline.push(...buildBriefATimeline(jsPsych, sessionId));
    }

    // PAI (Personality Assessment Inventory)
    if (sessionId) {
        timeline.push(...buildPAITimeline(jsPsych, sessionId));
    }

    // CPT-3 Module — only add if sessionId is available
    if (sessionId) {
        timeline.push(...buildCPTTimeline(jsPsych, sessionId));
    }

    // Victoria Stroop Test — executive function / inhibitory control
    if (sessionId) {
        timeline.push(...buildStroopTimeline(jsPsych, sessionId));
    }

    // Future modules will be imported and pushed here:
    // timeline.push(...buildClinicalInterview(jsPsych));
    // timeline.push(...buildDKEFS(jsPsych));
    // timeline.push(...buildTrailMaking(jsPsych));
    // timeline.push(...buildPAI(jsPsych));

    timeline.push({
        type: 'html-keyboard-response',
        stimulus: `
            <div class="focus-box">
                <h2>Assessment Complete</h2>
                <p>Thank you for completing the assessment.</p>
                <p>Your results have been saved locally.</p>
                <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to view/export results.</p>
            </div>
        `,
        choices: [' ']
    });

    return timeline;
}
