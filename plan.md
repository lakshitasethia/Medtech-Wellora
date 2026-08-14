# Wellora — Implementation Plan

**Status:** ✅ Phases 0, 1, 2 and 2.4 complete and verified (14 Aug 2026). Database live, trained model wired in.
**Remaining:** deploy the ML service to Render; Phase 3 differentiators (ambient risk ranking, unified timeline UI).
**Audit date:** 12 August 2026

## Progress log

### ✅ Phase 0 — complete (14 Aug 2026)
- 365 `class=` → `className=` across 13 files; console now clean (verified in Chrome)
- `MLRiskModal` hook-order crash fixed; modal opens correctly (verified)
- `key` props added to both modals so state resets per patient
- `src/index.css` split into `src/styles/{tokens,base,landing,components}.css`; **all 66 missing classes written** — automated check confirms 88/88 classes resolve
- Dataset expanded 3 → **14 patients**, 6 → 18 beds, 3 → 14 appointments
- `src/utils/metrics.js` added; **all 15 hardcoded metric literals replaced** with derived values
- Fabricated `$428,500` revenue card deleted; replaced with real appointment-throughput figures
- Fake "0 contraindications" banner replaced with a **real allergy + duplicate-order check** that blocks submission
- ML predictor relabelled honestly ("rule-based scorer v0.1"); meaningless `confidenceScore` removed
- Doctor queue now sorts chronologically; patient portal resolves via `activePatientId`, not `patients[0]`
- Patient role no longer sees cross-patient search or Quick EMR in the navbar (UI mirrors the intended RLS boundary)
- All five role dashboards visually verified in Chrome; `vite build` passes; lint clean apart from one benign fast-refresh notice

### ✅ Phase 1 — code complete (14 Aug 2026), awaiting SQL application
- `@supabase/supabase-js` + `react-router-dom` v7 installed; credentials verified against project `pgrzehdpihwmfbfonvtf`
- `supabase/schema.sql` — 10 tables, enums, indexes, realtime publication, `auth_role()` SECURITY DEFINER helper
- `supabase/rls.sql` — RLS on every table, full access matrix, append-only `clinical_events`, negative-test suite
- `supabase/seed.sql` — **generated from `mockData.js`** (148 inserts) so the two cannot drift
- `supabase/SETUP.md` — step-by-step application guide
- `AuthContext` rewritten: dual-mode (live Supabase session / offline mock), role read from `profiles` and never from the client
- Routing: `/`, `/login`, `/admin`, `/doctor`, `/nurse`, `/reception`, `/portal`, `/unauthorized`, 404
- `ProtectedRoute` (waits for session restore — no login flash on refresh), `RoleRoute`, `RedirectIfAuthed`
- `AppShell` holds the global EMR/ML modals so any role opens the same record by id
- Old `LoginModal` replaced by a routed `LoginPage`; role picker only exists in mock mode
- Navbar role-switcher now gated to mock mode; live mode shows the account's role as read-only

**Verified in-browser:** direct `/doctor` → `/login`; nurse → `/admin` → `/unauthorized` with the correct message; bad route → 404; EMR modal opens from the bed map; session survives refresh; console clean.

**Bug found and fixed during verification:** `RoleRoute`'s bare `<Outlet />` reset the outlet context to `undefined`, so every dashboard crashed with *"Cannot destructure property 'openEMR'"*. Switched the modal wiring to a dedicated `EMRContext`, which is immune to outlet nesting.

**Remaining (yours — needs SQL Editor privileges):** apply `schema.sql` → `rls.sql` → `seed.sql`, create one auth user per role with a `profiles` row, then set `VITE_USE_MOCK=false`. See `supabase/SETUP.md`.

### ✅ Phase 2 — data layer + per-role features (14 Aug 2026)
- `src/lib/repository.js` — the single DB↔UI boundary. Maps every table into the shape `mockData.js` already defined, so `metrics.js` and all dashboard rendering kept working untouched. Mock mode still returns the bundled dataset.
- `src/lib/actions.js` — all writes (vitals, SOAP notes, prescriptions, ML assessments, check-in, booking, bed status, registration). **Every mutation also appends to `clinical_events`**, so the timeline cannot be bypassed.
- `src/lib/format.js` — DB↔UI time/BP/unit conversion.
- `src/context/DataContext.jsx` — one fetch for the whole app + realtime subscriptions on vitals/beds/appointments/clinical_events; stale-response guard via request id.
- `src/components/common/States.jsx` — Skeleton / ErrorState / EmptyState + `DataSection` wrapper. Every data-backed view now has all three.
- **All five dashboards and both modals now read live data**; zero `WELLORA_DATA` imports remain in `src/components`.
- Doctor: live queue with a latest-vitals column, SOAP notes → DB, prescriptions → DB with the real allergy + duplicate-order block.
- Nurse: vitals → DB, bed status management (available/cleaning/occupied/critical), medication round computed from admitted patients' active orders.
- Receptionist: check-in → DB, appointment booking → DB, **new patient registration** with auto-generated next `WEL-####` id.
- Patient portal: driven entirely by RLS (`patients[0]` is the only row the DB returns); explicit empty state when no record is linked.
- Navbar shows a live/demo sync pill so it's never ambiguous which data source is on screen.

**Verified in-browser across all five roles:** 14-patient queue, 18 bed cards, allergy block (Aspirin → Marcus Thorne) + duplicate-order warning + safe-drug pass, vitals validation and submit, MAR round (18 doses), next-id `WEL-8956`, admin staff table, patient portal.

