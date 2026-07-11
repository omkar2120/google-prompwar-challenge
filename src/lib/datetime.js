// Small, shared time-formatting helpers so relative timestamps read identically
// everywhere (activity log, alert history, map popups) instead of being
// re-implemented per component.

const MS_PER_MINUTE = 60_000;

/**
 * Format an epoch timestamp as a compact, human "time ago" string
 * (e.g. "just now", "5m ago", "3h ago", "2d ago").
 * @param {number} timestamp  Epoch milliseconds.
 * @returns {string}
 */
export function formatTimeAgo(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / MS_PER_MINUTE);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Ultra-compact "time ago" without the "ago" suffix, for tight UI like map
 * marker popups (e.g. "1m", "3h", "2d").
 * @param {number} timestamp  Epoch milliseconds.
 * @returns {string}
 */
export function formatTimeAgoShort(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / MS_PER_MINUTE);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}
