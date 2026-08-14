"""Model loading, inference, and per-prediction explanation.

The explanation is the point of this module. For a logistic regression
inside an sklearn Pipeline, a single prediction decomposes exactly:

    log_odds = intercept + sum_j ( coef_j * x_transformed_j )

so each term is that feature's literal contribution to the decision for
*this* patient — not a model-wide importance average. `explain()` returns
those terms, and `_assert_decomposition()` checks at load time that they
actually reconstruct the model's own output, so a preprocessing change
can never silently desynchronise the explanation from the prediction.
"""

from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd
import sklearn

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "heart_risk_model.joblib"
METADATA_PATH = ROOT / "models" / "model_metadata.json"

DISCLAIMER = (
    "Demonstrative model trained on 303 records from the 1988 UCI Cleveland "
    "cohort. Not clinically validated and not a medical device. For "
    "educational and demonstration use only — do not use for patient care."
)

# Raw feature values are echoed back in the explanation so a clinician can
# see which of their inputs drove the score.
RAW_FEATURE_OF = {
    "age": "age", "trestbps": "trestbps", "chol": "chol",
    "thalach": "thalach", "oldpeak": "oldpeak", "ca": "ca",
    "sex": "sex", "fbs": "fbs", "exang": "exang",
}


class HeartRiskPredictor:
    """Wraps the fitted pipeline and exposes predict + explain."""

    def __init__(self) -> None:
        self.pipeline = None
        self.metadata: Dict[str, Any] = {}
        self.feature_names: List[str] = []
        self.labels: Dict[str, str] = {}
        self.load_error: Optional[str] = None

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def load(self) -> None:
        if not MODEL_PATH.exists():
            self.load_error = (
                f"No model at {MODEL_PATH}. Run `python train.py` before starting the API."
            )
            logger.error(self.load_error)
            return

        try:
            self.pipeline = joblib.load(MODEL_PATH)
        except Exception as exc:  # noqa: BLE001 - surfaced via /health
            self.load_error = f"Failed to unpickle model: {exc}"
            logger.exception("Model load failed")
            return

        if METADATA_PATH.exists():
            self.metadata = json.loads(METADATA_PATH.read_text())
            self.labels = self.metadata.get("feature_labels", {})

        self.feature_names = [
            name.split("__", 1)[-1]
            for name in self.pipeline.named_steps["prep"].get_feature_names_out()
        ]

        trained_with = self.trained_sklearn_version
        if trained_with and trained_with != sklearn.__version__:
            # Not fatal, but the single most common cause of a model that
            # loads fine and then predicts differently in production.
            logger.warning(
                "scikit-learn mismatch: model pickled with %s, runtime has %s. "
                "Pin the version in requirements.txt and retrain.",
                trained_with, sklearn.__version__,
            )

        self._assert_decomposition()
        logger.info("Loaded %s model", self.model_version)

    def _assert_decomposition(self) -> None:
        """Confirm the explanation reconstructs the model's own log-odds.

        Runs once at startup on a fixed probe input. If preprocessing and
        the explanation ever drift apart, this fails loudly here rather
        than producing plausible-looking but wrong attributions.
        """
        if not self.is_linear:
            return
        probe = {
            "age": 63, "sex": 1, "cp": 1, "trestbps": 145.0, "chol": 233.0,
            "fbs": 1, "restecg": 2, "thalach": 150.0, "exang": 0,
            "oldpeak": 2.3, "slope": 3, "ca": 0, "thal": 6,
        }
        result = self.predict(probe)
        rebuilt = result["intercept"] + sum(
            c["contribution"] for c in result["all_contributions"]
        )
        if not math.isclose(rebuilt, result["decision_log_odds"], abs_tol=1e-6):
            raise RuntimeError(
                "Explanation does not reconstruct the model decision "
                f"({rebuilt} vs {result['decision_log_odds']}). "
                "Preprocessing and explanation are out of sync."
            )

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------
    @property
    def is_loaded(self) -> bool:
        return self.pipeline is not None

    @property
    def is_linear(self) -> bool:
        return self.is_loaded and hasattr(self.pipeline.named_steps["clf"], "coef_")

    @property
    def model_version(self) -> str:
        served = self.metadata.get("served_model", "unknown")
        trained = self.metadata.get("trained_at", "")
        return f"{served}@{trained[:10]}" if trained else served

    @property
    def trained_sklearn_version(self) -> Optional[str]:
        return self.metadata.get("library_versions", {}).get("scikit_learn")

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError(self.load_error or "Model not loaded.")

        order = self.metadata.get("raw_feature_order") or list(features.keys())
        frame = pd.DataFrame([{k: features[k] for k in order}])

        proba = float(self.pipeline.predict_proba(frame)[0][1])
        prediction = int(self.pipeline.predict(frame)[0])

        prep = self.pipeline.named_steps["prep"]
        clf = self.pipeline.named_steps["clf"]
        transformed = prep.transform(frame)[0]

        if self.is_linear:
            coefs = clf.coef_[0]
            intercept = float(clf.intercept_[0])
            contributions = [
                self._contribution(name, coefs[i] * transformed[i], features)
                for i, name in enumerate(self.feature_names)
                # A zero term is an inactive one-hot level — it says nothing
                # about this patient, so it is not reported as a factor.
                if abs(coefs[i] * transformed[i]) > 1e-9
            ]
            log_odds = intercept + sum(c["contribution"] for c in contributions)
            method = "exact_log_odds"
        else:
            # Tree ensemble: no exact linear decomposition. Weight global
            # importances by whether the feature is active for this input,
            # and label the method honestly so the caller knows it is
            # approximate.
            importances = clf.feature_importances_
            contributions = [
                self._contribution(
                    name,
                    float(importances[i] * transformed[i]),
                    features,
                )
                for i, name in enumerate(self.feature_names)
                if abs(importances[i] * transformed[i]) > 1e-9
            ]
            intercept = None
            log_odds = math.log(proba / (1 - proba)) if 0 < proba < 1 else 0.0
            method = "global_importance_fallback"

        contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)

        return {
            "prediction": prediction,
            "probability": proba,
            "decision_log_odds": log_odds,
            "intercept": intercept,
            "all_contributions": contributions,
            "explanation_method": method,
        }

    def _contribution(
        self, name: str, value: float, raw: Dict[str, Any]
    ) -> Dict[str, Any]:
        raw_key = RAW_FEATURE_OF.get(name)
        # One-hot columns look like "cp_4.0"; recover the source field.
        if raw_key is None and "_" in name:
            candidate = name.rsplit("_", 1)[0]
            if candidate in raw:
                raw_key = candidate
        return {
            "feature": name,
            "label": self.labels.get(name, name),
            "value": float(raw[raw_key]) if raw_key in raw else None,
            "contribution": round(float(value), 4),
            "direction": "increases_risk" if value > 0 else "decreases_risk",
        }


predictor = HeartRiskPredictor()


def band_for(probability: float) -> str:
    """Map probability to the UI's three-band scale."""
    score = probability * 100
    if score >= 70:
        return "High"
    if score >= 40:
        return "Moderate"
    return "Low"