**Bug found and fixed:** the demo role switcher bounced to `/unauthorized` on every other switch. Cause: the role lives in React state but the location lives in React Router, whose update is async — so the new role rendered against the *old* route for one commit and that route's `RoleRoute` rejected it. Fixed with a full page load for the demo switcher (the role is already persisted in sessionStorage). Real logins were never affected.

**Also fixed while wiring:** `UnifiedEMRModal` had its new `useHospitalData()` hook below the early return (would have reintroduced the Phase 0 hook-order crash), and both modals now render an explicit "record unavailable" panel instead of silently falling back to another patient's chart — which would have been a confidentiality bug.

### ✅ Phase 2.4 — trained model wired end to end (14 Aug 2026)
- `src/services/mlService.js` — calls `POST /predict`, converts Kaggle→UCI encoding in one place, falls back to the local scorer on failure and **labels the fallback honestly**.
- `MLRiskModal` rewritten: debounced live scoring, real per-prediction log-odds contributions with signed values, model-provenance badge (green "Trained model" / amber "Fallback scorer" + reason).
- `sex` now taken from the patient record instead of being hardcoded to male — that was skewing every female patient's score upward.
- **"Save Assessment to EMR" now actually persists** via `saveAssessment`, writing to `ml_assessments` and the `clinical_events` timeline. It previously only fired a toast.

**Verified end to end against the running service:** Eleanor Vance scored 88% (probability 87.8%, log-odds 1.98 — `sigmoid(1.98)=0.879`, consistent); lowering cholesterol/oldpeak dropped it to 78%, raising them pushed it to 96%; killing the service mid-session flipped the badge to the amber fallback with the reason shown and no fabricated contribution numbers; save fired correctly.

**Bug caught by lint:** `stored = patient?.mlHeartRisk?.parameters ?? {}` minted a new object every render, feeding `params` → scoring effect → setState → render. That would have called the model in an infinite loop. Memoised.

**Still outstanding:** the service runs locally only. Deploy to Render via `render.yaml` (repo root), then set `VITE_ML_API_URL` to the deployed URL.

### ✅ ML service — complete (14 Aug 2026)
Built in `ml-service/`. Logistic regression on the UCI Cleveland dataset: accuracy 0.869, recall 0.929, ROC-AUC 0.960, CV AUC 0.907 ± 0.019. Exact per-prediction log-odds explanations, self-verified at startup. FastAPI with `/predict`, `/health`, `/model-info`. 14 tests pass. Exact version pins + `version_match` health check. See `ml-service/README.md`.

**Note:** the API uses raw UCI encoding; `mockData.js` uses Kaggle-style codes. Conversion table is in the ML README — needed for Phase 2.4.
**Audited tree:** `/Users/lakshitasethia/MedTech` (React 19.2.8 + Vite 8.2.1, 2,604 LOC across 14 JSX/JS files)

---

## Part 1 — Codebase Audit

### 1.0 Headline finding: the described stack is not the built stack

The brief describes "React frontend, Supabase backend (Postgres, Auth, Realtime), a deployed Python/FastAPI ML microservice." **None of the backend exists in this repo.** Verified:

| Claimed | Actual | Evidence |
|---|---|---|
| Supabase (Postgres/Auth/Realtime) | Absent | `@supabase/supabase-js` not in `package.json`; not in `node_modules` |
| FastAPI ML microservice | Absent | Zero `fetch(`/`axios`/`http` calls anywhere in `src/` |
| Role-based login | Absent | `LoginModal.jsx` ignores username/password entirely |
| Routing | Absent | No `react-router-dom`; navigation is a `switch` on state |
| Tailwind / PostCSS | Absent | Not installed; `vite.config.js` has only `@vitejs/plugin-react` |

Full dependency list is `react`, `react-dom`, `lucide-react`. Everything renders from one static file, `src/data/mockData.js` (3 patients, 6 staff, 6 beds, 3 appointments).

This is not a criticism — it is a well-built **static prototype**. But scope must be planned honestly: the backend is Phase 1 work, not "already done." The ML microservice may well exist as a deployed service elsewhere; it is simply not wired to this frontend.

**The build is healthy.** `npx vite build` succeeds in 483ms → 258 kB JS / 8.2 kB CSS. Nothing is broken at the toolchain level.

---

### 1.1 Why the styling fails

**Not** a Tailwind/PostCSS/purge problem — there is no Tailwind. The cause is simpler and total:

> **66 of the 88 CSS classes used in JSX are never defined in `src/index.css`.**

`index.css` (456 lines) styles only the landing page, login card, pill buttons, sub-nav tabs, modal shell, and toasts. Every class belonging to the **navbar, all five dashboards, tables, badges, forms, bed map, and the ML risk gauge** is missing. The CSS was written to match two reference images (landing + login) and stops there.

This explains the symptom precisely: the landing page and login screen look correct, and everything behind the login looks unstyled. It is not "at least one dashboard" — it is the navbar plus all five dashboards plus both modals.

The 66 missing classes, grouped:

