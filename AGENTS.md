# Anchor - Comprehensive ADHD/ADD Assessment Platform

A web-based, open-source clinical screening platform implementing validated neuropsychological instruments for ADHD/ADD assessment.
Licensed under GPL-3.0. All data is stored client-side via IndexedDB — zero external server calls.

## Project Status: MIGRATION IN PROGRESS

The project is migrating from a vanilla JS CPT prototype to a full jsPsych-based assessment platform.
The old CPT code (`script.js`, `db.js` at root) still works but is being replaced by the `src/` module architecture.

**npm install failed due to disk space. Run `npm install` after migration.**

## Task List

### High Priority (Phase 0 + Phase 1)

- [ ] Run `npm install` (blocked by disk space — retry after server migration)
- [ ] Migrate CPT to jsPsych plugin with advanced scoring (d-prime, ex-Gaussian, ISI change)
- [ ] Build PAI module — free validated instruments:
  - [ ] PHQ-9 (Depression, 9 items, 0-3 Likert, public domain)
  - [ ] GAD-7 (Anxiety, 7 items, 0-3 Likert, public domain)
  - [ ] PHQ-15 (Somatic, 15 items, 0-2 Likert, public domain)
  - [ ] PCL-5 (PTSD, 20 items, 0-4 Likert, VA/DoD public domain)
  - [ ] OCI-R (OCD, 18 items, 0-4 Likert, Foa et al. research free)
  - [ ] MDQ (Mania, 17 items, Yes/No + Likert, SAMHSA free)
  - [ ] MSI-BPD (Borderline, 10 items, Yes/No, Zanarini free)
  - [ ] AUDIT (Alcohol, 10 items, 0-4 Likert, WHO free)
  - [ ] DAST-10 (Drugs, 10 items, Yes/No, public domain)
  - [ ] BPAQ (Aggression, 29 items, 1-5 Likert, Buss & Perry research free)
  - [ ] ASQ (Suicidal Ideation, 4 items, Yes/No, NIMH public domain)
  - [ ] PSS-10 (Stress, 10 items, 0-4 Likert, Cohen research free)
  - [ ] MSPSS (Social Support, 12 items, 1-7 Likert, Zimet free)
- [ ] Build PAI module — custom scales (~8-12 items each, 4-point Likert):
  - [ ] Paranoia (~10 items, DSM-5 persecutory ideation criteria)
  - [ ] Schizophrenia (~10 items, DSM-5 psychotic spectrum criteria)
  - [ ] Antisocial Features (~12 items, DSM-5 ASPD criteria)
  - [ ] Treatment Rejection (~8 items, help-seeking attitudes)
  - [ ] Dominance (~8 items, interpersonal control/assertiveness)
  - [ ] Warmth (~8 items, interpersonal affiliation)
- [ ] Build PAI validity scales (~16 items total):
  - [ ] Inconsistency (~4 pairs — content-matched items, flag if diff > 2)
  - [ ] Infrequency (~4 items — rarely-endorsed items, <2% normative)
  - [ ] Negative Impression (~4 items — subtle symptom exaggeration)
  - [ ] Positive Impression (~4 items — social desirability, MC-SDS adapted)
- [ ] Build PAI scoring engine (T-score conversion, clinical cutoffs, validity flagging)
- [ ] PAI UX: safety triggers (ASQ positive → 988 Lifeline), disclaimer on every page

### Medium Priority (Subsequent Modules)

- [ ] Build Clinical Interview module (demographics, developmental history, ASRS v1.1, WURS-25)
- [ ] Build Trail Making Test A & B (canvas-based, time-based scoring)
- [ ] Build D-KEFS subtests (Stroop color-word, Verbal Fluency)
- [ ] Build WAIS-IV digitized subtests (Digit Span, Arithmetic, Coding analog)
- [ ] Build Beck scales + BRIEF-A questionnaires
- [ ] Build integrated Bayesian reporting engine

### Low Priority

- [ ] Update this AGENTS.md after all modules complete

## Commands

```bash
npm run dev       # Start Vite dev server on port 3000
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint on src/
npm install       # REQUIRED — failed due to disk space, run after migration
```

### Legacy (Old CPT — still works)

```bash
npx serve .            # Node.js local server
python -m http.server  # Python local server
# Or open index.html directly
```

## Architecture

### Target Structure (jsPsych-based)

