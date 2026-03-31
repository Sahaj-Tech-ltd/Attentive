export function buildTimeline(jsPsych) {
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
                    <li>D-KEFS + Beck + BRIEF-A</li>
                    <li>Trail Making A & B</li>
                    <li>Personality Assessment (PAI)</li>
                    <li>Conners CPT-3 (Attention)</li>
                </ol>
                <p style="margin-top: 2rem; font-size: 1.1rem;">
                    Press <strong>SPACE</strong> to begin
                </p>
            </div>
        `,
        choices: [' '],
        post_trial_gap: 500
    });

    // Future modules will be imported and pushed here:
    // timeline.push(...buildClinicalInterview(jsPsych));
    // timeline.push(...buildWAIS(jsPsych));
    // timeline.push(...buildDKEFS(jsPsych));
    // timeline.push(...buildTrailMaking(jsPsych));
    // timeline.push(...buildPAI(jsPsych));
    // timeline.push(...buildCPT(jsPsych));

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