| Group | Missing classes |
|---|---|
| Navbar (18) | `navbar`, `brand-container`, `brand-logo-wrapper`, `pulse-w-svg`, `brand-text-container`, `brand-name`, `brand-tagline`, `emr-architecture-pill`, `emr-pulse-dot`, `navbar-actions`, `search-wrapper`, `search-icon`, `search-input`, `user-profile-badge`, `avatar-circle`, `user-info`, `user-name`, `user-role-title` |
| Dashboard shell (13) | `dashboard-header-banner`, `header-banner-text`, `header-banner-actions`, `role-badge-pill`, `metrics-grid`, `metric-card`, `metric-info`, `metric-label`, `metric-value`, `metric-trend`, `up`, `down`, `metric-icon-box` |
| Cards & tables (6) | `glass-card`, `card-header-row`, `card-title`, `card-subtitle`, `table-responsive`, `custom-table` |
| Badges (5) | `badge`, `badge-danger`, `badge-warning`, `badge-success`, `badge-info` |
| Forms (5) | `form-group`, `form-label`, `form-input`, `form-textarea`, `form-select` |
| Modal internals (3) | `modal-body`, `modal-footer`, `modal-close-btn` |
| Bed map (4 + 4 state) | `bed-map-grid`, `bed-card`, `bed-number`, `bed-patient-name` + `.critical`/`.occupied`/`.cleaning`/`.available` |
| ML gauge (8) | `risk-gauge-container`, `risk-circle-wrapper`, `risk-circle-svg`, `risk-circle-bg`, `risk-circle-fill`, `risk-value-text`, `risk-percentage`, `risk-level-tag` |

Secondary issue: **every JSX file uses `class=` instead of `className=`** — 365 occurrences, zero `className`. I tested this against React 19.2.8 rather than assuming:

```
Invalid DOM property `class`. Did you mean `className`?
<div class="glass-card">hi</div>
```

React **does** render the attribute, so this is *not* what breaks the styling — but it logs 365 console warnings and is wrong. Fix it mechanically in Phase 0.

`src/App.css` (184 lines) is leftover Vite boilerplate — never imported, safe to delete.

---

### 1.2 Where the data/UI mismatches come from

The "14 Patients vs 3 rows" bug is one instance of a **systematic pattern in all five dashboards**: metric cards are hardcoded string literals, while the tables below them map over `WELLORA_DATA`.

`DoctorDashboard.jsx:48` — `<span class="metric-value">14 Patients</span>`
`DoctorDashboard.jsx:96` — `WELLORA_DATA.patients.map(...)` → 3 rows

The same file even contradicts *itself*: line 33 renders `Today's Queue ({WELLORA_DATA.patients.length})` → "Today's Queue (3)" sitting directly above a card claiming 14.

Complete inventory of hardcoded metrics:

| File | Line | Hardcoded | Real value |
|---|---|---|---|
| DoctorDashboard | 48 | `14 Patients` | 3 |
| DoctorDashboard | 49 | `8 Completed \| 4 Waiting` | — (8+4≠14 either) |
| DoctorDashboard | 57 | `2 Patients` high-risk | 1 (only WEL-8942 >75) |
| DoctorDashboard | 66 | `18 Today` prescriptions | 6 |
| AdminDashboard | 52, 61, 70, 79 | `84.0%`, `$428,500`, `142`, `91%` | no source data |
| NurseDashboard | 43, 52, 61 | `42/50 Beds`, `6 Patients`, `8 Dosages` | 6 beds total |
| ReceptionistDashboard | 42, 51, 60 | `68 Bookings`, `42 Waiting`, `7 Pending` | 3 appointments |
| PatientDashboard | 43, 52, 61 | `Today 3:30 PM`, `3 Daily Meds`, `78% Risk` | partially real |

Other correctness defects found:

1. **`MLRiskModal.jsx` violates the Rules of Hooks and will crash.** `useAuth()` runs at line 8, then `if (!isOpen) return null;` at line 9, then **six `useState` calls** at lines 14–19. Closed = 1 hook, open = 7 hooks. Since `App.jsx:56` keeps the component permanently mounted and only toggles `isOpen`, opening the modal throws *"Rendered more hooks than during the previous render."* Every "Run ML Risk" button is dead. Move the early return below all hooks.

2. **Stale ML modal state.** Even once fixed, `useState(initialParams.age)` seeds only on first mount, so opening the modal for a second patient shows the first patient's values. Needs `key={patientId}` on the element or a `useEffect` resync.

3. **`mlPredictor.js` is not ML.** It is a 63-line hand-written if/else additive scorer, and `MLRiskModal.jsx:49` labels it *"FastAPI ML Heart Disease Risk Predictor."* Its `confidenceScore` is `92 + (score % 6)` — a cosmetic number with no statistical meaning. **This is the one thing in the project that would not survive a viva.** Either wire the real FastAPI model or relabel it honestly as a rule-based scorer until you do.

4. **Hardcoded identity.** `PatientDashboard.jsx:9` is `WELLORA_DATA.patients[0]` — the patient portal always shows Eleanor Vance regardless of who logs in. `Navbar.jsx` hardcodes name/title per role. `DoctorDashboard.jsx:98` prints `09:30 AM` for every queue row.

5. **`AuthContext` has no auth.** `login(role)` just sets state; the password field is prefilled with a literal bullet string (`LoginModal.jsx:9`).

---

### 1.3 Salvageable vs. rebuild

**Keep as-is (genuinely good work):**
- `src/data/mockData.js` — clinically coherent, well-shaped. This is your **schema specification**; the Postgres tables should mirror it.
- The design language in `index.css` lines 1–50 (token system) and the landing/login styling. Cohesive and better-looking than most FYP work.
- Component boundaries — `components/<role>/` + `components/common|emr|ml/` is the right layout. Keep every file path.
- The modal-lifted-to-`App.jsx` pattern (single EMR modal, single ML modal, opened by ID from any role). This is a genuinely good decision and directly expresses the Single-Source-of-Truth thesis.
- `UnifiedEMRModal.jsx` structure and `Toast.jsx`.

