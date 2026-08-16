# Wellora — Genuine Differentiators

What this build actually does that typical hospital/EMR systems don't, with the
evidence and the code location for each.

Every figure here was measured from the running system, not estimated. Where
something is a limitation rather than a strength, it is listed as one.

---

## 1. Risk-ranked worklist instead of interruptive alerts

**What it is.** The doctor's patient list is ordered by a composite
deterioration score. The most concerning patient is at the top. There is no
modal, no toast, no banner, and nothing to dismiss — concern is expressed as
*position in the list* plus a colour rail down the left edge.

**Why it's different.** Conventional clinical decision support fires an
interrupt: a dialog that blocks the screen until acknowledged. The published
evidence is that this fails. Documented override rates for CDS alerts run
**49%–96%** — clinicians dismiss them reflexively because they interrupt work in
progress. A 2026 *JAMIA* systematic review exists purely on how to *measure*
alert fatigue, which is a fair indication of how unsolved the problem is.

Wellora's design hypothesis is that **ranking beats interrupting**: an ambient
signal that reorders the work cannot be "dismissed", so it cannot be ignored the
way a dialog can, and it costs the clinician nothing when it's wrong.

This is a falsifiable design claim, not a UI preference — which is what makes it
defensible in a viva.

**Where it lives**
- `src/components/doctor/RiskRankedQueue.jsx` — the worklist, colour rail, rank-change indicators, and the By risk / By time toggle
- `src/utils/riskScore.js` — the scoring engine

---

## 2. Composite deterioration score that is direction-aware

**What it is.** A 0–100 score across four weighted components:

| Component | Max | Rationale |
|---|---|---|
| Cardiac risk model | 45 | Strongest single signal — but a snapshot |
| Vitals **trend** | 25 | Direction of travel; what the model cannot see |
| Flagged labs | 15 | Objective abnormal findings |
| Triage priority | 15 | The clinician's own acuity judgement |

The vitals component scores two separate things: how abnormal the latest
observation is, *and which way it is moving* (latest reading vs the mean of
prior readings). A patient stable at an abnormal value is a different problem
from one deteriorating toward it.

**Why it's different.** The ML model answers one narrow question from a fixed
13-feature vector captured at assessment time. It has no concept of trajectory.
A stable 70% is less urgent than a 55% whose blood pressure is climbing and
whose oxygen saturation is falling.

**The proof, measured from the running system.** Two patients, both triaged
Critical, both with exactly 2 flagged labs, near-identical model scores — and a
20-point separation in the ranking:

| | Arthur Pendelton | Victor Almeida |
|---|---|---|
| ML model score | 91% | 88% |
| Model component | 41.0 / 45 | 39.6 / 45 |
| **Vitals trend** | **25 / 25 (capped)** | **6 / 25** |
| Flagged labs | 10 / 15 | 10 / 15 |
| Triage | 15 / 15 | 15 / 15 |
| **Composite** | **91** | **71** |

Everything except the trend component is effectively tied. The entire
separation comes from deterioration: Arthur's SpO₂ is 91% and falling, systolic
up 11 mmHg, heart rate up 12 bpm, respiratory rate 24. Victor is high-risk but
comparatively flat — systolic up 13 mmHg and nothing else crossing threshold.

**A raw model sort would have placed these two adjacent.** The composite
separates them by 20 points, and the reason is inspectable.

**Where it lives**
- `src/utils/riskScore.js` — `computeCompositeRisk()`, `vitalsComponent()`, `rankByRisk()`

> Weights are a documented design choice, not a validated clinical scale. This
> is stated in the code header, in the "Why?" panel, and on the landing page.

---

## 3. Explainability is structural, not bolted on

**What it is.** Every risk score returns the factors that produced it, each with
its own points and a plain-English reason. The doctor's worklist has a **"Why?"**
panel showing the full derivation; the ML modal shows exact per-feature
contributions from the trained model.

**Why it's different.** Two decisions make this real rather than decorative:

**(a) The model was chosen for explainability, accepting lower accuracy.**
Logistic regression is served in preference to a random forest that scores
*higher* on accuracy (0.885 vs 0.869). The reason: a linear model's prediction
decomposes exactly —

```
log_odds = intercept + Σ (coefficient_j × scaled_value_j)
```

