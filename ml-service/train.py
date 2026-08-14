"""
Wellora — heart disease risk model training pipeline.

Trains and evaluates two deliberately-explainable classifiers on the UCI
Heart Disease dataset (Cleveland subset) and serialises the chosen model
for the FastAPI service in app/.

Design decision: explainability is prioritised over raw accuracy.
Logistic regression is served by default because its per-prediction
explanation is *exact* — each feature's contribution to the log-odds is
coefficient x scaled_value, and those contributions sum, with the
intercept, to the model's actual decision value. A shallow random forest
is trained alongside it for comparison and reported in the metrics file,
but tree ensembles need post-hoc approximations (SHAP/treeinterpreter)
to explain a single prediction, which is harder to defend under
questioning.

Run:
    python train.py
    python train.py --model random_forest   # serve the RF instead

Outputs:
    models/heart_risk_model.joblib   fitted sklearn Pipeline
    models/model_metadata.json       feature schema + library versions
    reports/metrics.json             full evaluation for both models
    reports/metrics.md               human-readable summary
"""

from __future__ import annotations

import argparse
import json
import platform
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42
TEST_SIZE = 0.20

ROOT = Path(__file__).parent
DATA_PATH = ROOT / "data" / "processed.cleveland.data"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"

UCI_URL = (
    "https://archive.ics.uci.edu/ml/machine-learning-databases"
    "/heart-disease/processed.cleveland.data"
)

# The Cleveland file has no header. This is the documented column order.
COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal", "num",
]

# `ca` is a count (0-3 major vessels) and `oldpeak` is continuous, so both
# are treated as numeric. `cp`, `restecg`, `slope` and `thal` are nominal
# codes with no meaningful ordering, so they are one-hot encoded — feeding
# them as integers would imply, for example, that thal=7 is "more" than
# thal=3, which is meaningless.
NUMERIC_FEATURES = ["age", "trestbps", "chol", "thalach", "oldpeak", "ca"]
CATEGORICAL_FEATURES = ["cp", "restecg", "slope", "thal"]
BINARY_FEATURES = ["sex", "fbs", "exang"]
FEATURE_ORDER = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES

# Human-readable labels used by the API's explanation payload.
FEATURE_LABELS = {
    "age": "Age",
    "trestbps": "Resting blood pressure",
    "chol": "Serum cholesterol",
    "thalach": "Maximum heart rate achieved",
    "oldpeak": "ST depression (exercise vs rest)",
    "ca": "Major vessels coloured by fluoroscopy",
    "sex": "Sex (male)",
    "fbs": "Fasting blood sugar > 120 mg/dl",
    "exang": "Exercise-induced angina",
    "cp_1.0": "Chest pain: typical angina",
    "cp_2.0": "Chest pain: atypical angina",
    "cp_3.0": "Chest pain: non-anginal pain",
    "cp_4.0": "Chest pain: asymptomatic",
    "restecg_0.0": "Resting ECG: normal",
    "restecg_1.0": "Resting ECG: ST-T wave abnormality",
    "restecg_2.0": "Resting ECG: left ventricular hypertrophy",
    "slope_1.0": "Peak exercise ST slope: upsloping",
    "slope_2.0": "Peak exercise ST slope: flat",
    "slope_3.0": "Peak exercise ST slope: downsloping",
    "thal_3.0": "Thalassemia scan: normal",
    "thal_6.0": "Thalassemia scan: fixed defect",
    "thal_7.0": "Thalassemia scan: reversible defect",
}


def load_dataset() -> pd.DataFrame:
    """Load Cleveland data from the local cache, downloading it if absent."""
    if not DATA_PATH.exists():
        print(f"Cache miss — downloading from {UCI_URL}")
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(UCI_URL, timeout=60) as response:
            DATA_PATH.write_bytes(response.read())

    # The file encodes missing values as a literal "?".
    df = pd.read_csv(DATA_PATH, header=None, names=COLUMNS, na_values="?")

    # `num` is 0-4 (0 = no disease, 1-4 = increasing severity). The standard
    # binary formulation of this dataset is presence-vs-absence of disease.
    # This is a simplification and is documented as a limitation in README.md.
    df["target"] = (df["num"] > 0).astype(int)
    return df.drop(columns=["num"])


