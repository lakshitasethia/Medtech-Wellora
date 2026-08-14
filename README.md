# Wellora — Unified Hospital Management System

A role-based hospital management system built on a **Single Source of Truth EMR** architecture: one unified patient record that every role reads, rather than fragmented per-department copies.

React + Vite frontend · Supabase (Postgres, Auth, Realtime, Row Level Security) · FastAPI heart-disease risk model.

> **Demonstrative project.** The ML model is trained on a real public dataset but is not clinically validated, and the patient data is synthetic. See [Limitations](#limitations).

---

## What it does

Five roles, each with its own guarded area and its own view of the same underlying records:

| Role | Can do |
|---|---|
| **Admin** | Staff directory, hospital-wide metrics, capacity and permissions overview |
| **Doctor** | Patient queue with latest vitals, SOAP consultation notes, e-prescribing with allergy checking, cardiac risk assessment |
| **Nurse** | Ward bed map with status management, vitals recording, medication administration round |
| **Receptionist** | Appointment booking and check-in, new patient registration |
| **Patient** | Own record only — appointments, prescriptions, lab results, cardiac assessment with clinical context |

Access is enforced by **Postgres Row Level Security**, not by the client. The UI guards mirror those policies for usability, but the database is the boundary: a receptionist querying `lab_results` gets zero rows regardless of what the frontend does.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  React (Vite)   │────▶│  Supabase        │     │  FastAPI ML svc    │
│  role-routed UI │     │  Postgres + RLS  │     │  logistic regr.    │
│                 │     │  Auth + Realtime │     │  UCI Cleveland     │
└────────┬────────┘     └──────────────────┘     └─────────┬──────────┘
         │                                                  │
         └──────────────── POST /predict ───────────────────┘
```

**Key design decision:** `src/lib/repository.js` is the single boundary between the database and the UI. It maps every table into one shape, so dashboards and metrics never touch Supabase directly — which is what let the app run identically against live data or a bundled offline dataset.

**Every mutation appends to `clinical_events`**, an append-only timeline with no UPDATE or DELETE policy for any role. That is what makes "single source of truth" a structural property rather than a slogan.

## Project structure

```
.
├── src/
│   ├── components/         # per-role dashboards + shared UI
│   │   ├── admin/  doctor/  nurse/  receptionist/  patient/
│   │   ├── common/         # AppShell, Navbar, Toast, loading/error/empty states
│   │   ├── emr/            # unified EMR modal
│   │   ├── landing/        # public hero page
│   │   └── ml/             # heart risk modal
│   ├── context/            # AuthContext (dual-mode), DataContext (+ realtime)
│   ├── lib/                # supabase client, repository, write actions, formatters
│   ├── routes/             # router + route guards
│   ├── services/           # ML API client (incl. feature-encoding conversion)
│   ├── pages/              # login, unauthorized, 404
│   ├── data/               # offline dataset (also the schema specification)
│   ├── utils/              # derived metrics, local fallback scorer
│   └── styles/             # tokens, base, landing, components
├── supabase/
│   ├── schema.sql          # tables, enums, indexes, realtime publication
│   ├── rls.sql             # RLS policies + negative-test suite
│   ├── seed.sql            # generated from src/data/mockData.js
│   ├── profiles.sql        # links auth users to roles
│   └── SETUP.md            # step-by-step database setup
├── ml-service/             # FastAPI heart-risk service (own README)
└── plan.md                 # phased implementation plan + progress log
```

## Getting started

### 1. Frontend

```bash
npm install
cp .env.example .env.local     # then fill in your values
npm run dev
```

Runs at `http://localhost:5173`.

**Offline demo mode.** With `VITE_USE_MOCK=true` (or no credentials configured) the app runs entirely off `src/data/mockData.js` — no database, no network. Useful when presenting on unreliable wifi. The navbar shows a **Demo data** / **Live data** pill so the source is never ambiguous.

### 2. Database

Follow [`supabase/SETUP.md`](supabase/SETUP.md). In short:

1. Run `schema.sql`, then `rls.sql`, then `seed.sql` — **in that order**
2. Create one auth user per role, insert matching `profiles` rows (`profiles.sql`)
3. Set `VITE_USE_MOCK=false` and restart

> ⚠️ Run `rls.sql` **before** putting real data in. The publishable key is safe in a client bundle *only* because RLS is enabled — without it, that key is an unrestricted read/write handle on every table.

### 3. ML service

```bash
cd ml-service
make install
make train      # downloads UCI Cleveland, trains, writes models/ + reports/
make serve      # http://localhost:8000/docs
```

Then set `VITE_ML_API_URL` in `.env.local`. See [`ml-service/README.md`](ml-service/README.md) for the model card, metrics, and deployment.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable/anon key — safe client-side **only with RLS enabled** |
| `VITE_ML_API_URL` | Base URL of the FastAPI service; blank falls back to the local scorer |
| `VITE_USE_MOCK` | `true` = offline dataset, `false` = live Supabase |

## The ML model

Logistic regression on the UCI Heart Disease dataset (Cleveland subset, 303 records):

| Metric | Value |
|---|---|
| Accuracy | 0.869 |
| Precision | 0.812 |
| Recall | **0.929** |
| F1 | 0.867 |
| ROC-AUC | **0.960** |
| 5-fold CV ROC-AUC | 0.907 ± 0.019 |

Logistic regression is served in preference to a higher-accuracy random forest because a linear model's prediction decomposes *exactly*: each feature's contribution is `coefficient × scaled_value`, and those terms sum with the intercept to the model's own log-odds. The service asserts this at startup and refuses to run if the explanation stops reconstructing the prediction.

Recall was the metric to optimise — for a screening tool, a false negative costs more than a false positive.

## Testing

```bash
npm run lint                       # frontend
cd ml-service && make test         # 14 API + explainability tests
```

## Limitations

- **Patient data is synthetic.** Names, notes, and vitals are fabricated for demonstration.
- **The model is not clinically validated.** 303 records from a 1988 single-centre cohort of patients already referred for angiography — disease prevalence 45.9%, far above any screening population. 68% male. Full model card in [`ml-service/README.md`](ml-service/README.md).
- **Not a medical device.** No regulatory assessment, no prospective validation.

## Licence

MIT — see [LICENSE](LICENSE).
