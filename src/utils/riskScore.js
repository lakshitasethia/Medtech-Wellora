/**
 * Composite deterioration score.
 *
 * WHY THIS EXISTS
 * Documented override rates for EHR clinical-decision-support alerts run
 * 49–96%: clinicians dismiss them because they interrupt. Wellora's design
 * hypothesis is that **ranking beats interrupting** — risk is expressed as
 * the order of the worklist rather than as a modal that must be dismissed.
 *
 * For that to be trustworthy the ranking cannot be a black box, so every
 * score returns the factors that produced it, each with its own points and a
 * plain-English reason. `explain()` output is rendered directly in the UI.
 *
 * WHY NOT JUST USE THE ML SCORE
 * The heart-risk model answers one narrow question — likelihood of coronary
 * disease from a fixed 13-feature vector — and it does so from whatever
 * values were recorded at assessment time. It says nothing about whether the
 * patient is deteriorating *right now*. A stable 70% is less urgent than a
 * 55% whose blood pressure has climbed 25 points and whose SpO₂ is falling.
 * The trend and acuity components below capture that; the model cannot.
 *
 * WEIGHTS ARE A DESIGN CHOICE, NOT A CLINICAL STANDARD.
 * They are not derived from outcome data and have not been validated. They
 * encode a defensible ordering of concerns for a demonstration system.
 */

const WEIGHTS = {
  mlRisk: 45,      // strongest single signal, but a snapshot
  vitalsTrend: 25, // direction of travel — what the model cannot see
  flaggedLabs: 15, // objective abnormal findings
  triage: 15,      // clinician's own acuity judgement
};

export const MAX_SCORE = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 100

/* ------------------------------------------------------------------ */
/* Parsing helpers — vitals are stored as display strings              */
/* ------------------------------------------------------------------ */

function systolic(bp) {
  const m = /^\s*(\d{2,3})\s*\//.exec(bp ?? '');
  return m ? Number(m[1]) : null;
}

