import React, { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalData } from '../../context/DataContext';
import { predictHeartRisk } from '../../services/mlService';
import { saveAssessment } from '../../lib/actions';

export default function MLRiskModal({ patientId, isOpen, onClose }) {
  const { showToast } = useAuth();
  const { patients, refresh, actor } = useHospitalData();

  const patient = patients.find((p) => p.id === patientId) ?? null;

  // Must be memoised: `?? {}` would mint a new object on every render, which
  // feeds into `params` -> the scoring effect -> setState -> render, and the
  // model would be called in a loop.
  const stored = useMemo(
    () => patient?.mlHeartRisk?.parameters ?? {},
    [patient]
  );

  // Adjustable features. The rest of the vector comes from the stored record
  // so a clinician is tuning the patient's real values, not a blank template.
  const [age, setAge] = useState(stored.age ?? 48);
  const [trestbps, setTrestbps] = useState(stored.trestbps ?? 130);
  const [chol, setChol] = useState(stored.chol ?? 220);
  const [oldpeak, setOldpeak] = useState(stored.oldpeak ?? 1.0);
  const [cp, setCp] = useState(stored.cp ?? 0);
  const [exang, setExang] = useState(stored.exang ?? 0);

  const [result, setResult] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);

  const params = useMemo(() => ({
    ...stored,
    age: Number(age),
    trestbps: Number(trestbps),
    chol: Number(chol),
    oldpeak: Number(oldpeak),
    cp: Number(cp),
    exang: Number(exang),
  }), [stored, age, trestbps, chol, oldpeak, cp, exang]);

  // Debounced so dragging a slider does not fire a request per pixel.
  useEffect(() => {
    if (!isOpen || !patient) return;
    let cancelled = false;
    setScoring(true);
    const t = setTimeout(async () => {
      const r = await predictHeartRisk(params, patient);
      if (!cancelled) { setResult(r); setScoring(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [params, isOpen, patient]);

  if (!isOpen) return null;

  if (!patient) {
    return (
      <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
        <div className="glass-modal" style={{ maxWidth: '440px' }}>
          <div className="modal-body" style={{ textAlign: 'center' }}>
            <h2 className="card-title" style={{ justifyContent: 'center' }}>Patient unavailable</h2>
            <p className="card-subtitle" style={{ marginTop: '0.5rem' }}>
              Cannot assess <strong>{patientId}</strong> — the record is not accessible
              to your role, or is still loading.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn-pill btn-pill-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    const outcome = await saveAssessment({
      patientId: patient.id,
      patientName: patient.name,
      result: {
        riskScore: result.riskScore,
        riskCategory: result.riskCategory,
        modelVersion: result.modelVersion,
        parameters: params,
        keyFactors: result.keyFactors.map((f) => f.label),
      },
      actor,
    });
    setSaving(false);
    if (!outcome.ok) {
      showToast(`Could not save assessment: ${outcome.error}`);
      return;
    }
    showToast(`Assessment saved to ${patient.name}'s record`);
    refresh();
    onClose();
  };

  const score = result?.riskScore ?? 0;
  const color = result?.hexColor ?? 'var(--slate-400)';
  const usingRealModel = result?.source === 'model';

  return (
    <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
      <div className="glass-modal">
        <div style={{
          padding: '1.25rem 2rem',
          background: 'linear-gradient(135deg, var(--navy-900), var(--navy-800))',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity style={{ width: '22px', height: '22px' }} />
            Heart Risk Assessment — {patient.name}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="ml-modal-grid">
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1rem' }}>
                Clinical Feature Parameters
              </h3>

              <div className="form-group">
                <label className="form-label">Patient Age: <strong>{age}</strong> yrs</label>
                <input type="range" min="18" max="90" value={age} onChange={(e) => setAge(e.target.value)} style={{ width: '100%', accentColor: 'var(--teal-600)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Resting Blood Pressure: <strong>{trestbps}</strong> mmHg</label>
                <input type="range" min="90" max="200" value={trestbps} onChange={(e) => setTrestbps(e.target.value)} style={{ width: '100%', accentColor: 'var(--teal-600)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Serum Cholesterol: <strong>{chol}</strong> mg/dL</label>
                <input type="range" min="120" max="400" value={chol} onChange={(e) => setChol(e.target.value)} style={{ width: '100%', accentColor: 'var(--teal-600)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">ST Depression (Oldpeak): <strong>{oldpeak}</strong> mm</label>
                <input type="range" min="0" max="6" step="0.1" value={oldpeak} onChange={(e) => setOldpeak(e.target.value)} style={{ width: '100%', accentColor: 'var(--teal-600)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Chest Pain Type</label>
                <select className="form-select" value={cp} onChange={(e) => setCp(e.target.value)}>
                  <option value="0">Typical angina</option>
                  <option value="1">Atypical angina</option>
                  <option value="2">Non-anginal pain</option>
                  <option value="3">Asymptomatic</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Exercise-Induced Angina</label>
                <select className="form-select" value={exang} onChange={(e) => setExang(e.target.value)}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>
            </div>

            <div className="risk-gauge-container">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
                {scoring ? 'Scoring…' : 'Model Risk Estimate'}
              </h3>

              <div className="risk-circle-wrapper">
                <svg className="risk-circle-svg" viewBox="0 0 160 160">
                  <circle className="risk-circle-bg" cx="80" cy="80" r="70"></circle>
                  <circle
                    className="risk-circle-fill"
                    cx="80" cy="80" r="70"
                    style={{ stroke: color, strokeDashoffset: 440 - (440 * score) / 100 }}
                  ></circle>
                </svg>
                <div className="risk-value-text">
                  <span className="risk-percentage" style={{ color }}>{score}%</span>
                  <span className="risk-level-tag" style={{ color }}>{result?.riskCategory ?? '—'}</span>
                </div>
              </div>

              {/* Which model produced this number. Never leave it ambiguous. */}
              <div className={`model-source ${usingRealModel ? 'model-source-live' : 'model-source-fallback'}`}>
                {usingRealModel ? (
                  <>
                    <strong>Trained model</strong> · {result.modelVersion}
                    <div style={{ marginTop: '0.2rem' }}>
                      Logistic regression, UCI Cleveland. Probability {(result.probability * 100).toFixed(1)}%.
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Fallback scorer</strong> · rule-based
                    <div style={{ marginTop: '0.2rem' }}>
                      {result?.unavailableReason ?? 'Model service unavailable.'}
                    </div>
                  </>
                )}
              </div>

              <div className="risk-drivers">
                <strong>
                  {usingRealModel ? 'Contribution to this prediction' : 'Primary risk drivers'}
                </strong>
                <ul>
                  {(result?.keyFactors ?? []).map((f, i) => (
                    <li key={i}>
                      {f.label}
                      {f.contribution != null && (
                        <span className={f.contribution > 0 ? 'contrib-up' : 'contrib-down'}>
                          {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(2)}
                        </span>
                      )}
                    </li>
                  ))}
                  {!result?.keyFactors?.length && <li>No dominant factors identified.</li>}
                </ul>
                {usingRealModel && (
                  <div className="risk-drivers-note">
                    Exact log-odds contributions for this patient — they sum, with the
                    model intercept, to {result.decisionLogOdds?.toFixed(2)}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-pill btn-pill-secondary" onClick={onClose}>Close</button>
          <button
            className="btn-pill btn-pill-teal"
            onClick={handleSave}
            disabled={!result || scoring || saving}
          >
            {saving ? 'Saving…' : 'Save Assessment to EMR'}
          </button>
        </div>
      </div>
    </div>
  );
}