```
open-cpt-testing/
├── index.html              Entry point — loads src/main.js as ES module
├── package.json            jsPsych v7 + Vite + ESLint
├── vite.config.js          Dev server on :3000, builds to dist/
├── style.css               Global styles (keep existing)
├── script.js               OLD — vanilla CPT (to be replaced)
├── db.js                   OLD — vanilla IndexedDB (to be replaced)
├── src/
│   ├── main.js             Entry point: initJsPsych + run timeline
│   ├── timeline.js         Master timeline: all modules in clinical sequence
│   ├── modules/
│   │   ├── clinical-interview/   Structured intake + ASRS + WURS-25
│   │   ├── wais/                WAIS-IV: Digit Span, Arithmetic, Coding
│   │   ├── dkefs/               D-KEFS: Stroop, Verbal Fluency
│   │   ├── beck-scales.js       BDI-II-like + BAI-like
│   │   ├── brief-a.js           BRIEF-A self-report
│   │   ├── trail-making.js      Trail Making A & B
│   │   ├── pai/
│   │   │   ├── index.js              PAI timeline builder + orchestrator
│   │   │   ├── instruments/          Free validated instruments
│   │   │   │   ├── phq-9.js         Depression
│   │   │   │   ├── gad-7.js         Anxiety
│   │   │   │   ├── phq-15.js        Somatic
│   │   │   │   ├── pcl-5.js         PTSD
│   │   │   │   ├── oci-r.js         OCD
│   │   │   │   ├── mdq.js           Mania
│   │   │   │   ├── msi-bpd.js       Borderline
│   │   │   │   ├── audit.js         Alcohol
│   │   │   │   ├── dast-10.js       Drugs
│   │   │   │   ├── bpaq.js          Aggression
│   │   │   │   ├── asq.js           Suicidal Ideation
│   │   │   │   ├── pss-10.js        Stress
│   │   │   │   └── msps.js          Social Support
│   │   │   ├── custom/               Custom items (no free instrument exists)
│   │   │   │   ├── paranoia.js
│   │   │   │   ├── schizophrenia.js
│   │   │   │   ├── antisocial.js
│   │   │   │   ├── treatment-rejection.js
│   │   │   │   ├── dominance.js
│   │   │   │   └── warmth.js
│   │   │   ├── validity.js           INC, INF, NIM, PIM
│   │   │   └── scoring.js            PAI scoring engine + T-score conversion
│   │   └── cpt/
│   │       ├── index.js              Migrated CPT-3 as jsPsych timeline
│   │       ├── stimulus.js           Stimulus generation + display
│   │       └── scoring.js            d-prime, RTV, ISI change, composites
│   ├── scoring/
│   │   ├── t-scores.js           DONE — T = 50 + 10 × [(raw - mean) / SD]
│   │   ├── signal-detection.js   DONE — d-prime, criterion c, ex-Gaussian fit
│   │   └── bayesian.js           Multi-stage Bayesian updating (TODO)
│   ├── storage/
│   │   └── db.js                 DONE — IndexedDB (sessions, module_results, trials)
│   └── utils/
│       ├── timing.js             TODO — performance.now() wrappers
│       ├── fullscreen.js         TODO — Fullscreen API
│       └── export.js             DONE — JSON export with disclaimer
└── AGENTS.md
```

### What's Already Written

| File | Status | Notes |
|---|---|---|
| `package.json` | DONE | jsPsych v7 + Vite + ESLint deps declared (not installed) |
| `vite.config.js` | DONE | Port 3000, sourcemaps, builds to dist/ |
| `index.html` | DONE | New entry point loading src/main.js |
| `src/main.js` | DONE | jsPsych init, cursor hide on trials, data save on finish |
| `src/timeline.js` | DONE | Welcome screen + placeholder module slots |
| `src/storage/db.js` | DONE | IndexedDB: sessions, module_results, trials tables |
| `src/utils/export.js` | DONE | JSON export with disclaimer header |
| `src/scoring/t-scores.js` | DONE | tScore(), interpretTScore(), interpretTScoreClinical() |
| `src/scoring/signal-detection.js` | DONE | dPrime(), criterionC(), coefficientOfVariation(), exGaussianFit() |

## Assessment Module Sequence

The clinical presentation order (mirrors actual neuropsychological battery):

