/** Shared formatting between the database shape and the UI shape. */

const TIME_OPTS = { hour: '2-digit', minute: '2-digit', hour12: true };

/** "2026-08-14T09:00:00Z" -> "09:00 AM" */
export function clockLabel(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', TIME_OPTS);
}

/** "2026-08-14T09:00:00Z" -> "Aug 14, 2026" */
export function dateLabel(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

/**
 * Vitals timestamps read as "10:30 AM Today" / "11:00 PM Yesterday" /
 * "Aug 12, 10:30 AM" — clinicians scan relative recency far faster than
 * absolute dates when reviewing an observation chart.
 */
export function relativeStamp(iso) {
  if (!iso) return '—';
  const then = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const time = then.toLocaleTimeString('en-US', TIME_OPTS);
  if (then >= startOfToday) return `${time} Today`;
  if (then >= startOfYesterday) return `${time} Yesterday`;
  return `${then.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${time}`;
}

/** Combine systolic/diastolic into the "148/92" form the UI expects. */
export function bpLabel(systolic, diastolic) {
  if (systolic == null || diastolic == null) return '—';
  return `${systolic}/${diastolic}`;
}

/** Parse "148/92" back into a pair for writing to the database. */
export function parseBp(value) {
  const match = /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/.exec(value ?? '');
  if (!match) return { systolic: null, diastolic: null };
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
}

/** Strip unit suffixes a user may type: "96%" -> 96, "98.6°F" -> 98.6 */
export function numeric(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
