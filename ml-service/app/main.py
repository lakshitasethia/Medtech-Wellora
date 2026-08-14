"""Wellora heart-risk prediction service.

Endpoints
    GET  /health       liveness + model/version status (used by Render)
    GET  /model-info   training metrics, coefficients, dataset provenance
    POST /predict      risk prediction with per-prediction explanation

Start locally:
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import sklearn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.predictor import DISCLAIMER, band_for, predictor
from app.schemas import HealthResponse, PredictionRequest, PredictionResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Number of factors returned per prediction. Enough to explain the score,
# few enough to render in a clinician-facing panel without scrolling.
TOP_N_FACTORS = 6


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load once at startup rather than per request — on Render's free tier
    # a cold unpickle on the first request would blow the response budget.
    predictor.load()
    yield


app = FastAPI(
    title="Wellora Heart Disease Risk API",
    description=(
        "Explainable heart disease risk prediction for the Wellora hospital "
        "management system. Logistic regression trained on the UCI Cleveland "
        "dataset. **Demonstrative only — not clinically validated.**"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# The Wellora React client calls this from the browser. Set ALLOWED_ORIGINS
# to a comma-separated list in production; the default is dev-only.
_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5273",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["ops"])
def health() -> HealthResponse:
    """Liveness probe. Reports the scikit-learn version match explicitly,
    because a mismatch loads cleanly and then predicts differently."""
    trained_with = predictor.trained_sklearn_version
    match = None if trained_with is None else trained_with == sklearn.__version__
    return HealthResponse(
        status="ok" if predictor.is_loaded and match is not False else "degraded",
        model_loaded=predictor.is_loaded,
        model_version=predictor.model_version if predictor.is_loaded else None,
        scikit_learn_runtime=sklearn.__version__,
        scikit_learn_trained_with=trained_with,
        version_match=match,
    )


@app.get("/model-info", tags=["ops"])
def model_info() -> dict:
    """Training provenance and evaluation metrics — the numbers to cite."""
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=predictor.load_error or "Model not loaded.",
        )
    meta = predictor.metadata
    return {
        "served_model": meta.get("served_model"),
        "model_version": predictor.model_version,
        "trained_at": meta.get("trained_at"),
        "dataset": meta.get("dataset"),
        "n_records": meta.get("n_records"),
        "test_metrics": meta.get("test_metrics"),
        "library_versions": meta.get("library_versions"),
        "explanation_method": (
            "exact_log_odds" if predictor.is_linear else "global_importance_fallback"
        ),
        "disclaimer": DISCLAIMER,
    }


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(payload: PredictionRequest) -> PredictionResponse:
    """Score one patient and explain the score.

    `top_contributing_factors` is specific to this input: for the logistic
    regression these are exact log-odds terms that sum, with the intercept,
    to `decision_log_odds`.
    """
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=predictor.load_error or "Model not loaded.",
        )

    try:
        result = predictor.predict(payload.model_dump())
    except Exception as exc:  # noqa: BLE001
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {exc}",
        ) from exc

    probability = result["probability"]
    return PredictionResponse(
        prediction=result["prediction"],
        prediction_label=(
            "Heart disease predicted" if result["prediction"] == 1
            else "Heart disease not predicted"
        ),
        probability=round(probability, 4),
        risk_score=int(round(probability * 100)),
        risk_band=band_for(probability),
        top_contributing_factors=result["all_contributions"][:TOP_N_FACTORS],
        decision_log_odds=round(result["decision_log_odds"], 4),
        intercept=result["intercept"],
        explanation_method=result["explanation_method"],
        model_version=predictor.model_version,
        disclaimer=DISCLAIMER,
    )
