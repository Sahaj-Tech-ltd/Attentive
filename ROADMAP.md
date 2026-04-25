# Attentive — ADHD Assessment Platform Roadmap

> Multi-module neuropsychological assessment platform for clinical and research use.
> Currently live: **Conners CPT-3** (vigilance/attention).

---

## Platform Modules

### ✅ Live
| Module | Description |
|--------|-------------|
| **Conners CPT-3** | Continuous Performance Test — Go/No-Go vigilance task. 300 trials, signal detection (d-prime), T-scores, RT variability. Full scoring pipeline, IndexedDB storage. |

### 🔜 Next Up
| Module | Notes |
|--------|-------|
| **Clinical Interview** | Structured clinical intake and history gathering. |
| **WAIS-IV** | Wechsler Adult Intelligence Scale — cognitive battery (Working Memory, Processing Speed, etc.). |
| **Trail Making A & B** | Simple visual scanning (A) + cognitive flexibility (B). |
| **D-KEFS** | Delis-Kaplan Executive Function System — multiple subtests. |
| **Beck Inventories** | Beck Depression Inventory (BDI), Beck Anxiety Inventory (BAI). |
| **BRIEF-A** | Behavior Rating Inventory of Executive Function — adult executive function questionnaire. |
| **PAI** | Personality Assessment Inventory — broad personality assessment. |

---

## Tech Stack
- **Frontend:** React 18 + jspsych 7.x
- **Build:** Vite
- **Storage:** IndexedDB (client-side, no server required)
- **Platform:** Static web app — deploy anywhere

## Scoring
- Signal detection theory (d-prime)
- T-scores (age-normed)
- Reaction time distribution analysis
- Per-module normative data tables

---

*Last updated: 2026-04-25*
