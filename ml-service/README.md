# Wellora — Heart Disease Risk Service

An explainable heart-disease risk model trained on the UCI Heart Disease dataset (Cleveland subset) and served over FastAPI. Built as the ML differentiator for the Wellora hospital management system.

**This is a demonstrative model. It is not clinically validated and must not be used for patient care.** The limitations section below is written to be read, not skipped — most of it is what you will be asked about in a viva.

---

## Project structure

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py            FastAPI app — /health, /model-info, /predict
│   ├── schemas.py         Pydantic request/response models + validation
│   └── predictor.py       model loading, inference, per-prediction explanation
├── data/
│   └── processed.cleveland.data    cached UCI download (303 records)
├── models/
│   ├── heart_risk_model.joblib     fitted sklearn Pipeline
│   └── model_metadata.json         feature schema + pinned library versions
├── reports/
│   ├── metrics.json                full evaluation, both models
│   └── metrics.md                  readable summary + coefficient table
├── tests/
│   └── test_api.py                 14 contract tests
├── train.py               training pipeline
├── requirements.txt       exact pins (see "Version pinning")
├── runtime.txt            python-3.11.9
├── render.yaml            Render blueprint
└── Makefile
```

## Quickstart

```bash
make install     # venv + pinned deps
make train       # downloads data if absent, trains, writes models/ and reports/
make test        # 14 tests
make serve       # http://localhost:8000/docs
```

Interactive API docs at `/docs` once running.

---

## The model

Two models are trained and evaluated; **logistic regression is served by default**.

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | 5-fold CV ROC-AUC |
|---|---|---|---|---|---|---|
| **Logistic regression** (served) | 0.869 | 0.812 | **0.929** | 0.867 | **0.960** | 0.907 ± 0.019 |
| Random forest (depth 4) | 0.885 | 0.839 | 0.929 | 0.881 | 0.951 | 0.898 ± 0.026 |

Confusion matrix, logistic regression, 61-record test set:

|  | Predicted no disease | Predicted disease |
|---|---|---|
| **Actual no disease** | 27 | 6 |
| **Actual disease** | 2 | 26 |

### Why logistic regression, when the forest scores higher on accuracy

The random forest wins accuracy by 1.6 points — which on a 61-record test set is **exactly one patient**, well inside the noise. Logistic regression wins on ROC-AUC and cross-validated AUC, and both models have identical recall.

The deciding factor is explainability. For a linear model a single prediction decomposes *exactly*:

```
log_odds = intercept + Σ (coefficient_j × scaled_value_j)
```

Every term is that feature's literal contribution to the decision **for that patient**. A tree ensemble has no such decomposition — explaining one prediction needs a post-hoc approximation (SHAP, treeinterpreter) that is itself a model of the model, and is much harder to defend under questioning.

`predictor.py` asserts this at startup: it scores a probe input, sums the reported contributions plus the intercept, and raises if that does not reconstruct the model's own log-odds to within 1e-6. If preprocessing ever drifts out of sync with the explanation, the service refuses to start rather than serving plausible-looking but wrong attributions. `test_contributions_reconstruct_the_decision` covers the same guarantee.

### Recall was the metric to optimise

For a screening tool the expensive error is a false negative — telling a clinician a patient is fine when they are not. Recall is 0.929: 2 false negatives against 6 false positives. That trade is deliberate and defensible; the reverse would not be.

---

## API

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"age":67,"sex":1,"cp":4,"trestbps":160,"chol":286,"fbs":0,
       "restecg":2,"thalach":108,"exang":1,"oldpeak":1.5,
       "slope":2,"ca":3,"thal":3}'
```

