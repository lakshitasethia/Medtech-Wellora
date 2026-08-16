import React, { useState } from 'react';
import { useHospitalData } from '../../context/DataContext';
import PatientTimeline from './PatientTimeline';
import { FileText, AlertTriangle, Activity, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnifiedEMRModal({ patientId, isOpen, onClose, onOpenML }) {
  const { showToast } = useAuth();
  // Hooks stay above the early return: this component is permanently mounted
  // by AppShell and only toggles `isOpen`, so a conditional hook would change
  // the hook count between renders.
  const { patients } = useHospitalData();
  const [emrTab, setEmrTab] = useState('record');

  if (!isOpen) return null;

  const patient = patients.find((p) => p.id === patientId) ?? null;

  // The record may legitimately be unavailable: still loading, or hidden from
  // this role by row-level security. Say so rather than falling back to some
  // other patient's chart, which would be a confidentiality bug.
  if (!patient) {
    return (
      <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
        <div className="glass-modal" style={{ maxWidth: '460px' }}>
          <div className="modal-body" style={{ textAlign: 'center' }}>
            <h2 className="card-title" style={{ justifyContent: 'center' }}>Record unavailable</h2>
            <p className="card-subtitle" style={{ marginTop: '0.5rem' }}>
              No record for <strong>{patientId}</strong> is accessible to your role,
              or it is still loading.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn-pill btn-pill-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

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
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText style={{ width: '22px', height: '22px' }} />
            Single Source of Truth EMR: {patient.name} ({patient.id})
          </h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Patient Overview Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--slate-200)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)' }}>{patient.name}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--teal-700)', fontWeight: 600, marginTop: '0.2rem' }}>
                Age: {patient.age} Yrs | Gender: {patient.gender} | Blood Type: {patient.bloodType}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                Emergency: {patient.emergencyContact}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span className={`badge ${patient.triagePriority === 'Critical' ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '0.4rem 0.8rem' }}>
                Triage: {patient.triagePriority}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                Assigned: {patient.assignedDoctor}
              </span>
            </div>
          </div>

          {/* Record / Timeline switch. Both views read the same underlying
              record — one shows current state, the other how it got there. */}
          <div className="sub-nav-tabs" style={{ marginBottom: '1.25rem' }}>
            <button
              className={`sub-nav-tab-btn ${emrTab === 'record' ? 'active' : ''}`}
              onClick={() => setEmrTab('record')}
            >
              Clinical Record
            </button>
            <button
              className={`sub-nav-tab-btn ${emrTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setEmrTab('timeline')}
            >
              Care Timeline
            </button>
          </div>

          {emrTab === 'timeline' && <PatientTimeline patient={patient} />}

          {/* EMR Grid */}
          {emrTab === 'record' && (
          <div className="emr-grid">
            {/* Column 1: Vitals & Allergies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.1rem', background: 'rgba(255,255,255,0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#E11D48' }} />
                  Allergies & Medical Alerts
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {patient.allergies.map(a => (
                    <span key={a} className="badge badge-danger">⚠️ {a}</span>
                  ))}
                  {patient.chronicConditions.map(c => (
                    <span key={c} className="badge badge-warning">● {c}</span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1.1rem', background: 'rgba(255,255,255,0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity style={{ width: '16px', height: '16px', color: 'var(--teal-600)' }} />
                  Vitals Timeline Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {patient.vitalsHistory.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(241,245,249,0.7)', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{v.time}</span>
                      <span>BP: <strong>{v.bp}</strong> | HR: <strong>{v.hr}</strong> | SpO2: <strong>{v.spo2}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Diagnostic Labs & ML Risk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.1rem', background: 'rgba(255,255,255,0.8)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.9)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText style={{ width: '16px', height: '16px', color: 'var(--teal-600)' }} />
                  Diagnostic Reports
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {patient.labResults.map((lab, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(241,245,249,0.7)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{lab.test}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{lab.date}</div>
                      </div>
                      <span className={`badge ${lab.status === 'Flagged' ? 'badge-danger' : 'badge-success'}`}>{lab.result}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1.1rem', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(13,148,136,0.15))', borderRadius: '14px', border: '1px solid rgba(6,182,212,0.3)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Heart style={{ width: '16px', height: '16px', color: '#E11D48' }} />
                  ML Heart Disease Risk Score
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: patient.mlHeartRisk.riskScore > 70 ? '#E11D48' : '#059669' }}>
                      {patient.mlHeartRisk.riskScore}% Risk
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal-700)' }}>
                      {patient.mlHeartRisk.riskCategory}
                    </div>
                  </div>
                  <button className="btn-pill btn-pill-primary" onClick={() => { onClose(); onOpenML(patient.id); }}>
                    Run ML Predictor
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-pill btn-pill-secondary" onClick={onClose}>Close</button>
          <button className="btn-pill btn-pill-teal" onClick={() => showToast('Exported Single Source EMR PDF')}>Export EMR PDF</button>
        </div>
      </div>
    </div>
  );
}
