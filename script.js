// Configuration Defaults
const CONFIG = {
    totalTrials: 300,
    targetPct: 20,
    slowDuration: 700,
    fastDuration: 300,
    isi: 300,
    doubleXProb: 0.2
};

// Global State
let sessionData = {
    participantName: '',
    startTime: null,
    trials: []
};

let currentTrialIndex = 0;
let trialTimeout = null;
let trials = [];
let isTestRunning = false;
let responseRegistered = false;
let stimulusOnsetTime = 0;

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    name: document.getElementById('name-screen'),
    countdown: document.getElementById('countdown-screen'),
    test: document.getElementById('test-screen'),
    results: document.getElementById('results-screen')
};

const els = {
    stimulus: document.getElementById('stimulus-display'),
    countdown: document.getElementById('countdown'),
    nameInput: document.getElementById('participant-name'),
    settingsModal: document.getElementById('settings-modal'),
    resultsTable: document.getElementById('results-table'),
    keystrokeIndicator: document.getElementById('keystroke-indicator')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-start-initial').addEventListener('click', startSequence);
    document.getElementById('btn-settings').addEventListener('click', () => els.settingsModal.showModal());
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
    document.getElementById('btn-start-test').addEventListener('click', startCountdown);
    document.getElementById('btn-restart').addEventListener('click', () => location.reload());
    document.getElementById('btn-export').addEventListener('click', exportResults);
    
    // Keyboard listener
    document.addEventListener('keydown', handleInput);
    document.addEventListener('keyup', handleKeyUp);
});

// ... [existing saveSettings]

function handleInput(e) {
    if (!isTestRunning) return;
    if (e.code !== 'Space') return;
    
    e.preventDefault(); // Prevent scrolling
    
    // Visual Feedback (Keystroke Indicator)
    if (!e.repeat) {
        showKeystrokeIndicator();
    }

    if (responseRegistered) return; // Ignore multiple presses for data logic
    
    responseRegistered = true;
    
    const rt = performance.now() - stimulusOnsetTime;
    const trial = trials[currentTrialIndex];
    
    recordTrialData(trial, rt);
}

function handleKeyUp(e) {
    if (e.code === 'Space') {
        hideKeystrokeIndicator();
    }
}

function showKeystrokeIndicator() {
    els.keystrokeIndicator.classList.add('active');
}

function hideKeystrokeIndicator() {
    els.keystrokeIndicator.classList.remove('active');
}

function saveSettings() {
    CONFIG.totalTrials = parseInt(document.getElementById('setting-trials').value) || 300;
    CONFIG.targetPct = parseInt(document.getElementById('setting-target-pct').value) || 20;
    CONFIG.slowDuration = parseInt(document.getElementById('setting-slow-dur').value) || 700;
    CONFIG.fastDuration = parseInt(document.getElementById('setting-fast-dur').value) || 300;
    CONFIG.isi = parseInt(document.getElementById('setting-isi').value) || 300;
    CONFIG.doubleXProb = parseFloat(document.getElementById('setting-double-x').value) || 0.2;
    
    els.settingsModal.close();
}

function startSequence() {
    // Request Fullscreen
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log("Fullscreen denied", err);
        });
    }

    showScreen('name');
}

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}

function startCountdown() {
    const name = els.nameInput.value.trim();
    if (!name) {
        alert("Please enter a name or ID.");
        return;
    }
    sessionData.participantName = name;
    
    showScreen('countdown');
    
    let count = 3;
    els.countdown.innerText = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            els.countdown.innerText = count;
        } else {
            clearInterval(interval);
            prepareAndRunTest();
        }
    }, 1000);
}

function prepareAndRunTest() {
    generateTrials();
    
    currentTrialIndex = 0;
    sessionData.startTime = new Date();
    sessionData.trials = [];
    isTestRunning = true;
    document.body.classList.add('test-active'); // Hide cursor
    
    showScreen('test');
    runNextTrial();
}

function generateTrials() {
    trials = [];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    const nonTargets = letters.filter(l => l !== 'X');
    
    // Split into 4 blocks
    const trialsPerBlock = Math.floor(CONFIG.totalTrials / 4);
    const blocks = ['slow', 'fast', 'slow', 'fast'];
    
    blocks.forEach(blockType => {
        let blockTrials = [];
        for (let i = 0; i < trialsPerBlock; i++) {
            let isTarget = Math.random() < (CONFIG.targetPct / 100);
            
            // Double X Logic for Fast Block
            if (blockType === 'fast' && blockTrials.length > 0 && blockTrials[blockTrials.length - 1].stimulus === 'X') {
                if (Math.random() < CONFIG.doubleXProb) {
                    isTarget = true; // Force X
                }
            }

            const letter = isTarget ? 'X' : nonTargets[Math.floor(Math.random() * nonTargets.length)];
            
            blockTrials.push({
                block: blockType,
                stimulus: letter,
                duration: blockType === 'slow' ? CONFIG.slowDuration : CONFIG.fastDuration
            });
        }
        trials = trials.concat(blockTrials);
    });
}

function runNextTrial() {
    if (currentTrialIndex >= trials.length) {
        endTest();
        return;
    }

    const trial = trials[currentTrialIndex];
    responseRegistered = false;
    
    // Present Stimulus
    els.stimulus.innerText = trial.stimulus;
    stimulusOnsetTime = performance.now();
    
    // Clear Stimulus after Duration
    setTimeout(() => {
        els.stimulus.innerText = ''; // Blank screen (ISI)
    }, trial.duration);
    
    // Next Trial after Duration + ISI
    trialTimeout = setTimeout(() => {
        if (!responseRegistered) {
            recordTrialData(trial, null);
        }
        
        currentTrialIndex++;
        runNextTrial();
    }, trial.duration + CONFIG.isi);
}

