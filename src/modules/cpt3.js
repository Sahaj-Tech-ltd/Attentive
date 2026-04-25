/**
 * CPT-3 Go/No-Go Module
 * Conners Continuous Performance Test — vigilance task
 * 
 * 300 trials total:
 * - Block 1 (slow): 150 trials, 700ms stimulus, ISI 1000-4000ms
 * - Block 2 (fast): 150 trials, 300ms stimulus, ISI 500-1500ms
 * - 85% Go (X), 15% No-Go (XX)
 * - Fast block double-X trigger: 20% chance on Go trials
 * - Variable ISI within each block
 */

import { dPrime, criterionC } from '../scoring/signal-detection.js';
import { saveModuleResults, saveTrials } from '../storage/db.js';

// CPT-3 Configuration
const CONFIG = {
  totalTrials: 300,
  blockSize: 150,
  goProbability: 0.85,
  noGoProbability: 0.15,
  slowStimulusDuration: 700,
  fastStimulusDuration: 300,
  slowISIRange: [1000, 4000], // ms
  fastISIRange: [500, 1500],  // ms
  doubleXChance: 0.20,        // 20% chance in fast block
  feedbackDuration: 200,
};

// Generate trial sequence for a block
function generateBlockTrials(blockType) {
  const trials = [];
  const n = CONFIG.blockSize;
  const goCount = Math.round(n * CONFIG.goProbability);
  const noGoCount = n - goCount;

  // Create trial type array
  const types = [
    ...Array(goCount).fill('go'),
    ...Array(noGoCount).fill('nogo'),
  ];

  // Shuffle using Fisher-Yates
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  // Create trials with stimuli
  for (let i = 0; i < n; i++) {
    const type = types[i];
    let stimulus = 'X';
    let isDoubleX = false;

    if (type === 'nogo') {
      stimulus = 'XX';
      isDoubleX = true;
    } else if (blockType === 'fast' && Math.random() < CONFIG.doubleXChance) {
      // Double-X trigger on Go trials in fast block
      stimulus = 'XX';
      isDoubleX = true;
    }

    // Variable ISI
    const [minISI, maxISI] = blockType === 'slow'
      ? CONFIG.slowISIRange
      : CONFIG.fastISIRange;
    const isi = minISI + Math.random() * (maxISI - minISI);

    const stimulusDuration = blockType === 'slow'
      ? CONFIG.slowStimulusDuration
      : CONFIG.fastStimulusDuration;

    trials.push({
      id: `b${blockType === 'slow' ? 1 : 2}_${i + 1}`,
      blockType,
      trialIndex: i + 1,
      type,           // 'go' or 'nogo'
      stimulus,
      isDoubleX,
      stimulusDuration,
      isi,
      correctResponse: null,  // will be set during execution
      reactionTime: null,
    });
  }

  return trials;
}

// Calculate CPT-3 scores from trial data
export function calculateCPTScores(trials) {
  const goTrials = trials.filter(t => t.type === 'go');
  const noGoTrials = trials.filter(t => t.type === 'nogo');

  const hits = goTrials.filter(t => t.correctResponse === true).length;
  const misses = goTrials.filter(t => t.correctResponse === false).length;
  const falseAlarms = noGoTrials.filter(t => t.correctResponse === false).length;
  const correctRejections = noGoTrials.filter(t => t.correctResponse === true).length;

  const hitRate = hits / goTrials.length;
  const faRate = falseAlarms / noGoTrials.length;
  const goTrialsRTs = goTrials.filter(t => t.reactionTime !== null).map(t => t.reactionTime);

  const d = dPrime(hits, misses, falseAlarms, correctRejections);
  const c = criterionC(hits, misses, falseAlarms, correctRejections);

  // Block-level stats
  const block1Trials = trials.filter(t => t.blockType === 'slow');
  const block2Trials = trials.filter(t => t.blockType === 'fast');

  const block1Stats = calculateBlockStats(block1Trials);
  const block2Stats = calculateBlockStats(block2Trials);

  // Overall RT stats
  const meanRT = goTrialsRTs.length > 0
    ? goTrialsRTs.reduce((a, b) => a + b, 0) / goTrialsRTs.length
    : 0;

  const sdRT = goTrialsRTs.length > 1
    ? Math.sqrt(
        goTrialsRTs.reduce((sum, rt) => sum + (rt - meanRT) ** 2, 0) /
        (goTrialsRTs.length - 1)
      )
    : 0;

  return {
    // Signal detection
    hits,
    misses,
    falseAlarms,
    correctRejections,
    hitRate: Math.round(hitRate * 100) / 100,
    faRate: Math.round(faRate * 100) / 100,
    dPrime: Math.round(d * 100) / 100,
    criterionC: Math.round(c * 100) / 100,

    // Counts
    totalTrials: trials.length,
    goTrials: goTrials.length,
    noGoTrials: noGoTrials.length,

    // RT stats
    meanRT: Math.round(meanRT),
    sdRT: Math.round(sdRT),
    minRT: goTrialsRTs.length > 0 ? Math.min(...goTrialsRTs) : 0,
    maxRT: goTrialsRTs.length > 0 ? Math.max(...goTrialsRTs) : 0,

    // Block comparisons
    block1Slow: block1Stats,
    block2Fast: block2Stats,

    // T-scores (using Conners CPT-3 normative approximations)
    tScoreDPrime: computeTScore(dPrime, 'dprime'),
    tScoreHitRate: computeTScore(hitRate, 'hitrate'),
    tScoreFA: computeTScore(faRate, 'fa'),
    tScoreMeanRT: computeTScore(meanRT, 'meanrt'),
  };
}