```json
{
  "prediction": 1,
  "prediction_label": "Heart disease predicted",
  "probability": 0.9971,
  "risk_score": 100,
  "risk_band": "High",
  "top_contributing_factors": [
    { "feature": "ca",     "label": "Major vessels coloured by fluoroscopy",
      "value": 3.0, "contribution": 3.0481, "direction": "increases_risk" },
    { "feature": "sex",    "label": "Sex (male)",
      "value": 1.0, "contribution": 1.1987, "direction": "increases_risk" },
    { "feature": "thal_3.0", "label": "Thalassemia scan: normal",
      "value": 3.0, "contribution": -0.8194, "direction": "decreases_risk" }
  ],
  "decision_log_odds": 5.8434,
  "intercept": -0.5487,
  "explanation_method": "exact_log_odds",
  "model_version": "logistic_regression@2026-08-14",
  "disclaimer": "Demonstrative model ... not clinically validated."
}
```

`top_contributing_factors` is **specific to this patient**, not a model-wide importance ranking. Note the third entry: a normal thalassemia scan is reported as actively *reducing* this patient's risk. That is the kind of statement a clinician can check against their own judgement.

### `GET /health`

Returns liveness plus an explicit `version_match` flag comparing the runtime scikit-learn against the version the model was pickled with. Used as Render's health check path.

### `GET /model-info`

Training provenance, dataset size, and evaluation metrics — the numbers to cite in a report.

---

## Version pinning

`requirements.txt` pins exact versions (`==`, never `>=`). This is not fussiness:

> **A scikit-learn version that differs from the one the model was pickled with will unpickle without raising and then predict differently.**

That is the failure mode you hit before. Three defences are in place:

1. Exact pins in `requirements.txt`, matching the versions recorded in `models/model_metadata.json`.
2. `runtime.txt` and `render.yaml` pin Python 3.11.9 — numpy 1.26.4 has no wheels for 3.13.
3. `/health` reports `version_match`, and `test_health_reports_loaded_model` fails the suite on a mismatch.

**If you bump any pinned version, re-run `python train.py` and redeploy the model and the code together.**

> Note on numpy: 2.0.2 emits spurious `invalid value`/`divide by zero` warnings from `matmul` on macOS builds linked against Accelerate. Retraining under 1.26.4 produced byte-identical metrics, so the warnings were cosmetic — but 1.26.4 is pinned to keep training output clean and reproducible.

## Deploying to Render

The model artefact (8 KB) is committed, so no training happens at build time — builds stay fast and the deployed model is exactly the one you evaluated.

1. Push the repo to GitHub.
2. Render → **New → Blueprint** → select the repo. `render.yaml` sets `rootDir: ml-service`, the build and start commands, and `/health` as the health check.
3. Set `ALLOWED_ORIGINS` to your deployed Wellora frontend URL.
4. Put the resulting service URL in the frontend's `VITE_ML_API_URL`.

On Render's free tier the service sleeps after inactivity; the first request after a sleep takes ~30 s. Worth knowing before a live demo — hit `/health` a minute beforehand.

---

## Connecting the Wellora frontend

The React app calls this service through `src/services/mlService.js`. Point it at the service with one environment variable in the app's `.env.local`:

```
VITE_ML_API_URL=http://localhost:8000        # local
VITE_ML_API_URL=https://wellora-ml.onrender.com   # deployed
```

Restart Vite after changing it — env is read at startup.

**Behaviour when the service is unreachable.** `mlService.js` falls back to the local rule-based scorer rather than showing an error where a risk score should be, but the modal then displays an amber *"Fallback scorer · rule-based"* badge with the reason, and shows no contribution numbers. Silently substituting the weaker model for the real one would be the dishonest option, and on Render's free tier — where the first request after a sleep can take ~30 s — it would happen regularly.

The modal also converts encodings automatically (see below) and takes `sex` from the patient record rather than assuming male, which the earlier prototype did.

## ⚠️ Feature encoding — read before wiring the frontend

The API uses the **raw UCI encoding**. Many Kaggle mirrors silently re-encode the categoricals, and **Wellora's current `src/data/mockData.js` uses the Kaggle-style codes**. Sending those to this API produces confident nonsense, because the values are valid integers that mean different things.

