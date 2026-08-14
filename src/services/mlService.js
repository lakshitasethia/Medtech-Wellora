/**
 * Client for the Wellora heart-risk FastAPI service.
 *
 * Two responsibilities beyond the fetch itself:
 *
 * 1. ENCODING. The service was trained on the raw UCI Cleveland encoding
 *    (cp 1-4, slope 1-3, thal 3/6/7). Wellora's stored feature vectors use
 *    the Kaggle-style re-encoding (cp 0-3, slope 0-2, thal 0-3) that most
 *    mirrors of the dataset ship. Both are valid integers, so nothing would
 *    error if we sent the wrong one — the model would just return confident
 *    nonsense. `toUciFeatures` is the conversion, and it is the single place
 *    that knows about the difference.
 *
 * 2. FALLBACK. If the service is unreachable (not deployed, cold-started,
 *    offline demo), we fall back to the local rule-based scorer rather than
 *    showing an error where a risk score should be — but the result is
 *    tagged `source: 'fallback'` so the UI can say so. Silently substituting
 *    a weaker model for the real one would be the dishonest option.
 */

import { calculateHeartRisk } from '../utils/mlPredictor';

const BASE_URL = (import.meta.env.VITE_ML_API_URL ?? '').replace(/\/$/, '');
const TIMEOUT_MS = 8000;

export const ML_SERVICE_CONFIGURED = Boolean(BASE_URL);

/* ------------------------------------------------------------------ */
/* Encoding conversion                                                 */
/* ------------------------------------------------------------------ */

const clamp = (n, lo, hi) => Math.min(Math.max(Math.round(Number(n) || 0), lo), hi);

/**
 * Kaggle thal codes to UCI: 1 = normal, 2 = fixed defect, 3 = reversible.
 * 0 appears in some mirrors as a missing-value marker; treat it as normal
 * rather than dropping the record.
 */
const THAL_MAP = { 0: 3, 1: 3, 2: 6, 3: 7 };

export function toUciFeatures(p, patient) {
  // Sex comes from the patient record when available — the stored feature
  // vectors are not always populated, and guessing male (as the old modal
  // hardcoded) skews every score for female patients upward.
  const sexFromRecord =
    patient?.gender === 'Male' ? 1 : patient?.gender === 'Female' ? 0 : null;

  return {
    age: clamp(p.age, 1, 120),
    sex: sexFromRecord ?? clamp(p.sex, 0, 1),
    cp: clamp((Number(p.cp) || 0) + 1, 1, 4),
    trestbps: clamp(p.trestbps, 50, 260),
    chol: clamp(p.chol, 80, 700),
    fbs: clamp(p.fbs, 0, 1),
    restecg: clamp(p.restecg, 0, 2),
    thalach: clamp(p.thalach ?? 150, 50, 250),
    exang: clamp(p.exang, 0, 1),
    // oldpeak is the one genuinely continuous feature; do not round it.
    oldpeak: Math.min(Math.max(Number(p.oldpeak) || 0, 0), 10),
    slope: clamp((Number(p.slope) || 0) + 1, 1, 3),
    ca: clamp(p.ca, 0, 3),
    thal: THAL_MAP[clamp(p.thal, 0, 3)] ?? 3,
  };
}

/* ------------------------------------------------------------------ */
/* Prediction                                                          */
/* ------------------------------------------------------------------ */

function colorFor(score) {
  if (score >= 75) return '#E11D48';
  if (score >= 45) return '#D97706';
  return '#059669';
}

/** Shape returned to the UI, identical whichever source produced it. */
function fromLocalScorer(params, reason) {
  const local = calculateHeartRisk(params);
  return {
    riskScore: local.riskScore,
    riskCategory: local.riskCategory,
    hexColor: local.hexColor,
    keyFactors: local.keyFactors.map((f) => ({ label: f, contribution: null })),
    modelVersion: local.modelVersion ?? 'rule-based-v0.1',
    source: 'fallback',
    unavailableReason: reason,
    probability: local.riskScore / 100,
  };
}

export async function predictHeartRisk(params, patient) {
  if (!ML_SERVICE_CONFIGURED) {
    return fromLocalScorer(params, 'VITE_ML_API_URL is not set.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toUciFeatures(params, patient)),
      signal: controller.signal,
    });

    if (!response.ok) {
      // 422 means the payload failed Pydantic validation — almost always an
      // encoding problem, so surface the detail rather than a generic error.
      const detail = await response.json().catch(() => null);
      const message =
        response.status === 422
          ? `Model rejected the feature vector (422). ${JSON.stringify(detail?.detail?.[0]?.msg ?? '')}`
          : `Model service returned ${response.status}.`;
      return fromLocalScorer(params, message);
    }

    const body = await response.json();
    return {
      riskScore: body.risk_score,
      riskCategory: body.risk_band === 'High' ? 'High Ischemic Risk'
        : body.risk_band === 'Moderate' ? 'Moderate Risk'
        : 'Low Risk',
      hexColor: colorFor(body.risk_score),
      probability: body.probability,
      // Per-prediction contributions, not model-wide importances.
      keyFactors: (body.top_contributing_factors ?? []).map((f) => ({
        label: f.label,
        contribution: f.contribution,
        direction: f.direction,
        value: f.value,
      })),
      modelVersion: body.model_version,
      explanationMethod: body.explanation_method,
      decisionLogOdds: body.decision_log_odds,
      disclaimer: body.disclaimer,
      source: 'model',
    };
  } catch (err) {
    const reason = err.name === 'AbortError'
      ? `Model service did not respond within ${TIMEOUT_MS / 1000}s.`
      : `Could not reach model service: ${err.message}`;
    return fromLocalScorer(params, reason);
  } finally {
    clearTimeout(timer);
  }
}

/** Used by the modal to show whether it is talking to the real model. */
export async function checkMlHealth() {
  if (!ML_SERVICE_CONFIGURED) return { ok: false, reason: 'not configured' };
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}
