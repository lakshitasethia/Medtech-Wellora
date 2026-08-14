import React, { useState } from 'react';
import { User, Calendar, Pill, FileText, Heart, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { computePatientMetrics } from '../../utils/metrics';
import { useHospitalData } from '../../context/DataContext';
import { DataSection, EmptyState } from '../common/States';

export default function PatientDashboard({ onOpenEMR }) {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const data = useHospitalData();
  const { patients, loading, error, refresh } = data;

  // In live mode RLS returns exactly one row here — the signed-in patient's
  // own record. There is no client-side filtering to get this wrong.
  const patient = patients[0] ?? null;
  const metrics = computePatientMetrics(patient, data);

  const riskScore = metrics.riskScore ?? 0;
  const riskColor =
    riskScore >= 75 ? 'var(--risk-high)'
    : riskScore >= 45 ? 'var(--risk-moderate)'
    : 'var(--risk-low)';

  // Everything below dereferences `patient`, so the whole portal is gated on
  // it. A patient with no linked record is a real configuration case — the
  // account exists but `patients.portal_user_id` was never set — and the
  // message names the fix rather than rendering a blank page.
  if (loading || error || !patient) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <DataSection
          loading={loading}
          error={error}
          isEmpty={!patient}
          onRetry={refresh}
          skeletonRows={5}
          empty={
            <EmptyState
              title="No medical record linked to this account"
              message="Your login is not yet attached to a patient record. Ask the hospital administrator to link it."
            />
          }
        >
          {null}
        </DataSection>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Role Banner Header */}
      <div className="dashboard-header-banner">
        <div className="header-banner-text">
          <span className="role-badge-pill" style={{ color: '#FDA4AF' }}>Personal Health Portal</span>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <User style={{ width: '28px', height: '28px' }} />
            Welcome back, {patient.name}
          </h1>
          <p>Your Unified Electronic Medical Record (EMR) & Cardiac Health Hub</p>
        </div>
      </div>

      {/* Progressive Disclosure Sub-Nav Tabs */}
      <div className="sub-nav-tabs">
        <button className={`sub-nav-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          EMR History Summary
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
          Active Prescriptions ({metrics.activeMedCount})
        </button>
        <button className={`sub-nav-tab-btn ${activeTab === 'cardiac' ? 'active' : ''}`} onClick={() => setActiveTab('cardiac')}>
          ML Cardiac Risk Assessment
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Next Appointment</span>
            <span className="metric-value">{metrics.nextAppointmentTime}</span>
            <span className="metric-trend up">● {patient.assignedDoctor}</span>
          </div>
          <div className="metric-icon-box"><Calendar style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Active Prescriptions</span>
            <span className="metric-value">{metrics.activeMedCount} Active Meds</span>
            <span className="metric-trend up">✓ Prescribed by your care team</span>
          </div>
          <div className="metric-icon-box"><Pill style={{ width: '24px', height: '24px' }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Recent Lab Results</span>
            <span className="metric-value">{metrics.flaggedLabs} Flagged</span>
            <span className="metric-trend down">⚡ of {metrics.totalLabs} results — discuss with your doctor</span>
          </div>
          <div className="metric-icon-box" style={{ color: 'var(--risk-moderate)' }}><Activity style={{ width: '24px', height: '24px' }} /></div>
        </div>
      </div>

      {/* Tab 1: EMR Summary */}
      {activeTab === 'summary' && (
        <div className="glass-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title"><FileText style={{ width: '20px', height: '20px' }} /> Your Medical Record Overview</h2>
              <p className="card-subtitle">Unified single source record accessible to authorized personnel</p>
            </div>
            <button className="btn-pill btn-pill-teal" onClick={() => onOpenEMR(patient.id)}>
              View Full Unified EMR
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Active Allergies & Conditions</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                {patient.allergies.map(a => <span key={a} className="badge badge-danger">Allergy: {a}</span>)}
                {patient.chronicConditions.map(c => <span key={c} className="badge badge-warning">{c}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="glass-card" style={{ maxWidth: '650px' }}>
          <h2 className="card-title"><Pill style={{ width: '20px', height: '20px' }} /> Prescription Schedule</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            {patient.prescriptions.map((rx, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{rx.drug} {rx.dose}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{rx.freq} | {rx.duration}</div>
                </div>
                <button className="btn-pill btn-pill-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }} onClick={() => showToast('Refill Request Sent to Pharmacy')}>
                  Request Refill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Heart Health */}
      {activeTab === 'cardiac' && (
        <div className="glass-card" style={{ maxWidth: '550px' }}>
          <h2 className="card-title">
            <Heart style={{ width: '20px', height: '20px', color: 'var(--risk-high)' }} /> Your Cardiac Assessment
          </h2>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>
            Calculated by your care team on {patient.labResults?.[0]?.date ?? 'your last visit'}.
            This is a screening indicator, not a diagnosis.
          </p>

          <div className="risk-gauge-container">
            <div className="risk-circle-wrapper">
              <svg className="risk-circle-svg" viewBox="0 0 160 160">
                <circle className="risk-circle-bg" cx="80" cy="80" r="70"></circle>
                <circle
                  className="risk-circle-fill"
                  cx="80"
                  cy="80"
                  r="70"
                  style={{ stroke: riskColor, strokeDashoffset: 440 - (440 * riskScore) / 100 }}
                ></circle>
              </svg>
              <div className="risk-value-text">
                <span className="risk-percentage" style={{ color: riskColor }}>{riskScore}%</span>
                <span className="risk-level-tag" style={{ color: riskColor }}>{metrics.riskCategory}</span>
              </div>
            </div>

            <div style={{
              width: '100%',
              textAlign: 'left',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: 'var(--slate-700)',
              background: 'rgba(255,255,255,0.75)',
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem'
            }}>
              <strong style={{ color: 'var(--navy-900)', display: 'block', marginBottom: '0.35rem' }}>
                What this means
              </strong>
              This score estimates cardiac risk from your recorded vitals and lab results.
              A raised score is a prompt for a conversation with {patient.assignedDoctor} —
              it does not mean a heart attack is imminent. Bring any new chest pain,
              breathlessness, or dizziness to your care team straight away.
            </div>

            <button
              className="btn-pill btn-pill-primary"
              style={{ width: '100%' }}
              onClick={() => showToast(`Message sent to ${patient.assignedDoctor}'s team`)}
            >
              Ask my doctor about this result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
