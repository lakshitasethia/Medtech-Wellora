"""Request/response schemas for the Wellora heart-risk API.

IMPORTANT — feature encoding.
These fields use the *raw UCI Cleveland* encoding, which is what the model
was trained on. Many Kaggle mirrors of this dataset silently re-encode the
categoricals (cp as 0-3, slope as 0-2, thal as 0-3). Sending Kaggle-style
codes to this API will produce confident nonsense, because the values are
valid integers but mean different things. The validators below reject
out-of-range codes, but they cannot detect a 0-3 `cp` masquerading as a
valid 1-4 value, so the mapping is documented on every field.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """The 13 clinical features the model consumes (the 14th column is the label)."""

    age: int = Field(..., ge=1, le=120, description="Age in years.")

    sex: Literal[0, 1] = Field(
        ..., description="Biological sex as recorded in the dataset. 0 = female, 1 = male."
    )

    cp: Literal[1, 2, 3, 4] = Field(
        ...,
        description=(
            "Chest pain type (UCI encoding). "
            "1 = typical angina, 2 = atypical angina, "
            "3 = non-anginal pain, 4 = asymptomatic."
        ),
    )

    trestbps: float = Field(
        ..., ge=50, le=260,
        description="Resting systolic blood pressure on admission, mm Hg.",
    )

    chol: float = Field(
        ..., ge=80, le=700, description="Serum cholesterol, mg/dl."
    )

    fbs: Literal[0, 1] = Field(
        ..., description="Fasting blood sugar > 120 mg/dl. 0 = no, 1 = yes."
    )

    restecg: Literal[0, 1, 2] = Field(
        ...,
        description=(
            "Resting electrocardiographic result. "
            "0 = normal, 1 = ST-T wave abnormality, "
            "2 = probable/definite left ventricular hypertrophy."
        ),
    )

    thalach: float = Field(
        ..., ge=50, le=250, description="Maximum heart rate achieved, bpm."
    )

    exang: Literal[0, 1] = Field(
        ..., description="Exercise-induced angina. 0 = no, 1 = yes."
    )

    oldpeak: float = Field(
        ..., ge=0.0, le=10.0,
        description="ST depression induced by exercise relative to rest, mm.",
    )

    slope: Literal[1, 2, 3] = Field(
        ...,
        description=(
            "Slope of the peak exercise ST segment (UCI encoding). "
            "1 = upsloping, 2 = flat, 3 = downsloping."
        ),
    )

    ca: Literal[0, 1, 2, 3] = Field(
        ..., description="Number of major vessels coloured by fluoroscopy (0-3)."
    )

    thal: Literal[3, 6, 7] = Field(
        ...,
        description=(
            "Thalassemia stress-scan result (UCI encoding). "
            "3 = normal, 6 = fixed defect, 7 = reversible defect."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "age": 63, "sex": 1, "cp": 1, "trestbps": 145, "chol": 233,
                    "fbs": 1, "restecg": 2, "thalach": 150, "exang": 0,
                    "oldpeak": 2.3, "slope": 3, "ca": 0, "thal": 6,
                }
            ]
        }
    }


class Contribution(BaseModel):
    """One feature's signed contribution to this specific prediction."""

    feature: str = Field(..., description="Internal feature name.")
    label: str = Field(..., description="Human-readable clinical label.")
    value: Optional[float] = Field(
        None, description="The patient's value for this feature, as submitted."
    )
    contribution: float = Field(
        ...,
        description=(
            "Signed contribution to the log-odds of disease. "
            "Positive raises predicted risk, negative lowers it."
        ),
    )
    direction: Literal["increases_risk", "decreases_risk"] = Field(
        ..., description="Sign of the contribution, spelled out."
    )


class PredictionResponse(BaseModel):
    prediction: Literal[0, 1] = Field(
        ..., description="0 = heart disease not predicted, 1 = predicted."
    )
    prediction_label: str = Field(
        ..., description="Readable form of `prediction`."
    )
    probability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Model probability of heart disease being present.",
    )
    risk_score: int = Field(
        ..., ge=0, le=100, description="Probability expressed as a 0-100 score."
    )
    risk_band: Literal["Low", "Moderate", "High"] = Field(
        ...,
        description=(
            "Banding for UI display. Low < 40, Moderate 40-69, High >= 70. "
            "These thresholds are a presentation choice, not a clinical standard."
        ),
    )
    top_contributing_factors: List[Contribution] = Field(
        ...,
        description=(
            "Features ranked by absolute contribution to THIS prediction. "
            "For logistic regression these are exact: they sum, with the "
            "intercept, to the model's log-odds."
        ),
    )
    decision_log_odds: float = Field(
        ..., description="Raw log-odds output of the model for this input."
    )
    intercept: Optional[float] = Field(
        None, description="Model intercept (baseline log-odds)."
    )
    explanation_method: str = Field(
        ...,
        description=(
            "How the contributions were derived. 'exact_log_odds' for linear "
            "models; 'global_importance_fallback' for tree models, where "
            "per-prediction attribution is approximate."
        ),
    )
    model_version: str = Field(..., description="Served model identifier.")
    disclaimer: str = Field(..., description="Scope-of-use warning.")


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    model_loaded: bool
    model_version: Optional[str] = None
    scikit_learn_runtime: str
    scikit_learn_trained_with: Optional[str] = None
    version_match: Optional[bool] = Field(
        None,
        description=(
            "False when the runtime scikit-learn differs from the version the "
            "model was pickled with — the usual cause of silent prediction drift."
        ),
    )
