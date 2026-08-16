<div align="center">

# Wellora

### Unified Hospital Management on a Single Source of Truth EMR

<br/>

**One patient record. Every role. Nothing to dismiss.**

Wellora is a hospital management system where clinical risk **reorders the work** instead of interrupting it,
every role writes to one append-only record they cannot rewrite, and access is enforced by the database
rather than by the browser.

<br/>

### **[ Experience Wellora live → ](https://medtech-wellora.vercel.app)**

<sub>[Live risk model API →](https://wellora-ml.onrender.com/docs)</sub>

<br/>

![React 19](https://img.shields.io/badge/React-19-1f1f1f?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-1f1f1f?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_·_Auth_·_Realtime_·_RLS-1f1f1f?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-1f1f1f?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-1f1f1f?style=flat-square)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6.1-1f1f1f?style=flat-square)
![Status](https://img.shields.io/badge/status-live-0D9488?style=flat-square)

</div>

<br/>

> **Demonstration project.** Patient data is synthetic. The risk model is trained on a real public dataset
> but is **not clinically validated** and must not be used for patient care. See [Limitations](#limitations).

<br/>

**Contents** · [The problem](#the-problem) · [The approach](#wellora-does-not-start-with-the-alert) · [One clinical record](#one-clinical-record-every-role) · [Core platform](#core-platform) · [The differentiators](#where-wellora-goes-beyond-a-crud-emr) · [The model](#the-risk-model) · [Architecture](#how-wellora-is-built) · [Engineering principles](#explainable-first-model-second) · [Human in the loop](#human-in-the-loop) · [Privacy](#privacy-by-design) · [Technology](#technology-stack) · [Verified state](#verified-state) · [Built by](#built-by)

---

# The Problem

Two problems sit underneath most hospital software, and neither is solved by building a faster form.

### The record is fragmented by department

Admissions holds demographics. The ward holds observations. Pharmacy holds the drug chart. The consultant holds
the notes. Each department keeps its own copy, and enormous effort goes into reconciling them — which is exactly
where data goes stale and starts contradicting itself. A nurse records a falling oxygen saturation at 11:30; the
consultant reviewing the chart at 14:00 is looking at a different system that has not been told.

### Alerts are ignored, and everyone knows it

The standard answer to clinical risk is an interrupt: a modal that blocks the screen until someone acknowledges it.
The published evidence is that this fails. Documented override rates for clinical decision-support alerts run
between **49% and 96%** — clinicians dismiss them reflexively, because an alert arrives in the middle of work that
is already urgent. A 2026 *JAMIA* systematic review exists purely on how to *measure* alert fatigue, which is a
fair indication of how unsolved it is.

So the alert that matters looks identical to the forty that did not, and it is dismissed in the same reflex.

Meanwhile a third problem quietly compounds both: **static risk scores cannot see trajectory.** A model that scores
a fixed feature vector captured at assessment time has no concept of whether a patient is getting worse right now.
A stable 70% is less urgent than a 55% whose blood pressure is climbing and whose saturation is falling — and
nothing in a conventional worklist expresses that difference.

---

# Wellora Does Not Start With the Alert

The design decision underneath the product is a change in **how concern is expressed**.

Wellora never fires a modal, a toast, or a banner. There is nothing to dismiss. Instead, risk determines the
**order of the worklist**: the most concerning patient is at the top, with a colour rail down the left edge.
An ambient signal that reorders the work cannot be reflexively cleared the way a dialog can — and when it is
wrong, it costs the clinician nothing.

```text
Conventional CDS                        Wellora
─────────────────────                   ─────────────────────
alert fires                             patient rises in the list
    ↓                                        ↓
blocks the screen                       nothing is blocked
    ↓                                        ↓
dismissed (49–96% of the time)          noticed peripherally
    ↓                                        ↓
signal lost                             order still reflects concern
```

This is a falsifiable design claim grounded in published override rates, not a UI preference — which is what
makes it defensible under questioning.

---

# One Clinical Record, Every Role

Everything in Wellora reads from or writes to the same patient record, and every mutation appends to a single
table: **`clinical_events`**.

Check-in, vitals, SOAP notes, prescriptions, ML assessments, bed changes, appointments and registration —
**8 event types across 8 write sites**, all funnelled through one module. Every role reads the same stream,
filtered by permission rather than by which department's copy they happened to open.

Two structural properties make this hold, and neither is a convention that code could bypass:

**The timeline cannot be bypassed.** The event write sits next to the domain write inside the same function,
in one file (`src/lib/actions.js`). There is no code path that changes clinical data without recording it.

**The timeline cannot be rewritten.** `clinical_events` has **no UPDATE and no DELETE policy for any role**.
Append-only is enforced by PostgreSQL, not by application logic.

```text
                    ┌──────────────────────────┐
  Receptionist ───► │                          │
  Nurse        ───► │      clinical_events     │ ───► Care timeline (every role)
  Doctor       ───► │      (append-only)       │ ───► Risk-ranked worklist
  Admin        ───► │                          │ ───► Patient portal (own rows only)
                    └──────────────────────────┘
                          ▲ RLS decides who sees which rows
```

---

# Core Platform

Five roles, each with its own guarded area and its own view of the same underlying records.

| Role | Can do |
| --- | --- |
| **Admin** | Staff directory, hospital-wide metrics, capacity and permissions overview |
| **Doctor** | Risk-ranked worklist, SOAP consultation notes, e-prescribing with allergy checking, cardiac risk assessment |
| **Nurse** | Ward bed map with status management, vitals recording, medication round |
| **Receptionist** | Patient registration, appointment booking, check-in — and no clinical data at all |
| **Patient** | Their own record only, enforced by the database |

### Authentication and role-based access

Identity is Supabase Auth. The role is read from the `profiles` table **after** authentication — it is never
selected by the user, sent by the client, or stored in browser state. The login screen has no role picker in
live mode; the picker exists only in offline demo mode, where there is no database to protect.

Authorization is two independent layers. Row-level security covers **all 10 tables** with **32 policies**, and
the frontend route guards mirror those policies for usability. The guards are documented in-code as a UX
affordance rather than a security boundary — a determined client can bypass a React route; it cannot bypass
Postgres.

### Clinical record

Patients, vitals, prescriptions, lab results, consultation notes, appointments, beds and ML assessments, all
attached to one patient row. Vitals are stored as a history so trend is computable rather than inferred.

### Prescribing with a check that actually checks

The prescribing form matches the drug against the patient's recorded allergies and their active orders, and
**blocks submission** on a contraindication. The match is bidirectional substring, so "Aspirin" trips an
"Aspirin" allergy and "NSAIDs" trips a recorded "Ibuprofen, NSAIDs" entry, with a separate warning for
duplicate active orders.

> This replaced a hardcoded *"0 contraindications flagged"* banner in the original prototype — a banner that
> would have said the same thing while prescribing penicillin to a penicillin-allergic patient. A decorative
> safety check is worse than no check, because it manufactures confidence.

### Realtime across roles

Supabase Realtime subscriptions on `vitals`, `beds`, `appointments` and `clinical_events`. A nurse recording
deteriorating observations at the bedside causes the attending doctor's worklist to re-rank and their care
timeline to update — within a second, no refresh, correctly attributed to the nurse.

The differentiator is not the websocket. It is that the realtime update feeds the **ranking**: information
reaches the person who needs it without anyone deciding to send it.

### Offline demo mode

With `VITE_USE_MOCK=true`, or with no credentials configured, the entire application runs off a bundled dataset
— no database, no network. The navbar carries a **Live data** / **Demo data** pill so the source is never
ambiguous. Presentations survive dead wifi.

---

# Where Wellora Goes Beyond a CRUD EMR

<br/>

## Ambient Risk Ranking

**The most concerning patient is at the top. There is nothing to dismiss.**

The doctor's worklist is ordered by a composite deterioration score out of 100:

| Component | Weight | Rationale |
| --- | --- | --- |
| Cardiac risk model | 45 | Strongest single signal — but a snapshot |
| **Vitals trend** | **25** | **Direction of travel; what the model cannot see** |
| Flagged labs | 15 | Objective abnormal findings |
| Triage priority | 15 | The clinician's own acuity judgement |

The vitals component scores two distinct things: how abnormal the latest observation is, **and which way it is
moving** — latest reading against the mean of prior readings. A patient stable at an abnormal value is a
different clinical problem from one deteriorating toward it.

### The proof this earns its existence

Two patients from the running system. Both triaged Critical, both with exactly 2 flagged labs, near-identical
model scores — and a 20-point separation in the ranking:

| | Arthur Pendelton | Victor Almeida |
| --- | --- | --- |
| ML model score | 91% | 88% |
| Model component | 41.0 / 45 | 39.6 / 45 |
| **Vitals trend** | **25 / 25 (capped)** | **6 / 25** |
| Flagged labs | 10 / 15 | 10 / 15 |
| Triage | 15 / 15 | 15 / 15 |
| **Composite** | **91** | **71** |

Everything except the trend component is effectively tied. The entire separation comes from deterioration:
Arthur's SpO₂ is 91% and falling, systolic up 11 mmHg, heart rate up 12 bpm, respiratory rate 24. Victor is
high-risk but comparatively flat.

**A raw model sort would have placed these two adjacent.** The composite separates them by 20 points, and the
reason is inspectable — a **"Why?"** panel on every row shows the full derivation, each factor with its points
and a plain-English reason.

Weights are a documented design choice, not a validated clinical scale. That is stated in the code header, in
the Why panel, and on the landing page.

<br/>

## Unified Care Timeline

Every action by every role, in one chronological record — grouped by day, with role-coloured attribution,
per-role filter chips and expandable SOAP notes. It re-reads whenever the realtime subscription fires, so an
event written by another role appears without a refresh.

In offline demo mode there is no event log, so the timeline is reconstructed from the record itself and
labelled **"Derived view"** in amber. It would have been easy to render that silently and let it look like
real provenance — but a timeline that implies audit history it does not have is precisely the wrong thing in
this system.

<br/>

## Explainable Cardiac Risk

Every prediction returns the features that produced it, with signed contributions — not a model-wide
importance ranking, but the contribution of each feature **for this patient**:

```json
{
  "risk_score": 88,
  "probability": 0.8785,
  "decision_log_odds": 1.98,
  "explanation_method": "exact_log_odds",
  "top_contributing_factors": [
    { "label": "Major vessels coloured by fluoroscopy", "contribution":  1.7741, "direction": "increases_risk" },
    { "label": "Chest pain: non-anginal pain",          "contribution": -0.6226, "direction": "decreases_risk" },
    { "label": "Thalassemia scan: reversible defect",   "contribution":  0.6179, "direction": "increases_risk" }
  ]
}
```

Note the second entry: a feature reported as actively *reducing* this patient's risk. That is the kind of
statement a clinician can check against their own judgement — which is the entire point.

---

# The Risk Model

Logistic regression on the UCI Heart Disease dataset (Cleveland subset, 303 records), served from FastAPI.

| Metric | Logistic regression (served) | Random forest (depth 4) |
| --- | --- | --- |
| Accuracy | 0.869 | **0.885** |
| Precision | 0.812 | 0.839 |
| Recall | **0.929** | 0.929 |
| F1 | 0.867 | 0.881 |
| ROC-AUC | **0.960** | 0.951 |
| 5-fold CV ROC-AUC | **0.907 ± 0.019** | 0.898 ± 0.026 |

Confusion matrix, logistic regression, 61-record held-out test set:

| | Predicted no disease | Predicted disease |
| --- | --- | --- |
| **Actual no disease** | 27 | 6 |
| **Actual disease** | 2 | 26 |

### Why the less accurate model is the one that ships

The random forest wins accuracy by 1.6 points — which on a 61-record test set is **exactly one patient**, well
inside the noise. Logistic regression wins on ROC-AUC and cross-validated AUC, and both have identical recall.

The deciding factor is that a linear model's prediction decomposes **exactly**:

```text
log_odds = intercept + Σ (coefficient_j × scaled_value_j)
```

Every term is that feature's literal contribution to the decision. A tree ensemble has no such decomposition —
explaining one prediction needs a post-hoc approximation (SHAP, treeinterpreter) that is itself a model of the
model, and is considerably harder to defend.

**Recall was the metric to optimise.** For a screening aid a missed case costs more than a false alarm:
2 false negatives against 6 false positives. That trade is deliberate; the reverse would not be defensible.

### The explanation verifies itself

`app/predictor.py` asserts at startup that the reported contributions, plus the intercept, reconstruct the
model's own log-odds to within `1e-6`. If preprocessing ever drifts out of sync with the explanation, **the
service refuses to start** rather than serving plausible-looking but wrong attributions. A test covers the
same guarantee.

Verified live: `sigmoid(1.98) = 0.879`, matching the reported probability exactly.

---

# How Wellora Is Built

```text
┌─────────────────────────┐        ┌──────────────────────────┐
│  React 19 + Vite 8      │  HTTPS │  Supabase                │
│  role-routed SPA        │───────►│  Postgres · Auth         │
│  ├─ repository.js       │        │  Realtime · RLS          │
│  ├─ actions.js          │◄───────│  (10 tables, 32 policies)│
│  └─ DataContext         │  WS    └──────────────────────────┘
└───────────┬─────────────┘
            │ POST /predict
            ▼
┌─────────────────────────┐
│  FastAPI (Render)       │
│  logistic regression    │
│  exact explanations     │
└─────────────────────────┘
```

A few decisions worth naming:

**One boundary between the database and the UI.** `src/lib/repository.js` maps every table into a single shape.
Dashboards and metrics never touch Supabase directly, which is what lets the application run identically
against live data or the bundled offline dataset — the same components, one branch at the boundary.

**Every mutation writes the timeline.** `src/lib/actions.js` holds all writes, and each one appends to
`clinical_events` in the same function. Keeping the audit write beside the domain write, in one file, is what
stops the record from drifting out of truth.

**Version pinning is load-bearing.** A scikit-learn version differing from the one the model was pickled with
will unpickle without raising and then predict differently. `requirements.txt` pins exact versions matching
`model_metadata.json`, `runtime.txt` pins Python 3.11.9, and `/health` reports a `version_match` flag that the
test suite fails on.

**The model artefact is committed.** 8 KB, so no training happens at build time and the deployed model is
exactly the one that was evaluated.

<details>
<summary><b>Repository layout</b></summary>

```text
src/
├── components/
│   ├── admin/ doctor/ nurse/ receptionist/ patient/   per-role dashboards
│   ├── common/        AppShell · Navbar · loading/error/empty states
│   ├── emr/           unified EMR modal · care timeline
│   ├── landing/       public page · GSAP entrance animations
│   └── ml/            heart risk modal
├── context/           AuthContext (dual-mode) · DataContext (+ realtime)
├── lib/               supabase · repository · actions · timeline · format
├── routes/            router · ProtectedRoute · RoleRoute
├── services/          ML API client (incl. feature-encoding conversion)
├── utils/             riskScore · metrics · fallback scorer
├── data/              offline dataset — also the schema specification
└── styles/            tokens · base · landing · components

supabase/
├── schema.sql         10 tables, enums, indexes, realtime publication
├── rls.sql            32 policies + a negative-test suite
├── seed.sql           148 inserts, generated from mockData.js
├── profiles.sql       links auth users to roles
└── SETUP.md           step-by-step database setup

ml-service/
├── app/               FastAPI — /predict · /health · /model-info
├── train.py           training pipeline, both models compared
├── models/            fitted pipeline + metadata (committed)
├── reports/           metrics.json · metrics.md
└── tests/             14 contract + explainability tests

render.yaml            Render blueprint (must live at repo root)
usp.md                 differentiators, with file references
plan.md                phased build log, including every bug found
```

</details>

---

# Explainable First, Model Second

The most consequential constraint in the codebase is a rule about **when** the model is allowed to be trusted,
and what happens when it is not available.

```text
exact identifier   →  patient id, DOI-style keys, SHA-256, model version
       ↓               (if this resolves it, stop)
deterministic rule →  allergy match, duplicate-order check, triage mapping, threshold bands
       ↓               (if this resolves it, stop)
derived signal     →  vitals trend, flagged-lab counts, composite scoring
       ↓               (if this resolves it, stop)
trained model      →  cardiac risk only, with an exact per-feature decomposition
```

Every call to the model goes through one client (`src/services/mlService.js`), and that call site works
without it. When the service is unreachable — not deployed, cold-started, offline — the client falls back to a
local rule-based scorer, and the UI **says so**: an amber *"Fallback scorer"* badge with the reason, and
**no contribution numbers at all**, rather than presenting weaker output in the same format as the real thing.

That matters in practice, not in theory. The free Render tier sleeps after inactivity and the first request
back takes ~50 seconds — so the fallback path is not an edge case, it is a regular Tuesday.

The client also owns the one conversion that would otherwise be silent and fatal: the service was trained on
the **raw UCI encoding** (`cp` 1–4, `slope` 1–3, `thal` 3/6/7), while the application's stored vectors use the
Kaggle-style re-encoding (`cp` 0–3, `slope` 0–2, `thal` 0–3). Both are valid integers. Sending the wrong one
produces confident nonsense rather than an error, so the conversion lives in exactly one place.

---

# Human in the Loop

The model proposes. The clinician decides. This is enforced structurally, not by convention:

| The system produces | The clinician does | Nothing happens until |
| --- | --- | --- |
| Cardiac risk score | Review the contributing factors | — |
| Risk-ranked position | Open the record, or not | — |
| Prescription contraindication | Cannot proceed — submission is blocked | The drug is changed |
| Duplicate active order | Warned, may proceed | Explicit submit |
| Assessment result | Save to the record | Save |
| Patient-facing risk score | Shown with clinical framing, never raw | — |

Assessments are stored with their model version and input snapshot, so a score is always traceable to the
model and the inputs that produced it.

---

# Privacy by Design

- **Two independent authorization layers.** Row-level security on all 10 tables, *and* explicit owner or
  institution filters in the data layer. Neither is load-bearing alone.
- **The role is a database fact.** Read from `profiles` after authentication — never selected by the client,
  never stored in browser state, never trusted from a token claim.
- **Append-only clinical history.** No UPDATE or DELETE policy on `clinical_events` for any role.
- **Least privilege by role.** A receptionist querying `lab_results` receives zero rows regardless of what
  the frontend asks for. A patient reaches exactly one record — their own — via `portal_user_id`.
- **The publishable key is safe only because RLS is on.** This is stated explicitly in `SETUP.md`, because
  applying the schema without the policies would turn that key into an unrestricted handle on the database.
- **A documented negative-test suite.** `supabase/rls.sql` ends with the exact queries that must return zero
  rows per role — the evidence that the boundary holds, not just the claim that it does.

This is the security posture as built. It is not a compliance claim — Wellora has not been through any formal
assessment.

---

# Technology Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Frontend | React 19, Vite 8, React Router 7 | Role-routed single-page application |
| Motion | GSAP 3 + ScrollTrigger | Landing page only — dashboards are deliberately static |
| UI | lucide-react, hand-built design tokens | Iconography, 10-step type scale, 4px spacing scale |
| Database | Supabase PostgreSQL | 10 tables, RLS on every one |
| Identity | Supabase Auth | Sessions; role resolved from `profiles` |
| Realtime | Supabase Realtime (`postgres_changes`) | Cross-role live updates |
| ML API | FastAPI 0.115, Uvicorn, Pydantic | `/predict` · `/health` · `/model-info` |
| ML | scikit-learn 1.6.1, numpy 1.26.4, pandas 2.2.3 | Logistic regression, exact explanations |
| Dataset | UCI Heart Disease (Cleveland) | 303 records |
| Hosting | Vercel · Render · Supabase | Frontend · ML API · data platform |

No message broker, no vector database, no LLM, no embedding search. Matching is identifier- and
threshold-based throughout.

---

# Getting Started

### 1. Frontend

```bash
npm install
cp .env.example .env.local     # then fill in your values
npm run dev                    # http://localhost:5173
```

Leave `VITE_USE_MOCK=true` to run entirely offline against the bundled dataset.

### 2. Database

Follow [`supabase/SETUP.md`](supabase/SETUP.md):

1. Run `schema.sql`, then `rls.sql`, then `seed.sql` — **in that order**
2. Create one auth user per role and insert matching `profiles` rows (`profiles.sql`)
3. Set `VITE_USE_MOCK=false` and restart

> ⚠️ Run `rls.sql` **before** putting real data in. Until the policies exist, the publishable key is an
> unrestricted read/write handle on every table.

### 3. ML service

```bash
cd ml-service
make install
make train      # downloads UCI Cleveland, trains, writes models/ and reports/
make test       # 14 tests
make serve      # http://localhost:8000/docs
```

Then set `VITE_ML_API_URL`. See [`ml-service/README.md`](ml-service/README.md) for the full model card.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable key — safe client-side **only with RLS enabled** |
| `VITE_ML_API_URL` | FastAPI base URL; blank falls back to the local scorer |
| `VITE_USE_MOCK` | `true` = offline dataset, `false` = live Supabase |

---

# Verified State

Claims in this README are drawn from the implementation and were re-checked against the running system.
Where something is incomplete it is stated below rather than omitted.

| Check | Result |
| --- | --- |
| ML test suite | **14 passed** (`cd ml-service && make test`) |
| Live ML API | `/health` green — `model_loaded: true`, `version_match: true` |
| Model performance | Recall 0.929 · ROC-AUC 0.960 · CV 0.907 ± 0.019 |
| Explanation integrity | Contributions reconstruct the model's log-odds to 1e-6, asserted at startup |
| Database | 10 tables · RLS enabled on all 10 · 32 policies · 148 seed inserts |
| Append-only guarantee | 0 UPDATE and 0 DELETE policies on `clinical_events` |
| RLS enforcement | Anonymous requests to `patients`, `lab_results`, `clinical_events` all return `[]` |
| Frontend build | Clean · lint clean |
| Deployed frontend | Live on Vercel — SPA deep links, auth guard and security headers verified |
| Cross-origin ML calls | Preflight returns `access-control-allow-origin` for the production domain; unknown origins rejected |
| Cross-role realtime | Verified end to end — nurse writes vitals, doctor's worklist re-ranks and timeline updates |

---

# Limitations

Stated plainly, because a system that hides these is harder to trust than one that lists them.

**Clinical**

- **Patient data is synthetic.** Names, notes and vitals are fabricated. The ML feature vectors in the seed
  data are generated, so individual patients' risk scores are illustrative — the model and pipeline are real,
  the inputs are not.
- **Not clinically validated, not a medical device.** No regulatory assessment, no prospective validation,
  no external test set.
- **The model's population is narrow.** 303 records from a 1988 single-centre cohort of patients *already
  referred for coronary angiography* — 45.9% disease prevalence, far above any screening population, and 68%
  male. A model trained at that prevalence will over-predict on unselected patients.
- **The two strongest predictors are expensive.** `ca` (fluoroscopy) and `thal` (thallium stress scan) require
  invasive or specialised procedures. This is therefore a risk-stratification aid for patients already in a
  diagnostic pathway, **not** an early-screening tool.
- **A counterintuitive coefficient, documented rather than hidden.** `age` carries a small negative
  coefficient — a multicollinearity artefact from `thalach` and `ca` also being in the model. It does not mean
  age is protective.

**Engineering**

- **Only the production Vercel domain is CORS-allowed** on the ML API. Vercel preview deployments get their
  own URLs, so the risk modal shows the fallback badge on previews — demo from the production URL.
- **Free-tier cold start.** The ML service sleeps after inactivity; the first request takes ~50 seconds, during
  which the UI correctly shows the fallback badge.
- **Two Admin tabs are static.** Capacity and Permissions still carry placeholder figures.
- **Medication administration does not persist.** The nurse's *Administer & Sign* action reports success but
  writes nothing, because no MAR table exists in the schema.

---

# What Changes With Wellora

| Conventional workflow | With Wellora |
| --- | --- |
| Each department keeps its own copy of the patient | One record, filtered by permission |
| Risk arrives as an interrupt and is dismissed | Risk reorders the worklist; nothing to dismiss |
| A risk score is a number with no reasoning | Every score decomposes into named, signed contributions |
| Static scores miss deterioration | Trend is a scored component, weighted at 25/100 |
| Roles enforced by a client-side toggle | Roles enforced by Postgres row-level security |
| Clinical history can be edited after the fact | Append-only; no UPDATE or DELETE policy exists |
| Handover delay between bedside and consultant | Realtime — worklist re-ranks as observations are recorded |
| Model failure looks like a working model | Fallback is labelled, with the reason, and shows no fake numbers |

---

# Built By

[@lakshitasethia](https://github.com/lakshitasethia)

Further reading in this repository: [`usp.md`](usp.md) for the differentiators with file references,
[`plan.md`](plan.md) for the phased build log including every bug found and how it was fixed, and
[`ml-service/README.md`](ml-service/README.md) for the full model card.

---

<div align="center">

Wellora is built on one idea: **risk should reorder the work, not interrupt it — and every number should be
able to explain itself.**

<br/>

### **[ Experience Wellora live → ](https://medtech-wellora.vercel.app)**

</div>
