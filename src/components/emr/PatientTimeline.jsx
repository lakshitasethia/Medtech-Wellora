import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bed, Calendar, FileText, FlaskConical, LogIn, Pill, UserPlus, Zap, History,
} from 'lucide-react';
import { useHospitalData } from '../../context/DataContext';
import {
  EVENT_META, dayHeading, groupByDay, loadTimeline, roleLabel,
} from '../../lib/timeline';
import { DataSection, EmptyState } from '../common/States';

const ICONS = { Activity, Bed, Calendar, FileText, FlaskConical, LogIn, Pill, UserPlus, Zap };

function EventIcon({ name }) {
  const Cmp = ICONS[name] ?? Activity;
  return <Cmp style={{ width: '15px', height: '15px' }} />;
}

function timeOf(event) {
  const d = new Date(event.at);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (event.displayAt ?? '—');
}

/**
 * One patient, one timeline.
 *
 * Every role's actions land in the same `clinical_events` stream, so this is
 * the same record whether a nurse, doctor or receptionist is looking at it —
 * filtered by RLS, not by which department's copy you happened to open.
 * That is the Single Source of Truth claim made visible.
 */
export default function PatientTimeline({ patient }) {
  const { lastSync } = useHospitalData();
  const [events, setEvents] = useState([]);
  const [source, setSource] = useState('logged');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const { events: e, source: s } = await loadTimeline(patient.id, patient);
      setEvents(e);
      setSource(s);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [patient]);

  // `lastSync` changes whenever DataContext's realtime subscription fires, so
  // an event written by another role appears here without a manual refresh.
  useEffect(() => { load(); }, [load, lastSync]);

  const rolesPresent = useMemo(() => {
    const set = new Set(events.map((e) => e.actorRole).filter(Boolean));
    return [...set];
  }, [events]);

  const visible = useMemo(
    () => (roleFilter === 'all' ? events : events.filter((e) => e.actorRole === roleFilter)),
    [events, roleFilter]
  );

  const grouped = useMemo(() => groupByDay(visible), [visible]);

  return (
    <div className="timeline-wrap">
      <div className="card-header-row" style={{ marginBottom: '0.85rem' }}>
        <div>
          <h3 className="card-title" style={{ fontSize: '0.98rem' }}>
            <History style={{ width: '18px', height: '18px' }} /> Unified Care Timeline
          </h3>
          <p className="card-subtitle">
            {source === 'logged'
              ? 'Every action by every role, in one append-only record.'
              : 'Reconstructed from this record — demo mode has no event log.'}
          </p>
        </div>
        <span className={`badge ${source === 'logged' ? 'badge-success' : 'badge-warning'}`}>
          {source === 'logged' ? `${events.length} logged events` : 'Derived view'}
        </span>
      </div>

      {rolesPresent.length > 1 && (
        <div className="timeline-filters">
          <button
            className={`timeline-chip ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All roles ({events.length})
          </button>
          {rolesPresent.map((r) => (
            <button
              key={r}
              className={`timeline-chip role-${r} ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {roleLabel(r)} ({events.filter((e) => e.actorRole === r).length})
            </button>
          ))}
        </div>
      )}

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!visible.length}
        onRetry={load}
        skeletonRows={4}
        empty={
          <EmptyState
            title="No activity recorded yet"
            message="Check-ins, vitals, notes and prescriptions will appear here as they happen."
          />
        }
      >
        <div className="timeline">
          {grouped.map((group) => (
            <section key={group.key} className="timeline-day">
              <div className="timeline-day-heading">{dayHeading(group.key)}</div>

              {group.items.map((e) => {
                const meta = EVENT_META[e.type] ?? { label: e.type, icon: 'Activity', tone: 'slate' };
                return (
                  <article key={e.id} className={`timeline-item tone-${meta.tone}`}>
                    <div className="timeline-marker">
                      <EventIcon name={meta.icon} />
                    </div>

                    <div className="timeline-body">
                      <div className="timeline-item-head">
                        <span className="timeline-type">{meta.label}</span>
                        <span className="timeline-time">{timeOf(e)}</span>
                      </div>

                      <p className="timeline-summary">{e.summary}</p>

                      <div className="timeline-actor">
                        <span className={`timeline-role role-${e.actorRole ?? 'system'}`}>
                          {roleLabel(e.actorRole)}
                        </span>
                        <span>{e.actorName}</span>
                      </div>

                      {/* SOAP notes carry structure worth expanding rather
                          than flattening into the one-line summary. */}
                      {e.type === 'note' && e.payload && (
                        <details className="timeline-details">
                          <summary>Full SOAP note</summary>
                          <dl>
                            {e.payload.s && (<><dt>Subjective</dt><dd>{e.payload.s}</dd></>)}
                            {e.payload.o && (<><dt>Objective</dt><dd>{e.payload.o}</dd></>)}
                            {e.payload.a && (<><dt>Assessment</dt><dd>{e.payload.a}</dd></>)}
                            {e.payload.p && (<><dt>Plan</dt><dd>{e.payload.p}</dd></>)}
                          </dl>
                        </details>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </DataSection>
    </div>
  );
}