function calculateBlockStats(blockTrials) {
  const goTrials = blockTrials.filter(t => t.type === 'go');
  const noGoTrials = blockTrials.filter(t => t.type === 'nogo');

  const hits = goTrials.filter(t => t.correctResponse === true).length;
  const misses = goTrials.filter(t => t.correctResponse === false).length;
  const falseAlarms = noGoTrials.filter(t => t.correctResponse === false).length;
  const correctRejections = noGoTrials.filter(t => t.correctResponse === true).length;

  const goRTs = goTrials.filter(t => t.reactionTime !== null).map(t => t.reactionTime);
  const meanRT = goRTs.length > 0
    ? goRTs.reduce((a, b) => a + b, 0) / goRTs.length
    : 0;

  return {
    hits,
    misses,
    falseAlarms,
    correctRejections,
    hitRate: Math.round((hits / goTrials.length) * 100) / 100,
    faRate: Math.round((falseAlarms / noGoTrials.length) * 100) / 100,
    meanRT: Math.round(meanRT),
    totalTrials: blockTrials.length,
  };
}

// Approximate T-scores (simplified normative conversion)
function computeTScore(value, metric) {
  // Using approximate means and SDs from Conners CPT-3 norms
  const norms = {
    dprime: { mean: 2.5, sd: 0.8 },   // d' typically 2-4 for normal
    hitrate: { mean: 0.95, sd: 0.05 },
    fa: { mean: 0.08, sd: 0.05 },
    meanrt: { mean: 400, sd: 80 },    // ms
  };

  const { mean, sd } = norms[metric];
  if (!sd || sd === 0) return 50;
  return Math.round(50 + 10 * ((value - mean) / sd));
}

// Build CPT-3 timeline
export function buildCPTTimeline(jsPsych, sessionId) {
  const timeline = [];

  // Instructions for CPT-3
  timeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Conners CPT-3</h2>
        <p class="instructions">
          This test measures your attention and vigilance.<br><br>
          You will see letters appear on the screen one at a time.<br><br>
          Press <strong>SPACEBAR</strong> as quickly as possible when you see <strong style="color:#e74c3c;">X</strong><br><br>
          Do <strong>NOT</strong> press when you see <strong style="color:#e74c3c;">XX</strong> (double X)<br><br>
          Be sure to respond to X quickly and accurately.
        </p>
        <p style="margin-top: 2rem; font-size: 1.1rem;">
          Press <strong>SPACE</strong> to begin Block 1 (Slow)
        </p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
  });

  // Block 1: Slow block (700ms stimulus, 1000-4000ms ISI)
  const block1Trials = generateBlockTrials('slow');
  timeline.push(...buildCPTBlockTrials(jsPsych, block1Trials, 'slow'));

  // Rest between blocks
  timeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>Block 1 Complete</h2>
        <p>Take a short break. Rest your eyes.</p>
        <p>When ready, press <strong>SPACE</strong> to begin Block 2 (Fast)</p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #888;">
          Note: In the next block, stimuli will appear faster.
        </p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 1000,
  });

  // Block 2: Fast block (300ms stimulus, 500-1500ms ISI, double-X trigger)
  const block2Trials = generateBlockTrials('fast');
  timeline.push(...buildCPTBlockTrials(jsPsych, block2Trials, 'fast'));

  // Results screen
  timeline.push({
    type: 'html-keyboard-response',
    stimulus: () => {
      const allTrials = [...block1Trials, ...block2Trials];
      // Reconstruct with responses from jsPsych data
      const trialData = jsPsych.data.get().filter({ module: 'cpt3' }).values();
      
      const scoredTrials = allTrials.map(t => {
        const match = trialData.find(d => d.trial_id === t.id);
        return {
          ...t,
          correctResponse: match?.correct,
          reactionTime: match?.rt ?? null,
        };
      });

      const scores = calculateCPTScores(scoredTrials);
      
      // Save to IndexedDB
      saveModuleResults(sessionId, 'cpt3', scores).catch(console.error);
      saveTrials(sessionId, scoredTrials).catch(console.error);

      return buildResultsHTML(scores);
    },
    choices: [' '],
  });

  return timeline;
}