— so every feature's contribution is a real number that sums to the model's own
decision. A tree ensemble needs a post-hoc approximation (SHAP, treeinterpreter)
that is itself a model of the model. The accuracy gap is 1.6 points, which on a
61-record test set is **exactly one patient** — well inside the noise. The
explainability gain is categorical.

**(b) The explanation is self-verifying.** The service asserts at startup that
the reported contributions, plus the intercept, reconstruct the model's own
log-odds to within 1e-6. If preprocessing ever drifts out of sync with the
explanation, **the service refuses to start** rather than serving
plausible-looking but wrong attributions.

Verified live: a request returns 88% with `decision_log_odds: 1.98`, and
`sigmoid(1.98) = 0.879` — matching the reported probability.

**Where it lives**
- `ml-service/app/predictor.py` — `explain()`, `_assert_decomposition()`
- `ml-service/train.py` — model selection, both models trained and compared
- `ml-service/tests/test_api.py` — `test_contributions_reconstruct_the_decision`
- `src/components/ml/MLRiskModal.jsx` — contribution display
- `src/components/doctor/RiskRankedQueue.jsx` — the "Why?" panel

**Model performance** (UCI Cleveland, 303 records, 80/20 stratified split):

| Metric | Logistic regression (served) | Random forest |
|---|---|---|
| Accuracy | 0.869 | 0.885 |
| Precision | 0.812 | 0.839 |
| Recall | **0.929** | 0.929 |
| F1 | 0.867 | 0.881 |
| ROC-AUC | **0.960** | 0.951 |
| 5-fold CV ROC-AUC | 0.907 ± 0.019 | 0.898 ± 0.026 |

Recall was the metric to optimise: for a screening aid a false negative costs
more than a false positive. 2 false negatives against 6 false positives.

---

## 4. Single source of truth is structural, not a slogan

**What it is.** One append-only `clinical_events` table. Every mutation in the
system writes to it: check-in, vitals, SOAP note, prescription, ML assessment,
bed change, appointment, registration — **8 event types across 8 write sites**,
all funnelled through one module. Every role reads the same stream, filtered by
permission rather than by which department's copy they opened.

**Why it's different.** Most hospital systems keep a separate record per
department and reconcile them afterwards. The reconciliation is where data goes
stale and contradicts itself.

Two structural properties make this hold:

- **The timeline cannot be bypassed.** The event write sits next to the domain
  write in the same function, in one file. There is no path that updates
  clinical data without recording it.
- **The timeline cannot be rewritten.** `clinical_events` has **no UPDATE and no
  DELETE policy for any role** — verified: zero such policies exist in
  `rls.sql`. Append-only is enforced by Postgres, not by convention or by
  application code that could be bypassed.

**Where it lives**
- `supabase/schema.sql` — `clinical_events` table
- `supabase/rls.sql` — SELECT and INSERT policies only, deliberately no UPDATE/DELETE
- `src/lib/actions.js` — `logEvent()` plus 8 call sites
- `src/lib/timeline.js` — normalisation and day grouping
- `src/components/emr/PatientTimeline.jsx` — the rendered timeline

---

## 5. Role enforced at the database layer, not the client

**What it is.** Row-level security on **all 10 tables**, with **32 policies**
covering the five roles. The role comes from the `profiles` table after
authentication — it is never selected, sent, or stored client-side.

**Why it's different.** Many student and prototype systems implement roles as a
frontend toggle or a value in local storage — trivially spoofable by editing
one variable in devtools. Here the frontend guard is a *usability* affordance;
the actual boundary is Postgres.

Concretely: a receptionist querying `lab_results` receives zero rows regardless
of what the frontend asks for. The client cannot escalate its own privileges,
because it never held them.

Two design details worth pointing at:

- The login screen has **no role picker in live mode** — it only appears in the
  offline demo, where there is no database to protect. A client-side role picker
  would defeat the entire model.
- `auth_role()` is `SECURITY DEFINER` specifically to break RLS recursion when
  a policy on `profiles` needs to read `profiles`.

**Where it lives**
- `supabase/rls.sql` — full access matrix plus a **negative-test suite** documenting exactly which queries must return zero rows per role
- `src/context/AuthContext.jsx` — role read from `profiles`, never from client state
- `src/routes/guards.jsx` — `RoleRoute`, documented in-code as a UX guard rather than a security boundary

---

