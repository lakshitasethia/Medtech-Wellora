import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Info, ListOrdered, Clock } from 'lucide-react';
import { BAND_LABEL, MAX_SCORE, rankByRisk } from '../../utils/riskScore';
import { patientsByAppointment } from '../../utils/metrics';
import { DataSection, EmptyState } from '../common/States';

/**
 * Ambient risk ranking.
 *
 * Deliberately non-interruptive: no modal, no toast, no alert to dismiss.
 * Concern is expressed as position in the list and a colour rail, so a
 * deteriorating patient rises into view rather than blocking the screen.
 * When a nurse records worsening vitals elsewhere in the hospital, the
 * realtime subscription refreshes this list and the patient moves up with a
 * movement indicator — peripheral, not demanding.
 */
export default function RiskRankedQueue({ patients, loading, error, onRetry, onOpenEMR, onOpenML }) {
  const [sortMode, setSortMode] = useState('risk');
  const [expanded, setExpanded] = useState(null);

  const ranked = useMemo(() => rankByRisk(patients), [patients]);

  const ordered = useMemo(() => {
    if (sortMode === 'risk') return ranked;
    // Same rows, clinic order — keeps the score visible while showing the
    // schedule a doctor may still need to work through.
    const byTime = patientsByAppointment({ patients });
    const riskById = new Map(ranked.map((r) => [r.patient.id, r.risk]));
    return byTime.map((p) => ({ patient: p, risk: riskById.get(p.id) }));
  }, [ranked, sortMode, patients]);

  // Track previous ranking so movement can be shown when the list re-sorts.
  const prevRank = useRef(new Map());
  const [movement, setMovement] = useState(new Map());

  useEffect(() => {
    if (sortMode !== 'risk') return;
    const next = new Map(ranked.map((r, i) => [r.patient.id, i]));
    const moves = new Map();
    for (const [id, idx] of next) {
      const before = prevRank.current.get(id);
      if (before != null && before !== idx) moves.set(id, before - idx);
    }
    prevRank.current = next;
    if (moves.size) {
      setMovement(moves);
      // Clear after the animation so the indicator marks a change rather
      // than becoming permanent decoration.
      const t = setTimeout(() => setMovement(new Map()), 6000);
      return () => clearTimeout(t);
    }
  }, [ranked, sortMode]);

  return (
    <div className="glass-card">
      <div className="card-header-row">
        <div>
          <h2 className="card-title">
            <ListOrdered style={{ width: '20px', height: '20px' }} /> Patient Worklist
          </h2>
          <p className="card-subtitle">
            {sortMode === 'risk'
              ? 'Ordered by composite deterioration score — the most concerning patient is at the top.'
              : 'Ordered by appointment time.'}
          </p>
        </div>

        <div className="sort-toggle" role="group" aria-label="Sort order">
          <button
            className={sortMode === 'risk' ? 'active' : ''}
            onClick={() => setSortMode('risk')}
          >
            <ListOrdered style={{ width: '14px', height: '14px' }} /> By risk
          </button>
          <button
            className={sortMode === 'time' ? 'active' : ''}
            onClick={() => setSortMode('time')}
          >
            <Clock style={{ width: '14px', height: '14px' }} /> By time
          </button>
        </div>
      </div>

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!ordered.length}
        onRetry={onRetry}
        skeletonRows={6}
        empty={<EmptyState title="No patients in your worklist" />}
      >
        <div className="worklist">
          {ordered.map(({ patient: p, risk }, index) => {
            const moved = movement.get(p.id);
            const isOpen = expanded === p.id;
            return (
              <article
                key={p.id}
                className={`worklist-row band-${risk?.band ?? 'stable'} ${moved ? 'moved' : ''}`}
              >
                <div className="worklist-rank">
                  <span className="rank-num">{index + 1}</span>
                  {moved > 0 && (
                    <span className="rank-move up" title={`Up ${moved} place${moved > 1 ? 's' : ''}`}>
                      <ArrowUp style={{ width: '11px', height: '11px' }} />{moved}
                    </span>
                  )}
                  {moved < 0 && (
                    <span className="rank-move down" title={`Down ${-moved}`}>
                      <ArrowDown style={{ width: '11px', height: '11px' }} />{-moved}
                    </span>
                  )}
                </div>

                <div className="worklist-main">
                  <div className="worklist-name">
                    {p.name}
                    <span className="worklist-meta">{p.id} · {p.age}y {p.gender} · {p.roomBed}</span>
                  </div>
                  <div className="worklist-conditions">
                    {p.chronicConditions?.length ? p.chronicConditions.join(', ') : 'No chronic conditions recorded'}
                  </div>
                </div>

                <div className="worklist-vitals">
                  {p.vitalsHistory?.[0] ? (
                    <>
                      <div>BP {p.vitalsHistory[0].bp} · HR {p.vitalsHistory[0].hr}</div>
                      <div className="muted">{p.vitalsHistory[0].time}</div>
                    </>
                  ) : (
                    <div className="muted">No observations</div>
                  )}
                </div>

                <div className="worklist-score">
                  <div className="score-value">{risk?.score ?? 0}</div>
                  <div className="score-band">{BAND_LABEL[risk?.band ?? 'stable']}</div>
                  <div className="score-bar" aria-hidden="true">
                    <span style={{ width: `${((risk?.score ?? 0) / MAX_SCORE) * 100}%` }} />
                  </div>
                </div>

                <div className="worklist-actions">
                  <button
                    className="btn-pill btn-pill-secondary why-btn"
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    aria-expanded={isOpen}
                  >
                    <Info style={{ width: '13px', height: '13px' }} /> Why?
                  </button>
                  <button
                    className="btn-pill btn-pill-teal"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => onOpenEMR(p.id)}
                  >
                    EMR
                  </button>
                  <button
                    className="btn-pill btn-pill-secondary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => onOpenML(p.id)}
                  >
                    Assess
                  </button>
                </div>

                {isOpen && risk && (
                  <div className="worklist-explain">
                    <div className="explain-head">
                      Why {p.name} is ranked here — {risk.score} of {MAX_SCORE} points
                    </div>

                    <ul className="explain-factors">
                      {risk.factors.map((f) => (
                        <li key={f.key}>
                          <span className="factor-points">+{f.points}</span>
                          <span className="factor-label">{f.label}</span>
                          <span className="factor-detail">{f.detail}</span>
                        </li>
                      ))}
                      {!risk.factors.length && <li className="factor-detail">No contributing factors — patient appears stable.</li>}
                    </ul>

                    <div className="explain-breakdown">
                      <span>Model <strong>{risk.breakdown.model}</strong>/45</span>
                      <span>Vitals <strong>{risk.breakdown.vitals}</strong>/25{risk.vitalsCapped ? ' (capped)' : ''}</span>
                      <span>Labs <strong>{risk.breakdown.labs}</strong>/15</span>
                      <span>Triage <strong>{risk.breakdown.triage}</strong>/15</span>
                    </div>

                    <p className="explain-note">
                      Weights are a design choice for this system, not a validated
                      clinical scale. The ranking is a prompt to look, not a diagnosis.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </DataSection>
    </div>
  );
}