1. **Clinical Interview** — Structured intake, demographics, developmental history, ASRS v1.1, WURS-25
2. **WAIS-IV** — Digitized subtests: Digit Span, Arithmetic, Coding/Symbol Search
3. **D-KEFS + Beck + BRIEF-A** — Stroop, Verbal Fluency + BDI-II-like + BAI-like + BRIEF-A
4. **Trail Making A & B** — Processing speed + cognitive flexibility (B-A = executive efficiency)
5. **PAI** — 22 scales, ~251 items (the module currently being built)
6. **Conners CPT-3** — Already exists in vanilla JS, needs jsPsych migration

## PAI Module Detail

### Full Scale → Instrument Mapping

| # | PAI Scale | Instrument | Items | Likert | Source |
|---|---|---|---|---|---|
| 1 | Somatic Complaints | PHQ-15 | 15 | 0-2 | Public domain (Pfizer) |
| 2 | Anxiety | GAD-7 | 7 | 0-3 | Public domain (Pfizer) |
| 3 | Anxiety-Related | PCL-5 (PTSD) + OCI-R (OCD) | 20+18 | 0-4 | VA/DoD + Foa et al. |
| 4 | Depression | PHQ-9 | 9 | 0-3 | Public domain (Pfizer) |
| 5 | Mania | MDQ | 17 | Yes/No + Likert | SAMHSA (free) |
| 6 | Paranoia | Custom | ~10 | 4-point | DSM-5 persecutory ideation |
| 7 | Schizophrenia | Custom | ~10 | 4-point | DSM-5 psychotic spectrum |
| 8 | Borderline Features | MSI-BPD | 10 | Yes/No | Zanarini (free) |
| 9 | Antisocial Features | Custom | ~12 | 4-point | DSM-5 ASPD criteria |
| 10 | Alcohol Problems | AUDIT | 10 | 0-4 | WHO (free) |
| 11 | Drug Problems | DAST-10 | 10 | Yes/No | Public domain (Skinner) |
| 12 | Aggression | BPAQ | 29 | 1-5 | Buss & Perry (research free) |
| 13 | Suicidal Ideation | ASQ (Columbia) | 4 | Yes/No | NIMH (public domain) |
| 14 | Stress | PSS-10 | 10 | 0-4 | Cohen (research free) |
| 15 | Nonsupport | MSPSS | 12 | 1-7 | Zimet (free) |
| 16 | Treatment Rejection | Custom | ~8 | 4-point | Custom |
| 17 | Dominance | Custom | ~8 | 4-point | Custom interpersonal |
| 18 | Warmth | Custom | ~8 | 4-point | Custom interpersonal |
| 19 | Inconsistency | Custom pairs | ~8 | Embedded | Content-matched pairs |
| 20 | Infrequency | Custom | ~4 | Embedded | Rare endorsement |
| 21 | Negative Impression | Custom | ~4 | Embedded | Symptom exaggeration |
| 22 | Positive Impression | Custom | ~4 | Embedded | Social desirability (MC-SDS) |

### PAI UX Flow

```
PAI Entry → Instructions (est. 20-30 min)
│
├── Block 1: Clinical Scales
│   PHQ-9 → GAD-7 → PHQ-15 → PCL-5 (2 pages) → OCI-R (2 pages) →
│   MDQ → MSI-BPD → Paranoia → Schizophrenia → Antisocial → AUDIT → DAST-10
│
├── Block 2: Treatment Scales
│   BPAQ (split pages) → ASQ (with crisis trigger if positive) → PSS-10 → MSPSS → Treatment Rejection
│
├── Block 3: Interpersonal Scales
│   Dominance → Warmth
│
├── Block 4: Validity (interspersed)
│   Inconsistency pairs → Infrequency → Negative Impression → Positive Impression
│
└── PAI Results
    Per-scale scores + cutoffs → Validity profile → Traffic-light concern levels
```

### Safety Features

- ASQ positive screen → immediately display 988 Suicide & Crisis Lifeline + local resources
- High scores on SCZ or SUI → flag for immediate clinical referral
- Every page: "This is a screening instrument. It does not provide a clinical diagnosis."

## Scoring Frameworks

### Signal Detection (CPT)

- `d-prime` = z(Hit Rate) - z(False Alarm Rate), with log-linear correction (Hautus 1995)
- `criterion c` = -0.5 × [z(HR) + z(FAR)] — measures response bias
- `ex-Gaussian decomposition` — mu, sigma, tau — tau captures slow-tail RT distribution (most ADHD-sensitive)
- `CV` = sigma/mu × 100 — normalizes RTV by mean
- `HRT ISI Change` — single most diagnostically powerful CPT signal (ADHD degrades at 4s ISI)
- `HRT Block Change` — vigilance decrement across session

