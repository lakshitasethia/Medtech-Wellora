# Wellora heart-risk model — evaluation report

Generated: 2026-08-14T05:46:25+00:00
Dataset: UCI Heart Disease, Cleveland subset (303 records)
Split: 80/20 stratified, random_state=42
**Model served by the API: `logistic_regression`**

## Held-out test performance

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | CV ROC-AUC |
|---|---|---|---|---|---|---|
| logistic_regression | 0.869 | 0.812 | 0.929 | 0.867 | 0.960 | 0.907 ± 0.019 |
| random_forest | 0.885 | 0.839 | 0.929 | 0.881 | 0.951 | 0.898 ± 0.026 |

### logistic_regression — confusion matrix

| | Predicted no disease | Predicted disease |
|---|---|---|
| **Actual no disease** | 27 | 6 |
| **Actual disease** | 2 | 26 |

### random_forest — confusion matrix

| | Predicted no disease | Predicted disease |
|---|---|---|
| **Actual no disease** | 28 | 5 |
| **Actual disease** | 2 | 26 |

## Logistic regression coefficients (log-odds)

Positive values push the prediction toward disease; negative values push away from it. Numeric features are standardised, so a coefficient is the log-odds change per standard deviation.

| Feature | Coefficient |
|---|---|
| Sex (male) | +1.1987 |
| Major vessels coloured by fluoroscopy | +1.1220 |
| Thalassemia scan: normal | -0.8194 |
| Chest pain: asymptomatic | +0.8145 |
| Chest pain: typical angina | -0.7567 |
| Peak exercise ST slope: upsloping | -0.6757 |
| Chest pain: non-anginal pain | -0.6226 |
| Thalassemia scan: reversible defect | +0.6179 |
| Exercise-induced angina | +0.5259 |
| Resting ECG: normal | -0.4229 |
| Peak exercise ST slope: flat | +0.3814 |
| Maximum heart rate achieved | -0.3560 |
| Thalassemia scan: fixed defect | -0.3472 |
| Resting blood pressure | +0.3282 |
| Peak exercise ST slope: downsloping | -0.2545 |
| Fasting blood sugar > 120 mg/dl | -0.2214 |
| ST depression (exercise vs rest) | +0.2062 |
| Serum cholesterol | +0.1722 |
| Age | -0.1042 |
| Resting ECG: ST-T wave abnormality | -0.1011 |
| Resting ECG: left ventricular hypertrophy | -0.0248 |
| Chest pain: atypical angina | +0.0161 |

## Random forest — top 10 feature importances

| Feature | Importance |
|---|---|
| Thalassemia scan: normal | 0.1641 |
| Chest pain: asymptomatic | 0.1298 |
| Thalassemia scan: reversible defect | 0.1128 |
| Major vessels coloured by fluoroscopy | 0.1091 |
| ST depression (exercise vs rest) | 0.0881 |
| Maximum heart rate achieved | 0.0752 |
| Exercise-induced angina | 0.0625 |
| Age | 0.0452 |
| Peak exercise ST slope: upsloping | 0.0365 |
| Sex (male) | 0.0338 |

## Limitations

See README.md. In short: 303 records from one 1988 cohort, binary simplification of a 0-4 severity label, and no external validation. Demonstrative only — not clinically validated.