def build_preprocessor() -> ColumnTransformer:
    """Impute, scale and encode. Fitted only on training data."""
    numeric = Pipeline([
        # Median rather than mean: `ca` is a small-integer count and the
        # clinical variables are skewed, so the median is more robust.
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    categorical = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    # Binary flags are already 0/1 — passed through untouched so their
    # coefficients read directly as log-odds per unit.
    return ColumnTransformer(
        transformers=[
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL_FEATURES),
            ("bin", SimpleImputer(strategy="most_frequent"), BINARY_FEATURES),
        ],
        remainder="drop",
    )


def build_models() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline([
            ("prep", build_preprocessor()),
            ("clf", LogisticRegression(
                penalty="l2",
                C=1.0,
                solver="liblinear",
                max_iter=1000,
                random_state=RANDOM_STATE,
            )),
        ]),
        "random_forest": Pipeline([
            ("prep", build_preprocessor()),
            ("clf", RandomForestClassifier(
                n_estimators=300,
                max_depth=4,          # shallow, per the explainability brief
                min_samples_leaf=5,
                random_state=RANDOM_STATE,
            )),
        ]),
    }


def evaluate(name, pipeline, X_train, X_test, y_train, y_test) -> dict:
    """Fit, then score on the held-out test set and via cross-validation."""
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_auc = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    fpr, tpr, _ = roc_curve(y_test, y_proba)

    metrics = {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1": round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
        "cv_roc_auc_mean": round(float(cv_auc.mean()), 4),
        "cv_roc_auc_std": round(float(cv_auc.std()), 4),
        "confusion_matrix": {
            "true_negative": int(tn), "false_positive": int(fp),
            "false_negative": int(fn), "true_positive": int(tp),
        },
        "roc_curve": {
            "fpr": [round(float(v), 4) for v in fpr],
            "tpr": [round(float(v), 4) for v in tpr],
        },
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
    }

    feature_names = list(
        pipeline.named_steps["prep"].get_feature_names_out()
    )
    # Strip the ColumnTransformer's "num__"/"cat__"/"bin__" prefixes.
    clean_names = [n.split("__", 1)[-1] for n in feature_names]

    clf = pipeline.named_steps["clf"]
    if hasattr(clf, "coef_"):
        metrics["coefficients"] = {
            clean_names[i]: round(float(c), 4)
            for i, c in enumerate(clf.coef_[0])
        }
        metrics["intercept"] = round(float(clf.intercept_[0]), 4)
    if hasattr(clf, "feature_importances_"):
        metrics["feature_importances"] = {
            clean_names[i]: round(float(v), 4)
            for i, v in enumerate(clf.feature_importances_)
        }

    return metrics, clean_names


