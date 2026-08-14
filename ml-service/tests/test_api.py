"""Contract tests for the Wellora heart-risk API.

Run:  pytest -q

The explanation tests matter most: they assert that the reported factors
actually reconstruct the model's decision. If preprocessing changes and
the explanation silently stops matching, these fail.
"""

import math

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.predictor import predictor

# A textbook high-risk presentation from the Cleveland cohort.
HIGH_RISK = {
    "age": 67, "sex": 1, "cp": 4, "trestbps": 160, "chol": 286, "fbs": 0,
    "restecg": 2, "thalach": 108, "exang": 1, "oldpeak": 1.5,
    "slope": 2, "ca": 3, "thal": 3,
}

# Young, asymptomatic, normal scan.
LOW_RISK = {
    "age": 29, "sex": 0, "cp": 3, "trestbps": 118, "chol": 175, "fbs": 0,
    "restecg": 0, "thalach": 172, "exang": 0, "oldpeak": 0.0,
    "slope": 1, "ca": 0, "thal": 3,
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_reports_loaded_model(client):
    body = client.get("/health").json()
    assert body["model_loaded"] is True
    assert body["status"] == "ok"
    # A version mismatch is the classic silent-drift bug; fail the suite on it.
    assert body["version_match"] is True, (
        "scikit-learn runtime differs from the version the model was trained "
        "with. Retrain, or pin the version in requirements.txt."
    )


def test_model_info_exposes_provenance(client):
    body = client.get("/model-info").json()
    assert body["n_records"] == 303
    assert "Cleveland" in body["dataset"]
    assert body["test_metrics"]["logistic_regression"]["roc_auc"] > 0.85


def test_high_risk_scores_above_low_risk(client):
    high = client.post("/predict", json=HIGH_RISK).json()
    low = client.post("/predict", json=LOW_RISK).json()
    assert high["risk_score"] > low["risk_score"]
    assert high["prediction"] == 1
    assert low["prediction"] == 0
    assert high["risk_band"] == "High"
    assert low["risk_band"] == "Low"


def test_probability_matches_reported_log_odds(client):
    body = client.post("/predict", json=HIGH_RISK).json()
    recovered = 1 / (1 + math.exp(-body["decision_log_odds"]))
    assert recovered == pytest.approx(body["probability"], abs=1e-3)


def test_contributions_reconstruct_the_decision():
    """The headline explainability guarantee: contributions are exact."""
    result = predictor.predict(HIGH_RISK)
    rebuilt = result["intercept"] + sum(
        c["contribution"] for c in result["all_contributions"]
    )
    assert rebuilt == pytest.approx(result["decision_log_odds"], abs=1e-6)
    assert result["explanation_method"] == "exact_log_odds"


def test_factors_are_sorted_by_absolute_influence(client):
    factors = client.post("/predict", json=HIGH_RISK).json()["top_contributing_factors"]
    magnitudes = [abs(f["contribution"]) for f in factors]
    assert magnitudes == sorted(magnitudes, reverse=True)
    assert all(
        f["direction"] == ("increases_risk" if f["contribution"] > 0 else "decreases_risk")
        for f in factors
    )


@pytest.mark.parametrize(
    "field,value",
    [
        ("cp", 0),        # valid in the Kaggle re-encoding, invalid in UCI
        ("thal", 2),      # ditto
        ("slope", 0),     # ditto
        ("trestbps", 400),
        ("age", -5),
        ("ca", 9),
    ],
)
def test_rejects_out_of_range_values(client, field, value):
    payload = dict(LOW_RISK)
    payload[field] = value
    assert client.post("/predict", json=payload).status_code == 422


def test_rejects_missing_field(client):
    payload = dict(LOW_RISK)
    del payload["age"]
    assert client.post("/predict", json=payload).status_code == 422


def test_response_carries_disclaimer(client):
    body = client.post("/predict", json=LOW_RISK).json()
    assert "not clinically validated" in body["disclaimer"].lower()
