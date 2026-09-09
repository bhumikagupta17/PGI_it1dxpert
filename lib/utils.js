import { Colors } from '../constants/theme';

// ── Glucose ───────────────────────────────────────────────────
export const glucoseStatus = (value, low = 70, high = 180) => {
  if (value < 54)   return { label: 'Very Low',  color: Colors.veryLow };
  if (value < low)  return { label: 'Low',        color: Colors.low };
  if (value <= high) return { label: 'In Range',  color: Colors.inRange };
  if (value <= 250) return { label: 'High',       color: Colors.high };
  return              { label: 'Very High',       color: Colors.veryHigh };
};

// GMI = 3.31 + 0.02392 × avg glucose (mg/dL)
export const calcGMI = (avg) => (3.31 + 0.02392 * avg).toFixed(1);

// ── Date helpers ──────────────────────────────────────────────
export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const fromNow = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── String helpers ────────────────────────────────────────────
export const capitalize = (s) =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

export const initials = (name) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