**Rebuild:**
- `AuthContext.jsx` — replace wholesale with Supabase session + `profiles.role`.
- Navigation — `App.jsx`'s `switch` on `userRole` must become real routes. The Navbar role-switcher dropdown (`Navbar.jsx:93–115`) must go: it lets a "patient" become an "admin" in one click, which is the opposite of role-based access. Keep it only behind a dev-only flag for demo convenience.
- All 15 metric cards — compute from data, never literals.
- `mlPredictor.js` — replace with a call to the real service, keep the local function as offline fallback.

**Structurally fine, needs completion:** all five dashboards. They need CSS, real data binding, and role guards — not rewrites.

---

## Part 2 — Competitive Research

### 2.1 The incumbents

| System | Role-based UX today | Where it is still clunky |
|---|---|---|
| **Epic** | Role-specific "Workspaces"/SmartSets; Hyperspace toolbars per specialty. Redesigned interface shipping 2026, plus Cosmos AI and an agentic roadmap previewed at HIMSS 2026. | The most-used and most-disliked product in healthcare. Documentation burden is the single leading driver of physician burnout; clinicians finish notes after hours ("pajama time"). Dense, modal-heavy, keyboard-shortcut-dependent — powerful for experts, opaque for everyone else. |
| **Oracle Health (Cerner)** | Shipped an **AI-first, voice-first EHR** built new on OCI — *not* on Cerner infrastructure — with conversational navigation and an embedded clinical AI agent. 2026 plan adds agents across revenue cycle, nursing, clinical ops, plus acute-care functionality. | The legacy Cerner Millennium estate most hospitals actually run is unchanged; migration is slow. Effectively admits the old UX was unfixable by rebuilding from scratch. |
| **MEDITECH Expanse** | The best incumbent answer to role-based IA: a **widget-configurable Summary screen** per provider, specialty-based widgets, and an Efficiency Dashboard with real-time per-user metrics. Clickable summary headers expand to trended data. | Configuration burden falls on the hospital's IT team, not the clinician. Strong in community hospitals, weaker outside the US. |
| **athenahealth** | Cloud-native, strong ambulatory + billing focus, network-wide rules engine. | Optimised for practice revenue cycle rather than inpatient/ward workflow; little to say about ICU beds, triage, or nursing handoff. |

### 2.2 The newer/leaner tier

A distinct category has formed around **headless, FHIR-native, API-first EHRs**: **Medplum** (open-source, developer-first, HIPAA/SOC2 out of the box), **Canvas Medical** (programmable, bidirectional FHIR API, Workflow SDK, "Narrative Charting"), **Elation** (modular, small-practice primary care), plus **Healthie**, **Oystehr**, **OpenEMR**.

Their shared thesis is the one Wellora should borrow: **the data layer is a commodity; the differentiated product is the workflow layer on top of it.** Medplum in particular is the closest architectural analogue to Supabase-as-EMR-backend — worth one paragraph in your report as prior art.

### 2.3 State of the art in 2026 — what actually matters

1. **Ambient/voice documentation is the headline feature everywhere.** Epic, Oracle, and MEDITECH all lead their 2026 roadmaps with it. Removing the keyboard from the documentation loop measurably reduces after-hours work, note completion time, and reported burnout. Oracle's agent alone claims 200,000+ clinician hours saved across 300+ organisations.
2. **Agentic AI is the 2026 buzzword**, defined as multiple AI agents sharing context and collaborating in near real time rather than one chatbot.
3. **Alert fatigue is the unsolved problem — and it is your opening.** Documented CDS alert override rates run **49%–96%**. Sepsis CDS tools are widely deployed but limited by over-alerting and poor workflow integration. A 2026 *JAMIA* systematic review exists purely on how to *measure* alert fatigue. Recent work reframes clinician overrides as implicit preference signals rather than errors. **Nobody has convincingly solved "surface risk without interrupting."**
4. **Usability is now quantified**: each one-point gain in EHR usability score corresponds to a ~3% reduction in the odds of burnout.
5. **Role-based IA is converging on configurable widgets** (MEDITECH) rather than fixed per-role screens — personalisation *within* a role, not just between roles.

---

## Part 3 — Wellora's Innovation Angle

The gap the research points at is sharp: incumbents are pouring 2026 budget into **AI that writes** (ambient notes) while **AI that warns** remains broken — alerts get overridden up to 96% of the time because they interrupt. Wellora's three assets (unified EMR, heart-risk model, realtime sync) line up against exactly that gap.

### Idea 1 — Ambient Risk Ranking, not risk alerts ⭐ **lead with this**
**Feasibility: buildable, ~1–2 weeks. This is the thesis.**

Never fire a modal at a clinician. Instead the doctor's patient queue is **permanently sorted by a composite deterioration score** — ML heart risk + vitals trend direction + flagged-lab count — with a colour-graded rail down the left edge. Risk becomes *ambient and ordinal* rather than *interruptive and binary*. When a nurse records a worsening BP, the patient silently climbs the doctor's list in realtime.

Why it's defensible in a viva: you can cite the 49–96% override literature, state that Wellora's design hypothesis is that **ranking beats interrupting**, and demo the re-sort live. That is a real research-grounded design argument, not "nicer UI."