function buildCPTBlockTrials(jsPsych, trials, blockType) {
  const blockTimeline = [];

  // Block start message
  blockTimeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>${blockType === 'slow' ? 'Block 1: Slow' : 'Block 2: Fast'}</h2>
        <p>${blockType === 'slow' 
          ? 'Stimuli will be shown for 700ms each.' 
          : 'Stimuli will be shown for 300ms each. Stay alert!'}</p>
        <p>Remember: Press SPACE for <strong>X</strong>, withhold for <strong>XX</strong></p>
        <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to start</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
  });

  // Generate actual CPT trials using jspsych-html-keyboard-response
  trials.forEach((trial, index) => {
    // ISI before trial
    if (trial.isi > 0) {
      blockTimeline.push({
        type: 'html-keyboard-response',
        stimulus: '<div id="stimulus-display" style="color:#888;">+</div>',
        choices: jsPsych.NO_KEYS,
        trial_duration: trial.isi,
        data: { placeholder: true },
      });
    }

    // Stimulus trial
    blockTimeline.push({
      type: 'html-keyboard-response',
      stimulus: `<div id="stimulus-display">${trial.stimulus}</div>`,
      choices: [' '],
      trial_duration: trial.stimulusDuration,
      data: {
        module: 'cpt3',
        trial_id: trial.id,
        block_type: trial.blockType,
        trial_index: trial.trialIndex,
        stimulus_type: trial.type,
        stimulus: trial.stimulus,
        is_double_x: trial.isDoubleX,
        stimulus_duration: trial.stimulusDuration,
        isi: trial.isi,
        correct: null,
        rt: null,
        response: null,
      },
      on_start: () => {
        // Store trial start time for RT calculation
        jsPsych.setProgressBarData({ trialStart: performance.now() });
      },
      on_finish: (data) => {
        const response = data.response;
        const rt = data.rt;
        const isGo = trial.type === 'go';

        // Determine correctness
        // For Go trials: response (spacebar) = hit, no response = miss
        // For No-Go trials: response = false alarm, no response = correct rejection
        let correct = null;
        if (isGo) {
          correct = response === ' ' ? true : false;
        } else {
          // No-Go: response is incorrect, no response is correct
          correct = response !== ' ' ? false : true;
        }

        data.correct = correct;
        data.rt = rt;
        data.response = response;

        // Show brief feedback for errors
        if (correct === false) {
          jsPsych.showProgressBar(); // Placeholder for visual feedback
        }
      },
    });
  });

  // Block complete summary (brief)
  const goTrials = trials.filter(t => t.type === 'go');
  blockTimeline.push({
    type: 'html-keyboard-response',
    stimulus: `
      <div class="focus-box">
        <h2>${blockType === 'slow' ? 'Block 1' : 'Block 2'} Complete</h2>
        <p>${goTrials.length} Go trials completed.</p>
        <p>Press <strong>SPACE</strong> to continue.</p>
      </div>
    `,
    choices: [' '],
    post_trial_gap: 500,
  });

  return blockTimeline;
}