def write_markdown_report(results: dict, served: str, n_rows: int) -> None:
    lines = [
        "# Wellora heart-risk model — evaluation report",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"Dataset: UCI Heart Disease, Cleveland subset ({n_rows} records)",
        f"Split: {int((1 - TEST_SIZE) * 100)}/{int(TEST_SIZE * 100)} stratified, "
        f"random_state={RANDOM_STATE}",
        f"**Model served by the API: `{served}`**",
        "",
        "## Held-out test performance",
        "",
        "| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | CV ROC-AUC |",
        "|---|---|---|---|---|---|---|",
    ]
    for name, m in results.items():
        lines.append(
            f"| {name} | {m['accuracy']:.3f} | {m['precision']:.3f} | "
            f"{m['recall']:.3f} | {m['f1']:.3f} | {m['roc_auc']:.3f} | "
            f"{m['cv_roc_auc_mean']:.3f} ± {m['cv_roc_auc_std']:.3f} |"
        )

    for name, m in results.items():
        cm = m["confusion_matrix"]
        lines += [
            "",
            f"### {name} — confusion matrix",
            "",
            "| | Predicted no disease | Predicted disease |",
            "|---|---|---|",
            f"| **Actual no disease** | {cm['true_negative']} | {cm['false_positive']} |",
            f"| **Actual disease** | {cm['false_negative']} | {cm['true_positive']} |",
        ]

    lr = results.get("logistic_regression", {})
    if "coefficients" in lr:
        ranked = sorted(
            lr["coefficients"].items(), key=lambda kv: abs(kv[1]), reverse=True
        )
        lines += [
            "",
            "## Logistic regression coefficients (log-odds)",
            "",
            "Positive values push the prediction toward disease; negative "
            "values push away from it. Numeric features are standardised, so "
            "a coefficient is the log-odds change per standard deviation.",
            "",
            "| Feature | Coefficient |",
            "|---|---|",
        ]
        for feat, coef in ranked:
            lines.append(f"| {FEATURE_LABELS.get(feat, feat)} | {coef:+.4f} |")

    rf = results.get("random_forest", {})
    if "feature_importances" in rf:
        ranked = sorted(
            rf["feature_importances"].items(), key=lambda kv: kv[1], reverse=True
        )[:10]
        lines += [
            "",
            "## Random forest — top 10 feature importances",
            "",
            "| Feature | Importance |",
            "|---|---|",
        ]
        for feat, imp in ranked:
            lines.append(f"| {FEATURE_LABELS.get(feat, feat)} | {imp:.4f} |")

    lines += [
        "",
        "## Limitations",
        "",
        "See README.md. In short: 303 records from one 1988 cohort, "
        "binary simplification of a 0-4 severity label, and no external "
        "validation. Demonstrative only — not clinically validated.",
        "",
    ]
    (REPORT_DIR / "metrics.md").write_text("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Wellora heart-risk model.")
    parser.add_argument(
        "--model",
        choices=["logistic_regression", "random_forest"],
        default="logistic_regression",
        help="Which fitted model to serialise for the API (default: logistic_regression).",
    )
    args = parser.parse_args()

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    df = load_dataset()
    print(f"Loaded {len(df)} records; {df.isna().sum().sum()} missing values.")
    print(f"Class balance — disease: {int(df['target'].sum())}, "
          f"no disease: {int((df['target'] == 0).sum())}")

    X = df[FEATURE_ORDER]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )

    results: dict[str, dict] = {}
    fitted: dict[str, Pipeline] = {}
    feature_names: list[str] = []

    for name, pipeline in build_models().items():
        print(f"\nTraining {name} ...")
        metrics, names = evaluate(name, pipeline, X_train, X_test, y_train, y_test)
        results[name] = metrics
        fitted[name] = pipeline
        feature_names = names
        print(
            f"  accuracy={metrics['accuracy']:.3f}  recall={metrics['recall']:.3f}  "
            f"roc_auc={metrics['roc_auc']:.3f}  cv_auc={metrics['cv_roc_auc_mean']:.3f}"
        )

    served_name = args.model
    served = fitted[served_name]

    joblib.dump(served, MODEL_DIR / "heart_risk_model.joblib")

    metadata = {
        "served_model": served_name,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dataset": "UCI Heart Disease — Cleveland subset",
        "n_records": int(len(df)),
        "random_state": RANDOM_STATE,
        "test_size": TEST_SIZE,
        "raw_feature_order": FEATURE_ORDER,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "binary_features": BINARY_FEATURES,
        "transformed_feature_names": feature_names,
        "feature_labels": FEATURE_LABELS,
        "test_metrics": {
            k: {m: results[k][m] for m in
                ("accuracy", "precision", "recall", "f1", "roc_auc")}
            for k in results
        },
        # Pinned so the API can refuse to serve a model pickled by a
        # different scikit-learn build rather than failing silently.
        "library_versions": {
            "python": platform.python_version(),
            "scikit_learn": sklearn.__version__,
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "joblib": joblib.__version__,
        },
    }
    (MODEL_DIR / "model_metadata.json").write_text(json.dumps(metadata, indent=2))
    (REPORT_DIR / "metrics.json").write_text(json.dumps(results, indent=2))
    write_markdown_report(results, served_name, len(df))

    print(f"\nSaved {served_name} -> models/heart_risk_model.joblib")
    print("Saved models/model_metadata.json, reports/metrics.json, reports/metrics.md")


if __name__ == "__main__":
    main()