### Idea 2 — One Patient, One Timeline (Single Source of Truth, made visible) ⭐ **build this**
**Feasibility: buildable, ~1 week.**

Right now "Single Source of Truth" is a badge in the navbar (`Navbar.jsx:32`). Make it a **feature you can point at**: one append-only `clinical_events` table where receptionist check-in, nurse vitals, doctor SOAP note, prescription, lab result, and ML assessment all land as rows with `actor_role` attribution. Every role sees *the same timeline*, filtered by RLS rather than copied into a separate departmental view.

The demo: open two browser windows side by side, nurse and doctor. Nurse posts vitals. It appears on the doctor's timeline in under a second, attributed and timestamped. That single 15-second demo proves SSoT + realtime + RBAC simultaneously.

### Idea 3 — Closed-loop risk accountability
**Feasibility: buildable in simplified form, ~4–5 days. Trim first if time is short.**

A high ML score doesn't just display — it opens a tracked `risk_actions` record (`acknowledged` → `action_taken` → `resolved`) assigned to a role, with the acknowledging clinician and timestamp recorded on the timeline. Answers the question no EHR answers well: *the system flagged this patient — what did we actually do about it, and when?* Also gives Admin a real, non-fabricated metric: mean time-to-acknowledge.

### Idea 4 — Explainable, provenanced ML scores
**Feasibility: small, ~2 days. High report-value per hour.**

Every risk score shows: contributing features, model version, **which vitals row it was computed from**, and a "clinician disagrees" button capturing structured feedback. Directly addresses the 2026 literature treating overrides as preference signals. Cheap to build, disproportionately impressive in a report, and it forces you to fix the fake `confidenceScore` honestly.

### Future scope — name in the report, do not build
- **Ambient voice documentation** (the actual 2026 arms race — Whisper + LLM SOAP drafting). Genuinely out of scope solo; being able to say *why* it's out of scope is itself a good report section.
- **FHIR R4 export** — one endpoint mapping your schema to FHIR `Patient`/`Observation` would be a strong "interoperability" paragraph if time allows.
- Multi-agent orchestration, drift monitoring, real HIPAA compliance posture.

---

## Part 4 — Phased Implementation Plan

> Conventions: `[ ]` = task. Do phases in order; tasks within a phase in listed order.
> After every phase: `npx vite build` must pass and the browser console must be clean.

---

### Phase 0 — Make the existing prototype correct and visible
**Goal: the app you already have, working and styled. No new features. No backend.**
**Est. 1–2 days. Do not start Phase 1 until this is green.**

#### 0.1 Mechanical correctness
- [ ] Codemod `class=` → `className=` across all 13 JSX files (365 occurrences). Must handle both `class="..."` and `` class={`...${x}`} ``. Verify: `grep -rn ' class=' src/` returns nothing.
- [ ] `src/components/ml/MLRiskModal.jsx` — move `if (!isOpen) return null;` (line 9) to **below** all six `useState` calls (lines 14–19). This fixes the "Rendered more hooks" crash.
- [ ] `src/App.jsx:56` — add `key={activeMLPatientId}` to `<MLRiskModal>` so slider state resets per patient. Same for `<UnifiedEMRModal>`.
- [ ] Delete `src/App.css` (unused Vite boilerplate).
- [ ] `index.html` — title `vintage` → `Wellora — Unified Hospital Management`.
- [ ] `package.json` — `"name": "vintage"` → `"wellora"`.
- [ ] Run `npm run lint`; remove unused imports (e.g. `Shield` in `LoginModal.jsx`, `Plus` in `DoctorDashboard.jsx`).

#### 0.2 Complete the design system
Split `src/index.css` into `src/styles/` and import all from `index.css` in this order:

- [ ] `src/styles/tokens.css` — move `:root` block (current `index.css` lines 5–50) verbatim. Add semantic aliases: `--risk-low: #059669`, `--risk-moderate: #D97706`, `--risk-high: #E11D48`.
- [ ] `src/styles/base.css` — reset, `body`, `body::before`, `#root` (lines 52–90).
- [ ] `src/styles/landing.css` — hero + login card (lines 92–313). Unchanged.
- [ ] `src/styles/components.css` — **the 66 missing classes.** Match the existing glassmorphic language: `rgba(255,255,255,0.78)` fills, `backdrop-filter: blur(16px)`, `--radius-lg`, `--glass-shadow`. Build in this order:
  - [ ] Navbar group (18 classes) — `.navbar` is a sticky flex header; `.emr-pulse-dot` gets a keyframed cyan pulse; `.search-wrapper` is `position: relative` with `.search-icon` absolutely placed left and `.search-input` padded to clear it.
  - [ ] Dashboard shell (13) — `.metrics-grid` is `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`; `.metric-trend.up` green, `.metric-trend.down` red.
  - [ ] Cards & tables (6) — `.glass-card` is the workhorse; `.table-responsive` needs `overflow-x: auto`; `.custom-table` needs `border-collapse: separate` + sticky `thead`.
  - [ ] Badges (5) — one `.badge` base + 4 tinted variants (10% bg / 30% border / solid text).
  - [ ] Forms (5) — reuse `.login-pill-input` metrics for visual consistency.
  - [ ] Modal internals (3) — `.modal-body` needs `overflow-y: auto` (parent `.glass-modal` is already `max-height: 90vh`); `.modal-footer` right-aligned flex.
  - [ ] Bed map (4 + 4 states) — `.bed-map-grid` auto-fit `minmax(200px,1fr)`; `.bed-card.critical/.occupied/.cleaning/.available` set left-border + tint.
  - [ ] ML gauge (8) — `.risk-circle-svg` rotated `-90deg`; `.risk-circle-fill` needs `stroke-dasharray: 440` (r=70 → circumference 439.8, matching the `440 - (440*score/100)` offset already in `MLRiskModal.jsx:109`) and `transition: stroke-dashoffset 0.6s`.