function buildResultsHTML(scores) {
  const interpretation = (t) => {
    if (t < 41) return { label: 'Very Low', color: '#3498db' };
    if (t <= 59) return { label: 'Average', color: '#27ae60' };
    if (t <= 64) return { label: 'Mildly Elevated', color: '#f39c12' };
    if (t <= 69) return { label: 'Moderately Elevated', color: '#e67e22' };
    return { label: 'Markedly Elevated', color: '#e74c3c' };
  };

  const dprimeInterp = interpretation(scores.tScoreDPrime);
  const hitRateInterp = interpretation(scores.tScoreHitRate);
  const faInterp = interpretation(scores.tScoreFA);
  const rtInterp = interpretation(scores.tScoreMeanRT);

  return `
    <div class="focus-box" style="min-width: 550px;">
      <h2>CPT-3 Results</h2>
      
      <div style="text-align: left; margin-top: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Signal Detection</h3>
        <table>
          <tr><th>Measure</th><th>Raw Score</th><th>T-Score</th><th>Interpretation</th></tr>
          <tr>
            <td>d' (sensitivity)</td>
            <td>${scores.dPrime}</td>
            <td style="color: ${dprimeInterp.color}">${scores.tScoreDPrime}</td>
            <td style="color: ${dprimeInterp.color}">${dprimeInterp.label}</td>
          </tr>
          <tr>
            <td>c (response criterion)</td>
            <td>${scores.criterionC}</td>
            <td>—</td>
            <td>${scores.criterionC > 0 ? 'Conservative' : 'Liberal'}</td>
          </tr>
          <tr>
            <td>Hit Rate</td>
            <td>${(scores.hitRate * 100).toFixed(1)}%</td>
            <td style="color: ${hitRateInterp.color}">${scores.tScoreHitRate}</td>
            <td style="color: ${hitRateInterp.color}">${hitRateInterp.label}</td>
          </tr>
          <tr>
            <td>False Alarm Rate</td>
            <td>${(scores.faRate * 100).toFixed(1)}%</td>
            <td style="color: ${faInterp.color}">${scores.tScoreFA}</td>
            <td style="color: ${faInterp.color}">${faInterp.label}</td>
          </tr>
        </table>

        <h3 style="margin: 1.5rem 0 1rem;">Trial Counts</h3>
        <table>
          <tr><th>Category</th><th>Count</th></tr>
          <tr><td>Total Trials</td><td>${scores.totalTrials}</td></tr>
          <tr><td>Go Trials (X)</td><td>${scores.goTrials}</td></tr>
          <tr><td>No-Go Trials (XX)</td><td>${scores.noGoTrials}</td></tr>
          <tr><td>Hits</td><td>${scores.hits}</td></tr>
          <tr><td>Misses</td><td>${scores.misses}</td></tr>
          <tr><td>False Alarms</td><td>${scores.falseAlarms}</td></tr>
          <tr><td>Correct Rejections</td><td>${scores.correctRejections}</td></tr>
        </table>

        <h3 style="margin: 1.5rem 0 1rem;">Reaction Time</h3>
        <table>
          <tr><th>Measure</th><th>Value</th><th>T-Score</th><th>Interpretation</th></tr>
          <tr>
            <td>Mean RT</td>
            <td>${scores.meanRT} ms</td>
            <td style="color: ${rtInterp.color}">${scores.tScoreMeanRT}</td>
            <td style="color: ${rtInterp.color}">${rtInterp.label}</td>
          </tr>
          <tr><td>SD RT</td><td>${scores.sdRT} ms</td><td>—</td><td>—</td></tr>
          <tr><td>Min RT</td><td>${scores.minRT} ms</td><td>—</td><td>—</td></tr>
          <tr><td>Max RT</td><td>${scores.maxRT} ms</td><td>—</td><td>—</td></tr>
        </table>

        <h3 style="margin: 1.5rem 0 1rem;">Block Comparison</h3>
        <table>
          <tr><th>Block</th><th>Hits</th><th>Misses</th><th>FA</th><th>CR</th><th>Hit Rate</th><th>Mean RT</th></tr>
          <tr>
            <td>Block 1 (Slow)</td>
            <td>${scores.block1Slow.hits}</td>
            <td>${scores.block1Slow.misses}</td>
            <td>${scores.block1Slow.falseAlarms}</td>
            <td>${scores.block1Slow.correctRejections}</td>
            <td>${(scores.block1Slow.hitRate * 100).toFixed(1)}%</td>
            <td>${scores.block1Slow.meanRT} ms</td>
          </tr>
          <tr>
            <td>Block 2 (Fast)</td>
            <td>${scores.block2Fast.hits}</td>
            <td>${scores.block2Fast.misses}</td>
            <td>${scores.block2Fast.falseAlarms}</td>
            <td>${scores.block2Fast.correctRejections}</td>
            <td>${(scores.block2Fast.hitRate * 100).toFixed(1)}%</td>
            <td>${scores.block2Fast.meanRT} ms</td>
          </tr>
        </table>
      </div>

      <p style="margin-top: 2rem;">Press <strong>SPACE</strong> to continue</p>
    </div>
  `;
}

export { CONFIG as CPT3_CONFIG };
