import React, { useEffect, useState } from 'react';
import { Stethoscope, User, Activity, Pill, FileText, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalData } from '../../context/DataContext';
import { computeDoctorMetrics, patientsByAppointment } from '../../utils/metrics';
import { createPrescription, saveConsultationNote } from '../../lib/actions';
import { DataSection, EmptyState } from '../common/States';

export default function DoctorDashboard({ onOpenEMR, onOpenML }) {
  const { showToast } = useAuth();
  const data = useHospitalData();
  const { patients, loading, error, refresh, actor } = data;

  const [activeTab, setActiveTab] = useState('queue');
  const [submitting, setSubmitting] = useState(false);

  const metrics = computeDoctorMetrics(data);
  const queue = patientsByAppointment(data);

  /* --- SOAP note state ------------------------------------------- */
  const [notePatientId, setNotePatientId] = useState('');
  const [soapNote, setSoapNote] = useState({ s: '', o: '', a: '', p: '' });

  /* --- Prescription state ---------------------------------------- */
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxDrug, setRxDrug] = useState('Lisinopril');
  const [rxDose, setRxDose] = useState('20 mg');
  const [rxFreq, setRxFreq] = useState('Once Daily (Morning)');

  // Patient selections are seeded once data arrives, not at mount — at mount
  // the list is still empty and a hardcoded index would break.
  useEffect(() => {
    if (!patients.length) return;
    setNotePatientId((cur) => cur || patients[0].id);
    setRxPatientId((cur) => cur || patients[0].id);
  }, [patients]);

  const notePatient = patients.find((p) => p.id === notePatientId) ?? null;
  const rxPatient = patients.find((p) => p.id === rxPatientId) ?? null;

  // Substring match in both directions so "Aspirin" trips an "Aspirin" allergy
  // and "NSAIDs" trips on a recorded "Ibuprofen, NSAIDs" entry.
  const allergyConflicts = (rxPatient && rxDrug.trim())
    ? rxPatient.allergies.filter((a) => {
        if (a === 'None Known') return false;
        const drug = rxDrug.trim().toLowerCase();
        const allergen = a.toLowerCase();
        return allergen.includes(drug) || drug.includes(allergen.split(' ')[0]);
      })
    : [];

  const duplicateOrder = (rxPatient && rxDrug.trim())
    ? rxPatient.prescriptions.find(
        (rx) => rx.status === 'Active' && rx.drug.toLowerCase() === rxDrug.trim().toLowerCase()
      )
    : null;

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!notePatient) return;
    if (!soapNote.s.trim() && !soapNote.o.trim() && !soapNote.a.trim()) {
      showToast('Add at least one section before saving');
      return;
    }
    setSubmitting(true);
    const result = await saveConsultationNote({
      patientId: notePatient.id,
      patientName: notePatient.name,
      soap: soapNote,
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Could not save note: ${result.error}`);
      return;
    }
    showToast(`Note filed to ${notePatient.name}'s unified EMR`);
    setSoapNote({ s: '', o: '', a: '', p: '' });
    refresh();
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    if (!rxPatient) return;
    if (allergyConflicts.length) {
      showToast(`Blocked: ${rxPatient.name} is allergic to ${allergyConflicts.join(', ')}`);
      return;
    }
    if (!rxDrug.trim()) {
      showToast('Enter a medication name');
      return;
    }
    setSubmitting(true);
    const result = await createPrescription({
      patientId: rxPatient.id,
      patientName: rxPatient.name,
      rx: { drug: rxDrug.trim(), dose: rxDose, freq: rxFreq },
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Could not prescribe: ${result.error}`);
      return;
    }
    showToast(`${rxDrug} dispatched to ${rxPatient.name}'s unified EMR`);
    refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dashboard-header-banner">
        <div className="header-banner-text">
          <span className="role-badge-pill" style={{ color: '#2DD4BF' }}>Attending Physician Workstation</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Stethoscope style={{ width: '28px', height: '28px' }} />
            Doctor Command Center
          </h1>
          <p>Unified EMR Patient History, Diagnostic AI, &amp; Consultation Notes</p>
        </div>
        <div className="header-banner-actions">
          <button
            className="btn-pill btn-pill-primary"
            disabled={!queue.length}
            onClick={() => onOpenML(queue[0]?.id)}
          >
            <Zap style={{ width: '16px', height: '16px' }} /> Run Heart Risk Assessment
          </button>
        </div>
      </div>

      <div className="sub-nav-tabs">
        <button className={`sub-nav-tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
          Today's Queue ({metrics.queueTotal})
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          SOAP Consultation Notes
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
          Prescription Builder
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Today's Patient Queue</span>
            <span className="metric-value">{metrics.queueTotal} Patients</span>
            <span className="metric-trend up">● {metrics.queueTrend}</span>
          </div>
          <div className="metric-icon-box"><User style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">High Ischemia Alerts</span>
            <span className="metric-value" style={{ color: 'var(--risk-high)' }}>{metrics.highRiskCount} Patients</span>
            <span className="metric-trend down">⚡ {metrics.riskThresholdLabel}</span>
          </div>
          <div className="metric-icon-box" style={{ color: 'var(--risk-high)' }}><Activity style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Active Prescriptions</span>
            <span className="metric-value">{metrics.activePrescriptions} Active</span>
            <span className="metric-trend up">✓ {metrics.patientsWithAllergies} patients with recorded allergies</span>
          </div>
          <div className="metric-icon-box"><Pill style={{ width: '24px', height: '24px' }} /></div>
        </div>
      </div>

      {/* Tab 1: Queue */}
      {activeTab === 'queue' && (
        <div className="glass-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title"><User style={{ width: '20px', height: '20px' }} /> Patient Consultation Queue</h2>
              <p className="card-subtitle">Select a patient to inspect the unified EMR or run the risk model</p>
            </div>
          </div>

          <DataSection
            loading={loading}
            error={error}
            isEmpty={!queue.length}
            onRetry={refresh}
            skeletonRows={6}
            empty={<EmptyState title="No patients in your queue" message="Registered patients will appear here once reception books them in." />}
          >
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient Name (ID)</th>
                    <th>Chief Conditions</th>
                    <th>Latest Vitals</th>
                    <th>Triage Priority</th>
                    <th>Cardiac Risk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((p) => {
                    const latest = p.vitalsHistory?.[0];
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.appointmentTime ?? '—'}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {p.id} | {p.age}y {p.gender}
                          </div>
                        </td>
                        <td><span style={{ fontSize: '0.82rem' }}>{p.chronicConditions.join(', ') || '—'}</span></td>
                        <td>
                          {latest ? (
                            <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                              <div>BP {latest.bp} · HR {latest.hr}</div>
                              <div style={{ color: 'var(--slate-500)' }}>{latest.time}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>Not recorded</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.triagePriority === 'Critical' ? 'badge-danger'
                            : p.triagePriority === 'Urgent' ? 'badge-warning'
                            : 'badge-success'
                          }`}>
                            {p.triagePriority}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`badge ${
                              p.mlHeartRisk.riskScore >= 75 ? 'badge-danger'
                              : p.mlHeartRisk.riskScore >= 45 ? 'badge-warning'
                              : 'badge-success'
                            }`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => onOpenML(p.id)}
                          >
                            ⚡ {p.mlHeartRisk.riskScore}% Risk
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn-pill btn-pill-teal"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                            onClick={() => onOpenEMR(p.id)}
                          >
                            Unified EMR
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DataSection>
        </div>
      )}

      {/* Tab 2: SOAP Notes */}
      {activeTab === 'notes' && (
        <div className="glass-card" style={{ maxWidth: '750px' }}>
          <h2 className="card-title"><FileText style={{ width: '20px', height: '20px' }} /> Clinical SOAP Note Writer</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
            Notes are appended to the patient's single source record and the shared timeline.
          </p>

          <form onSubmit={handleSaveNote}>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select
                className="form-select"
                value={notePatientId}
                onChange={(e) => setNotePatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subjective (S)</label>
              <textarea
                className="form-textarea"
                placeholder="Reported symptoms, history, patient's own words…"
                value={soapNote.s}
                onChange={(e) => setSoapNote({ ...soapNote, s: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Objective (O)</label>
              <textarea
                className="form-textarea"
                placeholder="Observations, vitals, examination and investigation findings…"
                value={soapNote.o}
                onChange={(e) => setSoapNote({ ...soapNote, o: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assessment (A)</label>
              <textarea
                className="form-textarea"
                placeholder="Clinical impression, differential…"
                value={soapNote.a}
                onChange={(e) => setSoapNote({ ...soapNote, a: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Plan (P)</label>
              <textarea
                className="form-textarea"
                placeholder="Investigations, treatment, follow-up…"
                value={soapNote.p}
                onChange={(e) => setSoapNote({ ...soapNote, p: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-pill btn-pill-teal" style={{ width: '100%' }} disabled={submitting || !notePatient}>
              {submitting ? 'Saving…' : 'Save Note to Unified EMR'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Prescription Builder */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card" style={{ maxWidth: '650px' }}>
          <h2 className="card-title"><Pill style={{ width: '20px', height: '20px' }} /> E-Prescription Dispatch</h2>

          <form onSubmit={handlePrescribe} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-select" value={rxPatientId} onChange={(e) => setRxPatientId(e.target.value)}>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Medication Name</label>
              <input
                className="form-input"
                value={rxDrug}
                onChange={(e) => setRxDrug(e.target.value)}
                placeholder="e.g. Lisinopril"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dosage</label>
                <input className="form-input" value={rxDose} onChange={(e) => setRxDose(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <input className="form-input" value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} />
              </div>
            </div>

            {/* Real check against the patient's recorded allergies and active orders */}
            {!rxPatient ? null : allergyConflicts.length > 0 ? (
              <div className="rx-check rx-check-danger">
                ⚠ Contraindication: {rxPatient.name} has a recorded allergy to{' '}
                <strong>{allergyConflicts.join(', ')}</strong>. Prescription blocked.
              </div>
            ) : duplicateOrder ? (
              <div className="rx-check rx-check-warning">
                ⚠ Duplicate order: {rxPatient.name} already has an active prescription for{' '}
                <strong>{duplicateOrder.drug}</strong> ({duplicateOrder.dose}, {duplicateOrder.freq}).
              </div>
            ) : (
              <div className="rx-check rx-check-ok">
                ✓ Checked against {rxPatient.allergies.length} recorded{' '}
                {rxPatient.allergies.length === 1 ? 'allergy' : 'allergies'} and{' '}
                {rxPatient.prescriptions.length} active{' '}
                {rxPatient.prescriptions.length === 1 ? 'order' : 'orders'} — no conflict found.
              </div>
            )}

            <button
              type="submit"
              className="btn-pill btn-pill-teal"
              style={{ width: '100%' }}
              disabled={submitting || !rxPatient || allergyConflicts.length > 0}
            >
              {submitting ? 'Dispatching…' : '✒ Sign & Dispatch E-Prescription'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