function numeric(value) {
  if (value == null) return null;
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** vitalsHistory is newest-first. */
function readings(patient) {
  return (patient?.vitalsHistory ?? []).map((v) => ({
    sys: systolic(v.bp),
    hr: numeric(v.hr),
    spo2: numeric(v.spo2),
    rr: numeric(v.rr),
  }));
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function mlComponent(patient) {
  const score = patient?.mlHeartRisk?.riskScore;
  if (!score) {
    return { points: 0, factors: [] };
  }
  const points = (score / 100) * WEIGHTS.mlRisk;
  return {
    points,
    factors: [{
      key: 'ml',
      label: 'Cardiac risk model',
      points,
      detail: `Model scored ${score}% (${patient.mlHeartRisk.riskCategory})`,
    }],
  };
}

/**
 * Direction-aware vitals assessment.
 *
 * Two distinct things earn points: how bad the current observation is, and
 * which way it is moving. A patient sitting at a stable abnormal value is a
 * different problem from one deteriorating towards it, and the trend half is
 * the part a static risk score misses entirely.
 */
function vitalsComponent(patient) {
  const obs = readings(patient);
  if (!obs.length) {
    return {
      points: 0,
      factors: [{
        key: 'vitals-none',
        label: 'No observations',
        points: 0,
        detail: 'No vitals recorded — this patient may be under-monitored',
      }],
    };
  }

  const [latest, ...rest] = obs;
  const factors = [];
  let raw = 0;

  const add = (key, label, pts, detail) => {
    raw += pts;
    factors.push({ key, label, points: pts, detail });
  };

  // --- absolute severity of the most recent reading ---
  if (latest.spo2 != null && latest.spo2 < 92) {
    add('spo2-low', 'Hypoxaemia', 8, `SpO₂ ${latest.spo2}% (below 92%)`);
  }
  if (latest.sys != null && latest.sys >= 180) {
    add('bp-severe', 'Severe hypertension', 8, `Systolic ${latest.sys} mmHg`);
  } else if (latest.sys != null && latest.sys <= 90) {
    add('bp-low', 'Hypotension', 8, `Systolic ${latest.sys} mmHg`);
  }
  if (latest.hr != null && latest.hr > 120) {
    add('hr-high', 'Tachycardia', 6, `Heart rate ${latest.hr} bpm`);
  }
  if (latest.rr != null && latest.rr >= 24) {
    add('rr-high', 'Tachypnoea', 5, `Respiratory rate ${latest.rr}/min`);
  }

  // --- direction of travel, latest vs the mean of prior readings ---
  if (rest.length) {
    const meanOf = (key) => {
      const vals = rest.map((o) => o[key]).filter((v) => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const priorSys = meanOf('sys');
    if (priorSys != null && latest.sys != null) {
      const delta = latest.sys - priorSys;
      if (delta >= 20) add('bp-rising', 'Blood pressure climbing', 10, `Systolic up ${Math.round(delta)} mmHg on recent readings`);
      else if (delta >= 10) add('bp-rising', 'Blood pressure rising', 6, `Systolic up ${Math.round(delta)} mmHg on recent readings`);
    }

    const priorHr = meanOf('hr');
    if (priorHr != null && latest.hr != null) {
      const delta = latest.hr - priorHr;
      if (delta >= 20) add('hr-rising', 'Heart rate climbing', 8, `Up ${Math.round(delta)} bpm on recent readings`);
      else if (delta >= 10) add('hr-rising', 'Heart rate rising', 5, `Up ${Math.round(delta)} bpm on recent readings`);
    }

    const priorSpo2 = meanOf('spo2');
    if (priorSpo2 != null && latest.spo2 != null) {
      const delta = priorSpo2 - latest.spo2; // positive means falling
      if (delta >= 4) add('spo2-falling', 'Oxygen saturation falling', 10, `Down ${delta.toFixed(0)} points on recent readings`);
      else if (delta >= 2) add('spo2-falling', 'Oxygen saturation drifting down', 6, `Down ${delta.toFixed(0)} points on recent readings`);
    }
  }

  // Cap, then scale so the component can never exceed its weight.
  const points = Math.min(raw, WEIGHTS.vitalsTrend);
  return { points, factors, capped: raw > WEIGHTS.vitalsTrend };
}

function labsComponent(patient) {
  const flagged = (patient?.labResults ?? []).filter((l) => l.status === 'Flagged');
  if (!flagged.length) return { points: 0, factors: [] };
  const points = Math.min(flagged.length, 3) * 5;
  return {
    points,
    factors: [{
      key: 'labs',
      label: 'Abnormal results',
      points,
      detail: `${flagged.length} flagged: ${flagged.slice(0, 2).map((l) => l.test).join(', ')}${flagged.length > 2 ? '…' : ''}`,
    }],
  };
}

const TRIAGE_POINTS = { Critical: 15, Urgent: 8, Routine: 0 };

function triageComponent(patient) {
  const points = TRIAGE_POINTS[patient?.triagePriority] ?? 0;
  if (!points) return { points: 0, factors: [] };
  return {
    points,
    factors: [{
      key: 'triage',
      label: 'Triage priority',
      points,
      detail: `Assessed as ${patient.triagePriority} at intake`,
    }],
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function bandFor(score) {
  if (score >= 65) return 'critical';
  if (score >= 40) return 'elevated';
  return 'stable';
}

export const BAND_LABEL = {
  critical: 'Needs review',
  elevated: 'Watch',
  stable: 'Stable',
};

/**
 * Score one patient.
 * @returns {{score:number, band:string, factors:Array, breakdown:Object}}
 */
export function computeCompositeRisk(patient) {
  const ml = mlComponent(patient);
  const vitals = vitalsComponent(patient);
  const labs = labsComponent(patient);
  const triage = triageComponent(patient);

  const total = ml.points + vitals.points + labs.points + triage.points;
  const score = Math.round(Math.min(total, MAX_SCORE));

  const factors = [...ml.factors, ...vitals.factors, ...labs.factors, ...triage.factors]
    .filter((f) => f.points > 0 || f.key === 'vitals-none')
    .sort((a, b) => b.points - a.points)
    .map((f) => ({ ...f, points: Math.round(f.points * 10) / 10 }));

  return {
    score,
    band: bandFor(score),
    factors,
    breakdown: {
      model: Math.round(ml.points * 10) / 10,
      vitals: Math.round(vitals.points * 10) / 10,
      labs: labs.points,
      triage: triage.points,
    },
    vitalsCapped: Boolean(vitals.capped),
  };
}

/**
 * Rank a cohort, highest concern first.
 *
 * Ties break on triage then name, so the order is stable between renders —
 * a list that reshuffles on every refresh is unusable, and worse, it makes
 * genuine movement invisible.
 */
export function rankByRisk(patients) {
  return patients
    .map((p) => ({ patient: p, risk: computeCompositeRisk(p) }))
    .sort((a, b) => {
      if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
      const t = (TRIAGE_POINTS[b.patient.triagePriority] ?? 0) - (TRIAGE_POINTS[a.patient.triagePriority] ?? 0);
      if (t !== 0) return t;
      return a.patient.name.localeCompare(b.patient.name);
    });
}