- [ ] Verify: `grep` every `className` literal in `src/` against the compiled CSS — zero undefined classes remain.
- [ ] Responsive pass at 1280px and 768px: `.metrics-grid` collapses, tables scroll rather than overflowing the page.

#### 0.3 Kill the fabricated numbers
- [ ] Create `src/utils/metrics.js` exporting `computeDoctorMetrics(data)`, `computeNurseMetrics(data)`, `computeReceptionistMetrics(data)`, `computeAdminMetrics(data)`, `computePatientMetrics(patient)`.
- [ ] Replace all 15 hardcoded `metric-value` literals (table in §1.2) with these calls. **No numeric string literals may remain in a `metric-value`.**
- [ ] Expand `mockData.js` to ~12–14 patients so "Today's Queue" is genuinely a queue and the ranking in Phase 3 has something to rank. Reuse the existing record shape exactly; vary triage priority, risk score, and vitals trend.
- [ ] Replace the hardcoded `09:30 AM` (`DoctorDashboard.jsx:98`) with a real `appointmentTime` field per patient.
- [ ] Relabel `MLRiskModal.jsx:49` from "FastAPI ML Heart Disease Risk Predictor" to "Heart Risk Assessment (rule-based — model integration pending)" until Phase 2.4 wires the real service. Remove the meaningless `confidenceScore` (`mlPredictor.js:55`) or replace it with the model's real probability.

---

### Phase 1 — Information architecture: real auth, real routes
**Goal: five roles log in with credentials and land in separate, guarded areas.**
**Est. 4–6 days.**

