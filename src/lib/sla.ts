import type { TicketPriority } from '../types/api.types';

/** Same SLA windows as the backend. */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 72,
};

const HOUR = 3_600_000;

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'resolved_on_time' | 'resolved_late';

export function slaDeadline(openedAt: string, priority: TicketPriority): Date {
  return new Date(new Date(openedAt).getTime() + SLA_HOURS[priority] * HOUR);
}

export function slaRemainingHours(openedAt: string, priority: TicketPriority, now: Date = new Date()): number {
  return (slaDeadline(openedAt, priority).getTime() - now.getTime()) / HOUR;
}

export function slaStatus(
  openedAt: string,
  priority: TicketPriority,
  resolvedAt?: string | null,
  now: Date = new Date(),
): SlaStatus {
  if (resolvedAt) {
    return new Date(resolvedAt) <= slaDeadline(openedAt, priority) ? 'resolved_on_time' : 'resolved_late';
  }
  const r = slaRemainingHours(openedAt, priority, now);
  if (r < 0) return 'breached';
  if (r <= SLA_HOURS[priority] * 0.25) return 'at_risk';
  return 'on_track';
}

/** "18h 24m left" / "2h 15m overdue" / "On time" / "Late". */
export function formatSla(
  openedAt: string,
  priority: TicketPriority,
  resolvedAt?: string | null,
  now: Date = new Date(),
): string {
  const st = slaStatus(openedAt, priority, resolvedAt, now);
  if (st === 'resolved_on_time') return 'On time';
  if (st === 'resolved_late') return 'Late';
  const r = slaRemainingHours(openedAt, priority, now);
  const overdue = r < 0;
  const mins = Math.round(Math.abs(r) * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return overdue ? `${label} overdue` : `${label} left`;
}

/**
 * Acknowledgement deadline of a driver's "Report Issue" ticket (the same rule as a maintenance report):
 * "Acknowledge in 25m" / "Overdue by 1h 5m" / "Acknowledged on time" / "Acknowledged late". Null when the ticket has none.
 */
export function ackSlaLabel(
  t: { ackSlaDueAt?: string | null; ackOnTime?: boolean | null; acknowledgedAt?: string | null; status: string },
  now: Date = new Date(),
): { text: string; color: string } | null {
  if (!t.ackSlaDueAt) return null;
  if (t.ackOnTime === true) return { text: 'Acknowledged on time', color: 'var(--success)' };
  if (t.ackOnTime === false) return { text: 'Acknowledged late', color: 'var(--danger)' };
  if (t.status !== 'open') return null; // moved on without a recorded response (older data)
  const left = (new Date(t.ackSlaDueAt).getTime() - now.getTime()) / 60000;
  const m = Math.abs(Math.round(left));
  const d = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  return left < 0 ? { text: `Overdue by ${d}`, color: 'var(--danger)' } : { text: `Acknowledge in ${d}`, color: left <= 15 ? 'var(--warning)' : 'var(--text-muted)' };
}

export function slaColor(st: SlaStatus): string {
  if (st === 'breached' || st === 'resolved_late') return 'var(--danger)';
  if (st === 'at_risk') return 'var(--warning)';
  return 'var(--success)';
}