## 6. Real-time cross-role synchronisation, verified end to end

**What it is.** Supabase realtime subscriptions on `vitals`, `beds`,
`appointments` and `clinical_events`. A change made by one role appears in
another role's session without a refresh.

**Why it's different.** The differentiator isn't "we used websockets" — it's
that the realtime update feeds the *ranking*. A nurse recording deteriorating
observations at the bedside causes the attending doctor's worklist to re-order,
with a movement indicator showing the patient climbed. Information reaches the
person who needs it without anyone deciding to send it.

**Verified end to end** in a two-window test: nurse records vitals → the doctor's
worklist re-ranks and their care timeline updates within a second, no refresh,
with the event correctly attributed to the nurse.

**Where it lives**
- `src/context/DataContext.jsx` — subscriptions, plus a stale-response guard via request id
- `src/components/doctor/RiskRankedQueue.jsx` — rank-change indicators
- `src/components/emr/PatientTimeline.jsx` — re-reads on `lastSync`

---

## 7. Real safety checks, not decorative ones

**What it is.** The prescribing form checks the drug against the patient's
recorded allergies and active orders, and **blocks submission** on a
contraindication.

**Why it matters here.** The original prototype displayed a hardcoded
"0 contraindications flagged" banner that was pure decoration — it would have
said the same thing while prescribing penicillin to a penicillin-allergic
patient. That is worse than having no check at all, because it manufactures
false confidence.

It now performs a real bidirectional substring match, so "Aspirin" trips an
"Aspirin" allergy and "NSAIDs" trips a recorded "Ibuprofen, NSAIDs" entry, and
separately warns on duplicate active orders.

**Where it lives**
- `src/components/doctor/DoctorDashboard.jsx` — `allergyConflicts`, `duplicateOrder`

---

## 8. Honest about its own limitations

This is a differentiator in a category where overclaiming is the norm.

- **Model provenance is always visible.** The risk modal shows a green
  "Trained model" badge when the deployed service answered, and an amber
  "Fallback scorer" badge *with the reason* when it didn't — and in fallback it
  shows **no contribution numbers at all**, rather than presenting weaker output
  in the same format. Verified by killing the service mid-session.
- **The timeline distinguishes logged from derived.** In offline demo mode the
  timeline is reconstructed from the record and labelled **"Derived view"** in
  amber, rather than implying an audit trail that doesn't exist.
- **The data source is never ambiguous.** The navbar carries a Live data /
  Demo data pill.
- **Fabricated figures were removed rather than kept.** A `$428,500` revenue
  card and a meaningless `confidence = 92 + (score % 6)` were both deleted
  during the audit rather than left in to look impressive.
- **The model card documents what weakens it**: 303 records from a 1988
  single-centre cohort of patients *already referred for angiography*, 45.9%
  disease prevalence (far above any screening population), 68% male, and the
  fact that the two strongest predictors (`ca`, `thal`) require invasive or
  specialised procedures — which means this is a risk-stratification aid for
  patients already in a diagnostic pathway, **not** an early-screening tool.
- **A counterintuitive coefficient is explained, not hidden.** `age` carries a
  small negative coefficient, a multicollinearity artefact from `thalach` and
  `ca` being in the model. Documented rather than quietly dropped.

**Where it lives**
- `ml-service/README.md` — full model card and limitations
- `src/services/mlService.js` — fallback labelling
- `src/lib/timeline.js` — derived vs logged provenance
- `plan.md` — the build log, including every bug found and how

---

## Honest scope statement

Things a reader should not be misled about:

- **Patient data is synthetic.** Names, notes and vitals are fabricated. The ML
  feature vectors in the seed data are AI-generated, so individual patients'
  risk scores are not clinically meaningful — the model and pipeline are real,
  the inputs are illustrative.
- **Not clinically validated, not a medical device.** No regulatory assessment,
  no prospective validation, no external test set.
- **Not yet built:** MAR administration doesn't persist (no table for it), two
  Admin tabs remain static, and the frontend is not deployed.

---

## One-line summary

> A hospital system where risk **reorders the work** instead of interrupting it,
> every role writes to **one append-only record** they cannot rewrite, access is
> enforced by **Postgres rather than the browser**, and the risk model was
> deliberately chosen to be **less accurate but fully explainable** — with the
> system labelling its own uncertainty rather than hiding it.