### T-Score Interpretation

| Range | Interpretation | Color |
|---|---|---|
| 41-59 | Average | Green |
| 60-64 | Mildly Atypical | Yellow |
| 65-69 | Moderately Atypical | Orange |
| >=70 | Markedly Atypical | Red |

### CPT Composites

- **Inattentiveness**: d', Omissions, Commissions, HRT, HRT SD, Variability
- **Impulsivity**: HRT, Commissions, Perseverations (RT < 100ms)
- **Sustained Attention**: HRT Block Change + SE
- **Vigilance**: HRT ISI Change + SE

### Bayesian Integration (TODO)

Multi-stage Bayesian updating across all modules:
- Base rate: 2-5% adults general pop, 30-50% self-referred
- ASRS Part A >=14: LR+ ~7.5, LR- ~0.11
- Each module updates the prior probability
- Output: probability ranges (Very Unlikely <15%, Unlikely 15-30%, Possible 30-50%, Likely 50-70%, Very Likely >70%)

## Code Style Guidelines

### JavaScript

- **Runtime**: ES6+ modules with jsPsych v7. Vite for dev/build.
- **Constants**: `UPPER_SNAKE_CASE` for config (`CONFIG`, `DB_NAME`).
- **Variables**: `camelCase` for variables and functions.
- **Classes**: `PascalCase` (`CPTDatabase`).
- **Naming**: verb prefixes for functions — `handleX`, `showX`, `hideX`, `saveX`, `exportX`, `buildX`, `calculateX`.
- **Timing**: Always `performance.now()` — never `Date.now()`.
- **Indentation**: 4 spaces. Semicolons required. Template literals for HTML.
- **Error handling**: `try/catch` + `console.error` for DB. `.catch(() => {})` for non-critical ops.
- **Async/await**: All IndexedDB operations.

### CSS

- Flexbox centering. Viewport-relative units for stimuli (`vh`).
- `.hidden` class = `display: none !important` for screen toggling.
- Color palette: grays (`#acacac`), flat UI (`#34495e`, `#27ae60`).
- `user-select: none` + `overflow: hidden` on body during tests.

### Data Privacy

- Zero server dependency. IndexedDB only. No analytics/tracking.
- JSON export user-initiated via file download only.
- No PII collected beyond participant name/ID (user-provided).

## CPT Key Constants (current vanilla implementation)

| Constant | Default | Description |
|---|---|---|
| `CONFIG.totalTrials` | 300 | Total number of trials |
| `CONFIG.targetPct` | 20 | Percentage of trials that are X |
| `CONFIG.slowDuration` | 700ms | Stimulus display time in slow blocks |
| `CONFIG.fastDuration` | 300ms | Stimulus display time in fast blocks |
| `CONFIG.isi` | 300ms | Inter-stimulus interval (blank screen) |
| `CONFIG.doubleXProb` | 0.2 | Probability of consecutive X in fast blocks |

## Key Clinical Cutoffs (for scoring engine)

| Instrument | Cutoff | Sens/Spec | Source |
|---|---|---|---|
| ASRS v1.1 Part A | >=14 (0-24) | 90%/88% | WHO |
| WURS-25 | >=46 | 86%/99% | Wender |
| PHQ-9 Depression | 5/10/15/20 mild/mod/mod-severe/severe | — | Pfizer |
| GAD-7 Anxiety | 5/10/15 mild/mod/severe | — | Pfizer |
| AUDIT Alcohol | 8/15/20 hazardous/dependence/severe | 92%/94% | WHO |
| DAST-10 Drugs | 3-5/6-8/9-10 mod/substantial/severe | — | Skinner |
| MSI-BPD Borderline | >=7 | 81%/68% | Zanarini |
| PCL-5 PTSD | >=31-33 | — | VA/DoD |
| PSS-10 Stress | Interpret via quartiles | — | Cohen |
| BPAQ Aggression | Normalize per subscale | — | Buss & Perry |

## Research References

The clinical framework is documented in two research files in this repo:
- `gemini rep.md` — Theoretical foundations (Barkley, Dual/Triple Pathway, Cognitive-Energetic models)
- `compass_artifact_wf-d98cc70b-02ef-40a6-8661-32b7eb27e818_text_markdown.md` — Signal detection theory, scoring frameworks, web implementation specs, ethical framing