| Field | This API (UCI) | Kaggle-style | Mapping needed |
|---|---|---|---|
| `cp` | 1–4 (1 = typical angina … 4 = asymptomatic) | 0–3 | `cp_uci = cp_kaggle + 1` |
| `slope` | 1–3 (1 = upsloping, 2 = flat, 3 = downsloping) | 0–2 | `slope_uci = slope_kaggle + 1` |
| `thal` | 3 = normal, 6 = fixed defect, 7 = reversible | 0–3 | `{1:3, 2:6, 3:7}` |
| `restecg`, `ca`, `sex`, `fbs`, `exang` | same in both | same | none |

Pydantic rejects out-of-range codes (`cp=0` and `thal=2` both 422), which catches the obvious cases — but it **cannot** catch a Kaggle `cp=2` that is a valid UCI `cp=2` meaning something else. Convert explicitly at the boundary; do not rely on validation to save you.

---

## Limitations

Written for the viva question "how well would this generalise?" The honest answer is: not very, and here is precisely why.

**Dataset size.** 303 records total, of which the held-out test set is **61**. One additional misclassification moves accuracy by ~1.6 percentage points, so all reported metrics carry wide confidence intervals. Treat the third decimal place as noise. This is why 5-fold cross-validated AUC (0.907 ± 0.019) is reported alongside the single-split figure (0.960) — the gap between them is itself informative about how much the single split flatters the model.

**Population and vintage.** Collected at the Cleveland Clinic Foundation in **1988**. These were patients *referred for coronary angiography* — an already-symptomatic, already-worked-up population, not a general one. Disease prevalence in the sample is **45.9%**, far above any community screening population. A model trained at that prevalence will substantially over-predict risk if applied to unselected patients. Diagnostic criteria, imaging technology, and population risk factors have all moved considerably since 1988.

**Sex imbalance.** The cohort is **68% male** (206 male, 97 female), and disease prevalence differs sharply by sex within it (55.3% male vs 25.8% female). The model has correspondingly less evidence about female patients, and `sex` carries the single largest positive coefficient (+1.20). No fairness or subgroup-calibration audit has been performed. This is a real limitation, not a formality.

**Label simplification.** The source `num` column is 0–4 (severity of vessel narrowing). It is collapsed to binary presence/absence, which is the standard formulation for this dataset but discards severity information the original researchers recorded.

**The features are not cheap.** `ca` (major vessels via fluoroscopy) and `thal` (thallium stress scan) require invasive or specialised procedures — and they are the two strongest predictors. A patient who has these results has already been through substantial cardiac workup. **This is therefore not a screening tool for undifferentiated patients**; it is a risk-stratification aid for patients already in a diagnostic pathway. Anyone presenting it as early detection has misunderstood it.

**Missing data.** 6 values are missing (4 in `ca`, 2 in `thal`), imputed with median/mode inside the pipeline so imputation is fitted on training data only and never leaks across the split. With so few missing values the strategy barely matters here, but the pipeline structure is what would keep it correct at scale.

**A counterintuitive coefficient.** `age` has a small *negative* coefficient (−0.10), which looks wrong — risk should rise with age. It is a textbook multicollinearity artefact: age correlates with `thalach` (max heart rate falls with age) and `ca`, both of which are in the model, so age's *independent* contribution after conditioning on them flips sign. It does not mean being older is protective. This is a good thing to raise before an examiner raises it, and a concrete argument for reporting coefficients rather than hiding them.

**No calibration analysis.** Reported probabilities have not been checked against observed frequencies (no reliability curve, no Brier score). A probability of 0.80 should not be read as "80 of 100 such patients have disease."

**Not a medical device.** No regulatory assessment, no prospective validation, no external test set. Educational and demonstration use only.

## Data source

Detrano, R., et al. (1989). *International application of a new probability algorithm for the diagnosis of coronary artery disease.* American Journal of Cardiology, 64(5), 304–310.

UCI Machine Learning Repository — Heart Disease Data Set: <https://archive.ics.uci.edu/dataset/45/heart+disease>
Principal investigator (Cleveland): Robert Detrano, MD, PhD, V.A. Medical Center, Long Beach and Cleveland Clinic Foundation.
