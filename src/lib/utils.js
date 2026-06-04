// ── SECTION: Shared helpers ──

/** Join truthy class names. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** Indian-format currency, e.g. 1842500 → "₹18,42,500". */
export function formatINR(n, { paise = false } = {}) {
  if (n == null || isNaN(n)) return '₹0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const str = paise ? abs.toFixed(2) : Math.round(abs).toString();
  const [intPart, decPart] = str.split('.');
  // Indian grouping: last 3 digits, then groups of 2.
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
    : last3;
  return `${sign}₹${grouped}${decPart ? '.' + decPart : ''}`;
}

/** Plain number with Indian grouping (no currency symbol). */
export function formatNum(n) {
  if (n == null || isNaN(n)) return '0';
  return formatINR(n).replace('₹', '');
}

/** Initials from a full name, max 2 letters. */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/** Whole days from now until an ISO date (negative = past). */
export function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

/** Human relative time, e.g. "3h ago", "2d ago", "just now". */
export function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const fut = diff < 0;
  const mins = Math.round(abs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ${fut ? 'from now' : 'ago'}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ${fut ? 'from now' : 'ago'}`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ${fut ? 'from now' : 'ago'}`;
  const mo = Math.round(days / 30);
  return `${mo}mo ${fut ? 'from now' : 'ago'}`;
}

/** Short date, e.g. "30 May 2026". */
export function shortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Datetime, e.g. "30 May, 14:30". */
export function dateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns the semantic CSS var color for a document expiry in N days. */
export function expiryColor(days) {
  if (days < 0) return 'var(--danger)';
  if (days < 15) return 'var(--danger)';
  if (days < 60) return 'var(--warning)';
  return 'var(--success)';
}
