import L from 'leaflet';

/** Hazard type → display metadata + marker color. */
export const HAZARD_META = {
  waterlogging: { emoji: '🌊', color: '#2563eb' },
  tree_down: { emoji: '🌳', color: '#16a34a' },
  power_outage: { emoji: '⚡', color: '#f59e0b' },
  road_blocked: { emoji: '🚧', color: '#dc2626' },
  other: { emoji: '⚠️', color: '#6b7280' },
};

const RECENT_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * Build a colored div-icon for a report, fading out older-than-12h reports.
 * @param {import('../../types/index.js').HazardType} type
 * @param {number} createdAt
 */
export function buildIcon(type, createdAt) {
  const meta = HAZARD_META[type] || HAZARD_META.other;
  const stale = Date.now() - createdAt > RECENT_MS;
  const opacity = stale ? 0.4 : 1;
  const grayscale = stale ? 'filter:grayscale(0.7);' : '';
  return L.divIcon({
    className: 'hazard-marker',
    html: `<div style="opacity:${opacity};${grayscale}background:${meta.color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">
             <span style="transform:rotate(45deg);font-size:14px;">${meta.emoji}</span>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

export function isRecent(createdAt) {
  return Date.now() - createdAt <= RECENT_MS;
}