#### 1.1 Backend foundation
- [ ] `npm i @supabase/supabase-js react-router-dom`
- [ ] `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Add `.env.local` to `.gitignore` (currently absent).
- [ ] `src/lib/supabase.js` — single exported client.
- [ ] `supabase/schema.sql` — mirror `mockData.js`:
  `profiles` (id → auth.users, full_name, role enum, department, shift)
  `patients` (id, demographics, blood_type, allergies[], chronic_conditions[], assigned_doctor_id, room_bed, triage_priority, portal_user_id → auth.users)
  `vitals` (patient_id, recorded_by, recorded_at, bp_systolic, bp_diastolic, hr, temp, spo2, rr)
  `prescriptions`, `lab_results`, `consultation_notes` (SOAP as columns, not JSON), `appointments`, `beds`, `staff_shifts`
  `ml_assessments` (patient_id, risk_score, risk_category, model_version, input_snapshot jsonb, computed_at)
- [ ] `supabase/rls.sql` — enable RLS on **every** table. Policies:
  - Admin: full read across all tables
  - Doctor: read all patients, write notes/prescriptions/ml_assessments
  - Nurse: read assigned-ward patients, write vitals only
  - Receptionist: read/write appointments + patient demographics; **no** clinical data
  - Patient: read **only** rows where `patient_id` maps to their own `auth.uid()`
  - [ ] Write one deliberately-failing test per role (e.g. patient B selecting patient A) and record the denial. **This is your report's security section — do not skip it.**
- [ ] `supabase/seed.sql` — port expanded `mockData.js`. Keep `mockData.js` in the repo as the offline fallback.

#### 1.2 Auth
- [ ] Rewrite `src/context/AuthContext.jsx`: `supabase.auth.getSession()` on mount, `onAuthStateChange` subscription, fetch `profiles` row for role, expose `{ session, profile, role, loading, signIn, signOut }`. Keep the existing `showToast` API so no call site breaks.
- [ ] Rewrite `LoginModal.jsx` to real `signInWithPassword`. Remove the role-tab selector (`lines 58–69`) — **role comes from the database, never from the client.** Add error display and a loading state. Remove the prefilled password (line 9).
- [ ] Add a dev-only demo-credentials block, gated on `import.meta.env.DEV`, so examiners can log in as each role.

#### 1.3 Routing
- [ ] `src/routes/index.jsx` — `createBrowserRouter`:
  `/` public landing · `/login` · `/admin/*` · `/doctor/*` · `/nurse/*` · `/reception/*` · `/portal/*` · `/unauthorized` · `*` 404
- [ ] `src/routes/ProtectedRoute.jsx` — redirects to `/login` when no session; renders a spinner while `loading` (prevents the login-flash on refresh).
- [ ] `src/routes/RoleRoute.jsx` — takes `allow={['doctor']}`, redirects to `/unauthorized` on mismatch.
- [ ] `src/components/common/AppShell.jsx` — extract the layout from `App.jsx:40–63` (Navbar + `<main>` + global modals + Toast) and render `<Outlet/>`. Modals stay lifted here so any role can open the same EMR by ID.
- [ ] Rewrite `App.jsx` to just `<AuthProvider><RouterProvider/></AuthProvider>`. Delete the `renderDashboard()` switch.
- [ ] `Navbar.jsx` — delete the role-switcher dropdown (lines 76–115) or gate it entirely behind `import.meta.env.DEV`. Replace hardcoded `roleTitles` with the live `profile`. Keep logout.
- [ ] Verify each role: direct-URL access to another role's route redirects to `/unauthorized`, and refresh preserves the session.

---

### Phase 2 — Feature build-out per role
**Goal: every dashboard reads and writes real data.**
**Est. 1.5–2 weeks. Build roles in this order — each one feeds the next.**

#### 2.1 Data layer first
- [ ] `src/hooks/usePatients.js`, `useVitals.js`, `useAppointments.js`, `useBeds.js`, `useStaff.js` — each returns `{ data, loading, error, refetch }`.
- [ ] `src/hooks/useRealtime.js` — wraps `supabase.channel().on('postgres_changes', ...)`. Used heavily in Phase 3.
- [ ] Point `computeXMetrics()` from Phase 0.3 at live query results.
- [ ] `src/components/common/{Skeleton,ErrorState,EmptyState}.jsx` — every dashboard needs all three states. Prototypes never have them; examiners always notice.

#### 2.2 Receptionist (build first — it creates the data everyone else consumes)
- [ ] Patient registration form → `patients` insert, with validation.
- [ ] Appointment booking: doctor + date/time picker, double-booking check.
- [ ] Check-in action flipping `status` → `Checked-In`, writing a `clinical_events` row.
- [ ] Live queue board sorted by appointment time.

#### 2.3 Nurse
- [ ] Vitals entry form → `vitals` insert (this is the realtime trigger for Phase 3).
- [ ] Bed map wired to `beds`; assign/discharge/mark-cleaning actions.
- [ ] Medication administration checklist against active `prescriptions`.
- [ ] Shift handoff note (SBAR) — cheap to add, and it maps to a real, well-documented clinical workflow.

#### 2.4 Doctor
- [ ] Queue table from live data, showing each patient's latest vitals.
- [ ] SOAP note form → `consultation_notes` insert (currently `DoctorDashboard.jsx:141` only fires a toast).
- [ ] Prescription builder → `prescriptions` insert. Implement a **real** allergy check against `patients.allergies` — the current "0 contraindications flagged" banner (line 183) is hardcoded and must either work or go.
- [ ] Wire the real FastAPI endpoint: `src/services/mlService.js` with `POST /predict`, `mlPredictor.js` as the offline fallback, results persisted to `ml_assessments`. Restore the honest "ML" label from Phase 0.3.

#### 2.5 Patient portal
- [ ] Replace `patients[0]` (`PatientDashboard.jsx:9`) with the RLS-scoped record for `auth.uid()`.
- [ ] Own appointments, prescriptions, lab results; appointment request flow.
- [ ] Deliberately restrict the view: no raw ML score without clinician context. Being able to justify *withholding* a number is a strong report point.

#### 2.6 Admin
- [ ] Staff directory CRUD, user-role assignment.
- [ ] Real analytics from real rows — occupancy, appointments/day, average risk by department. **Delete the `$428,500` revenue card** unless you build billing; a fabricated figure on an examiner's screen is worse than an empty column.
- [ ] Audit log view over `clinical_events` (pairs with Phase 3.2).

---

### Phase 3 — The differentiators
**Goal: the two or three things that make this Wellora and not a CRUD app.**
**Est. 1.5–2 weeks. Build 3.1 and 3.2 even if you cut everything else.**

#### 3.1 Ambient Risk Ranking (Idea 1)
- [ ] `src/utils/riskScore.js` — `computeCompositeRisk(patient, vitalsHistory, labs)` combining ML heart risk (weighted highest), vitals **trend** (last 3 readings, direction-aware — a rising BP scores worse than a static high one), flagged-lab count, and triage priority. Document the weighting in the file header; you will be asked to justify it.
- [ ] Postgres view or generated column so ranking happens server-side, not in the browser.
- [ ] `src/components/doctor/RiskRankedQueue.jsx` — replaces the current queue table. Left colour rail per row, composite score column, default sort descending.
- [ ] **No modal, no toast, no interrupt.** When rank changes, animate the row's position (FLIP or a CSS transition) so the movement is noticed peripherally.
- [ ] Subscribe to `vitals` inserts via `useRealtime` → recompute → re-sort live.
- [ ] Add a "why is this patient ranked here?" popover listing the contributing factors.

#### 3.2 One Patient, One Timeline (Idea 2)
- [ ] `clinical_events` table: `(id, patient_id, actor_id, actor_role, event_type, summary, payload jsonb, created_at)`. Append-only — no UPDATE/DELETE policy for anyone.
- [ ] Write an event from **every** mutation in Phase 2 (check-in, vitals, note, prescription, bed change, ML assessment).
- [ ] `src/components/emr/PatientTimeline.jsx` — vertical timeline, role-coloured markers, role-filter chips. Add as a tab inside `UnifiedEMRModal.jsx`.
- [ ] Realtime subscription so the timeline updates while open.
- [ ] **Rehearse the demo:** two windows, nurse + doctor, same patient. Nurse posts vitals → doctor's timeline updates *and* the patient moves up the risk queue. Time it; keep it under 20 seconds.

#### 3.3 Closed-loop risk accountability (Idea 3 — trim first if behind)
- [ ] `risk_actions` table: `(patient_id, triggered_by_assessment_id, assigned_role, status, acknowledged_by, acknowledged_at, action_note, resolved_at)`.
- [ ] Acknowledge / record-action / resolve UI on the doctor queue.
- [ ] Admin metric: mean time-to-acknowledge for high-risk flags. A real, computed, defensible KPI.

#### 3.4 Explainability & provenance (Idea 4 — cheap, do it)
- [ ] Extend `MLRiskModal` to show model version and the `vitals.id` the score was computed from.
- [ ] "Clinician disagrees" → structured feedback row (reason + free text), surfaced in Admin. Cite the override-as-preference-signal framing in the report.

---

## Decisions I made for you (flag if you disagree)

1. **No Tailwind.** You have 365 hand-written class attributes and a coherent 50-token design system already. Adding Tailwind means rewriting every component for zero user-visible gain. Completing `components.css` is roughly a day; migrating to Tailwind is a week of churn. If you want utility classes later, do it after Phase 3, never during.
2. **Phase 0 before everything.** It is tempting to jump to Supabase. Don't — you cannot tell whether Phase 1 broke something if the app is already visually broken and the ML modal already crashes.
3. **Build Receptionist first in Phase 2**, not Doctor. Registration and check-in create the rows every other role reads; building Doctor first means hand-seeding data twice.
4. **Keep `mockData.js` permanently** as an offline fallback behind a `VITE_USE_MOCK` flag. Live demos fail; a demo that survives a dead wifi connection is worth the small maintenance cost.
5. **Idea 1 is the headline.** If time collapses, ship Phases 0–2 plus 3.1 and 3.2 and cut the rest. That is still a strong, coherent project.

## Credentials needed

Everything below is blocked until these exist. Nothing else in the plan is.

| What | Where to get it | Goes in | Blocks |
|---|---|---|---|
| `VITE_SUPABASE_URL` | supabase.com → new project → Settings → API → Project URL | `.env.local` | Phase 1 onward |
| `VITE_SUPABASE_ANON_KEY` | same page → `anon` `public` key (**not** `service_role`) | `.env.local` | Phase 1 onward |
| `VITE_ML_API_URL` | base URL of the deployed FastAPI service (`POST /predict`) | `.env.local` | Phase 2.4 only |

The anon key is safe in a client bundle **only because RLS is enabled** — that is what `supabase/rls.sql` is for. Never put the `service_role` key in this app.

Once the project exists, apply in order: `supabase/schema.sql`, then `supabase/rls.sql`, then create one auth user per role and insert matching `profiles` rows.

## Open questions
- Does the FastAPI heart-risk service actually exist and is it reachable? Nothing in this repo calls it. Phase 2.4 assumes a deployed `POST /predict`; if it isn't deployed, add ~3 days.
- Is the Supabase project provisioned, or is Phase 1.1 starting from zero?
- What is your actual deadline? The plan above is roughly 5–6 weeks of solo part-time work.

## Sources
- [EHR usability & documentation burden scoping review (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12206486/)
- [Why EHR documentation is the leading cause of physician burnout — Tebra](https://www.tebra.com/theintake/ehr-emr/how-documentation-became-top-cause-of-physician-burnout)
- [What's behind EHR-induced clinician burnout? — Healthcare IT News](https://www.healthcareitnews.com/news/whats-behind-ehr-induced-clinician-burnout-and-how-solve-it)
- [How I Would Redesign Epic — AIUX](https://adhdux.com/?p=1290)
- [Oracle Health debuts voice-first, agentic AI EHR — Fierce Healthcare](https://www.fiercehealthcare.com/health-tech/oracle-health-debuts-ai-powered-ehr-designed-voice-first-solution-embedded-agentic-ai)
- [AI's next act: how Oracle Health sees 2026 — Becker's](https://www.beckershospitalreview.com/healthcare-information-technology/ais-next-act-how-oracle-health-sees-2026-taking-shape/)
- [Oracle ushers in new era of AI-driven EHRs](https://www.oracle.com/news/announcement/oracle-ushers-in-new-era-of-ai-driven-electronic-health-records-2025-08-13/)
- [What's coming to MEDITECH in 2026 — Becker's](https://www.beckershospitalreview.com/healthcare-information-technology/ehrs/whats-coming-to-meditech-in-2026/)
- [MEDITECH Expanse customizable features — CereCore](https://resources.cerecore.net/meditech-expanse-customizable-features-that-improve-clinician-satisfaction)
- [Expanse for Physicians — MEDITECH](https://ehr.meditech.com/ehr-solutions/expanse-for-physicians)
- [Headless EHR comparison: Medplum vs Healthie vs Canvas vs Oystehr vs OpenEMR](https://www.mindbowser.com/headless-ehr-comparison/)
- [Developer-friendly EHR systems to watch — ObjectStyle](https://www.objectstyle.com/blog/developer-friendly-ehr-systems-to-watch-in-2025)
- [Canvas Medical SDK guide](https://www.mindbowser.com/canvas-medical-sdk-guide/)
- [Alert fatigue measurement in CDS: systematic review (JAMIA 2026, PDF)](https://www.metrohealth.org/globalassets/metrohealth-documents/population-health-research-institute/ray-wilson-et-al-2026-alert-fatigue-systematic-review.pdf)
- [Sepsis CDS tool knowledge and utilization (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12812634/)
- [How to reduce alert fatigue in healthcare CDS (2026)](https://www.mindbowser.com/reduce-cdss-alert-fatigue-clinical-decision-support/)
- [Drug–drug interaction CDS evaluation & override rates (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8864797/)
- [Learning from disagreement: clinician overrides as implicit preference signals (arXiv)](https://arxiv.org/pdf/2604.28010)
- [Supabase for Healthcare](https://supabase.com/solutions/healthcare)
- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RBAC](https://supabase.com/features/role-based-access-control)
