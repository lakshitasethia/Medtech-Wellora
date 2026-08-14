import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

/** Shimmering placeholder rows. Prototypes skip these; examiners notice. */
export function Skeleton({ rows = 4, height = 46 }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ height }} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-panel state-panel-error" role="alert">
      <AlertTriangle style={{ width: '22px', height: '22px' }} />
      <div>
        <strong>Could not load this data</strong>
        <p>{error?.message ?? 'Unknown error.'}{error?.code ? ` (${error.code})` : ''}</p>
        {error?.hint && <p className="state-hint">{error.hint}</p>}
      </div>
      {onRetry && (
        <button className="btn-pill btn-pill-secondary" onClick={onRetry}>
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, icon }) {
  return (
    <div className="state-panel">
      {icon ?? <Inbox style={{ width: '22px', height: '22px' }} />}
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

/**
 * Wraps a section in the three states every data-backed view needs.
 * `isEmpty` is evaluated only once loading has finished and no error
 * occurred, so an empty result never flashes during a fetch.
 */
export function DataSection({ loading, error, isEmpty, onRetry, empty, skeletonRows, children }) {
  if (loading) return <Skeleton rows={skeletonRows} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return empty ?? <EmptyState />;
  return children;
}