function recordTrialData(trial, rt) {
    // Logic:
    // Stimulus != 'X' (Go trial). Response = Correct Hit. No Response = Omission Error.
    // Stimulus == 'X' (No-Go trial). Response = Commission Error. No Response = Correct Rejection.
    
    const isNoGo = trial.stimulus === 'X';
    const hasResponse = rt !== null;
    
    let isCorrect = false;
    let type = '';

    if (!isNoGo) {
        // Go Trial (Normal Letter)
        if (hasResponse) {
            isCorrect = true;
            type = 'Hit';
        } else {
            isCorrect = false;
            type = 'Omission';
        }
    } else {
        // No-Go Trial (X)
        if (hasResponse) {
            isCorrect = false;
            type = 'Commission';
        } else {
            isCorrect = true;
            type = 'Correct Rejection';
        }
    }

    sessionData.trials.push({
        block: trial.block,
        stimulus: trial.stimulus,
        response: hasResponse,
        rt: hasResponse ? Math.round(rt) : null,
        correct: isCorrect,
        type: type
    });
}

async function endTest() {
    isTestRunning = false;
    document.body.classList.remove('test-active');
    
    // Calculate Stats
    const stats = calculateStats();
    
    // Save to DB
    try {
        const sessionId = await db.saveSession(sessionData.participantName, CONFIG);
        await db.saveTrials(sessionId, sessionData.trials);
        console.log("Session saved with ID:", sessionId);
    } catch (e) {
        console.error("Failed to save session", e);
    }
    
    // Display Results
    displayResults(stats);
    showScreen('results');
    
    // Exit Fullscreen
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {});
    }
}

function calculateStats() {
    const t = sessionData.trials;
    const hits = t.filter(x => x.type === 'Hit').length;
    const omissions = t.filter(x => x.type === 'Omission').length;
    const commissions = t.filter(x => x.type === 'Commission').length;
    const correctRejections = t.filter(x => x.type === 'Correct Rejection').length;
    
    const goTrials = hits + omissions;
    const noGoTrials = commissions + correctRejections;
    
    // Detailed RT stats
    const hitRTs = t.filter(x => x.type === 'Hit').map(x => x.rt);
    const avgRT = hitRTs.length ? (hitRTs.reduce((a,b)=>a+b,0) / hitRTs.length) : 0;
    
    // Standard Deviation of RT
    const sdRT = hitRTs.length > 1 ? Math.sqrt(hitRTs.map(x => Math.pow(x - avgRT, 2)).reduce((a,b) => a+b) / (hitRTs.length - 1)) : 0;

    // Block Analysis
    const slowTrials = t.filter(x => x.block === 'slow');
    const fastTrials = t.filter(x => x.block === 'fast');
    
    const getBlockStats = (subset) => {
        const h = subset.filter(x => x.type === 'Hit').map(x => x.rt);
        const mean = h.length ? (h.reduce((a,b)=>a+b,0) / h.length) : 0;
        return Math.round(mean);
    };

    return {
        total: t.length,
        hits,
        omissions,
        commissions,
        avgRT: Math.round(avgRT),
        sdRT: Math.round(sdRT),
        hitRate: goTrials ? ((hits / goTrials) * 100).toFixed(1) : 0,
        commissionRate: noGoTrials ? ((commissions / noGoTrials) * 100).toFixed(1) : 0,
        slowAvgRT: getBlockStats(slowTrials),
        fastAvgRT: getBlockStats(fastTrials)
    };
}

function displayResults(stats) {
    const html = `
        <tr><th colspan="2">Summary Metrics</th></tr>
        <tr><td>Participant</td><td>${sessionData.participantName}</td></tr>
        <tr><td>Date</td><td>${new Date().toLocaleString()}</td></tr>
        <tr><td>Total Trials</td><td>${stats.total}</td></tr>
        
        <tr><th colspan="2">Accuracy</th></tr>
        <tr><td>Hit Rate (Go Accuracy)</td><td>${stats.hitRate}% <small>(${stats.hits} hits)</small></td></tr>
        <tr><td>Commission Error Rate (Impulsivity)</td><td>${stats.commissionRate}% <small>(${stats.commissions} errors)</small></td></tr>
        <tr><td>Omission Errors (Inattention)</td><td>${stats.omissions}</td></tr>

        <tr><th colspan="2">Timing Analysis</th></tr>
        <tr><td>Average Reaction Time</td><td>${stats.avgRT} ms</td></tr>
        <tr><td>Reaction Time Variability (SD)</td><td>${stats.sdRT} ms</td></tr>
        <tr><td>Slow Block Avg RT</td><td>${stats.slowAvgRT} ms</td></tr>
        <tr><td>Fast Block Avg RT</td><td>${stats.fastAvgRT} ms</td></tr>
    `;
    els.resultsTable.innerHTML = html;
}

function exportResults() {
    const exportData = {
        participant: sessionData.participantName,
        date: sessionData.startTime,
        config: CONFIG,
        stats: calculateStats(),
        trials: sessionData.trials
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `CPT_${sessionData.participantName}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
