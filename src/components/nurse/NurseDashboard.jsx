import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bed, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalData } from '../../context/DataContext';
import { computeNurseMetrics } from '../../utils/metrics';
import { recordVitals, updateBedStatus } from '../../lib/actions';
import { DataSection, EmptyState } from '../common/States';

const BED_ACTIONS = [
  { status: 'available', label: 'Mark available' },
  { status: 'cleaning', label: 'Send for cleaning' },
  { status: 'occupied', label: 'Mark occupied' },
  { status: 'critical', label: 'Flag critical' },
];

export default function NurseDashboard({ onOpenEMR }) {
  const { showToast } = useAuth();
  const data = useHospitalData();
  const { patients, beds, loading, error, refresh, actor } = data;

  const [activeTab, setActiveTab] = useState('beds');
  const [submitting, setSubmitting] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);

  const metrics = computeNurseMetrics(data);

  const [vitalsPatientId, setVitalsPatientId] = useState('');
  const [vitalsForm, setVitalsForm] = useState({
    bp: '', hr: '', spo2: '', temp: '', rr: '',
  });

  useEffect(() => {
    if (patients.length) setVitalsPatientId((cur) => cur || patients[0].id);
  }, [patients]);

  const vitalsPatient = patients.find((p) => p.id === vitalsPatientId) ?? null;

  // Medication round: every active order on a patient who currently holds a bed.
  const marRounds = useMemo(() => {
    const admitted = new Map(
      beds.filter((b) => b.patientId).map((b) => [b.patientId, b])
    );
    return patients
      .filter((p) => admitted.has(p.id))
      .flatMap((p) =>
        p.prescriptions
          .filter((rx) => rx.status === 'Active')
          .map((rx) => ({
            key: `${p.id}-${rx.id ?? rx.drug}`,
            patientName: p.name,
            patientId: p.id,
            bed: admitted.get(p.id)?.bedNumber ?? '—',
            drug: `${rx.drug} ${rx.dose}`,
            freq: rx.freq,
          }))
      );
  }, [patients, beds]);

  const handleVitals = async (e) => {
    e.preventDefault();
    if (!vitalsPatient) return;
    if (!vitalsForm.bp.trim() && !vitalsForm.hr.trim()) {
      showToast('Record at least blood pressure or heart rate');
      return;
    }
    setSubmitting(true);
    const result = await recordVitals({
      patientId: vitalsPatient.id,
      patientName: vitalsPatient.name,
      form: vitalsForm,
      actor,
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(`Could not record vitals: ${result.error}`);
      return;
    }
    showToast(`Vitals recorded for ${vitalsPatient.name}`);
    setVitalsForm({ bp: '', hr: '', spo2: '', temp: '', rr: '' });
    refresh();
  };

  const handleBedChange = async (bed, status) => {
    setSelectedBed(null);
    const result = await updateBedStatus({
      bedId: bed.id, status, patientId: bed.patientId, actor,
    });
    if (!result.ok) {
      showToast(`Could not update bed: ${result.error}`);
      return;
    }
    showToast(`${bed.bedNumber} set to ${status}`);
    refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dashboard-header-banner">
        <div className="header-banner-text">
          <span className="role-badge-pill" style={{ color: '#A5B4FC' }}>Ward &amp; Clinical Care Unit</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity style={{ width: '28px', height: '28px' }} />
            Nurse Station
          </h1>
          <p>Ward bed map, live vitals logging, and medication administration</p>
        </div>
      </div>

      <div className="sub-nav-tabs">
        <button className={`sub-nav-tab-btn ${activeTab === 'beds' ? 'active' : ''}`} onClick={() => setActiveTab('beds')}>
          Ward Bed Map ({metrics.totalBeds})
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'vitals' ? 'active' : ''}`} onClick={() => setActiveTab('vitals')}>
          Log Patient Vitals
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'mar' ? 'active' : ''}`} onClick={() => setActiveTab('mar')}>
          Medication Round ({marRounds.length})
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Ward Bed Occupancy</span>
            <span className="metric-value">{metrics.occupancyLabel}</span>
            <span className="metric-trend up">● {metrics.occupancyRate}% capacity across {metrics.wardCount} wards</span>
          </div>
          <div className="metric-icon-box"><Bed style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Critical Beds</span>
            <span className="metric-value" style={{ color: 'var(--risk-high)' }}>{metrics.critical} Patients</span>
            <span className="metric-trend down">⚡ {metrics.available} available · {metrics.cleaning} cleaning</span>
          </div>
          <div className="metric-icon-box"><Activity style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Doses Due</span>
            <span className="metric-value">{metrics.dosesDue} Dosages</span>
            <span className="metric-trend up">✓ Active orders on admitted patients</span>
          </div>
          <div className="metric-icon-box"><Pill style={{ width: '24px', height: '24px' }} /></div>
        </div>
      </div>

      {/* Tab 1: Bed map */}
      {activeTab === 'beds' && (
        <div className="glass-card">
          <h2 className="card-title"><Bed style={{ width: '20px', height: '20px' }} /> Live Ward &amp; Bed Map</h2>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
            Click a bed to open the patient's unified EMR, or use Manage to change its status.
          </p>

          <DataSection
            loading={loading}
            error={error}
            isEmpty={!beds.length}
            onRetry={refresh}
            skeletonRows={6}
            empty={<EmptyState title="No beds configured" message="Ward beds will appear here once they are added." />}
          >
            <div className="bed-map-grid">
              {beds.map((b) => (
                <div key={b.id} className={`bed-card ${b.status}`}>
                  <div className="bed-number">{b.bedNumber} · {b.ward}</div>
                  <button
                    className="bed-patient-name bed-patient-link"
                    disabled={!b.patientId}
                    onClick={() => b.patientId && onOpenEMR(b.patientId)}
                  >
                    {b.patientName}
                  </button>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{b.condition}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${
                      b.status === 'critical' ? 'badge-danger'
                      : b.status === 'occupied' ? 'badge-info'
                      : b.status === 'cleaning' ? 'badge-warning'
                      : 'badge-success'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {b.status.toUpperCase()}
                    </span>
                    <button
                      className="bed-manage-btn"
                      onClick={() => setSelectedBed(selectedBed === b.id ? null : b.id)}
                    >
                      Manage
                    </button>
                  </div>

                  {selectedBed === b.id && (
                    <div className="bed-actions">
                      {BED_ACTIONS.filter((a) => a.status !== b.status).map((a) => (
                        <button key={a.status} onClick={() => handleBedChange(b, a.status)}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DataSection>
        </div>
      )}

      {/* Tab 2: Vitals */}
      {activeTab === 'vitals' && (
        <div className="glass-card" style={{ maxWidth: '620px' }}>
          <h2 className="card-title"><Activity style={{ width: '20px', height: '20px' }} /> Log Patient Vitals</h2>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            Saved observations appear on the patient's record and every clinician's view immediately.
          </p>

          <form onSubmit={handleVitals}>
            <div className="form-group">
              <label className="form-label">Select Patient</label>
              <select
                className="form-select"
                value={vitalsPatientId}
                onChange={(e) => setVitalsPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.id}) — {p.roomBed}</option>
                ))}
              </select>
            </div>

            {vitalsPatient?.vitalsHistory?.[0] && (
              <div className="last-obs">
                Last recorded {vitalsPatient.vitalsHistory[0].time} — BP {vitalsPatient.vitalsHistory[0].bp},
                HR {vitalsPatient.vitalsHistory[0].hr}, SpO₂ {vitalsPatient.vitalsHistory[0].spo2}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure (mmHg)</label>
                <input
                  className="form-input" placeholder="148/92"
                  value={vitalsForm.bp}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  className="form-input" placeholder="88" inputMode="numeric"
                  value={vitalsForm.hr}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, hr: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">SpO₂ (%)</label>
                <input
                  className="form-input" placeholder="96" inputMode="numeric"
                  value={vitalsForm.spo2}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  className="form-input" placeholder="98.6" inputMode="decimal"
                  value={vitalsForm.temp}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Respiratory Rate</label>
                <input
                  className="form-input" placeholder="18" inputMode="numeric"
                  value={vitalsForm.rr}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, rr: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-pill btn-pill-teal" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting || !vitalsPatient}>
              {submitting ? 'Recording…' : 'Submit Vitals to Unified EMR'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Medication round */}
      {activeTab === 'mar' && (
        <div className="glass-card" style={{ maxWidth: '700px' }}>
          <h2 className="card-title"><Pill style={{ width: '20px', height: '20px' }} /> Medication Administration Round</h2>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            Active orders for every patient currently occupying a bed.
          </p>

          <DataSection
            loading={loading}
            error={error}
            isEmpty={!marRounds.length}
            onRetry={refresh}
            empty={<EmptyState title="No doses due" message="No admitted patient has an active prescription." />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {marRounds.map((dose) => (
                <div key={dose.key} className="mar-row">
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                      {dose.patientName} <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>({dose.bed})</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--teal-700)', marginTop: '0.2rem' }}>{dose.drug}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{dose.freq}</div>
                  </div>
                  <button
                    className="btn-pill btn-pill-teal"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                    onClick={() => showToast(`${dose.drug} administered to ${dose.patientName} and signed`)}
                  >
                    ✓ Administer &amp; Sign
                  </button>
                </div>
              ))}
            </div>
          </DataSection>
        </div>
      )}
    </div>
  );
}
