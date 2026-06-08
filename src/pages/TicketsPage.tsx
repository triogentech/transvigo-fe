import React, { useEffect, useMemo, useState } from 'react';
import * as ticketsApi from '../api/tickets.api';
import { getSelect, type SelectOption } from '../api/select.api';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate } from '../lib/utils.js';
import { formatSla, slaColor, slaStatus } from '../lib/sla';
import type {
  CreateTicketBody, Ticket, TicketHistoryEntry, TicketIssueType, TicketPriority, TicketStatus,
} from '../types/api.types';
import { ErrorBanner, LoadingButton, SkeletonTable } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const TVSelect: React.FC<any> = UI.TVSelect;
const StatCard: React.FC<any> = UI.StatCard;

const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const ISSUE_TYPES: TicketIssueType[] = [
  'breakdown', 'accident', 'tyre_puncture', 'engine_issue', 'electrical_issue',
  'brake_issue', 'service_due', 'driver_complaint', 'other',
];
const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

const PRIORITY_META: Record<TicketPriority, { color: string; bg: string }> = {
  critical: { color: 'var(--danger)', bg: 'rgba(220,38,38,0.10)' },
  high: { color: '#EA580C', bg: 'rgba(234,88,12,0.10)' },
  medium: { color: 'var(--warning)', bg: 'rgba(217,119,6,0.10)' },
  low: { color: 'var(--text-muted)', bg: 'var(--bg-sunken)' },
};
const STATUS_META: Record<TicketStatus, { color: string; bg: string }> = {
  open: { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  acknowledged: { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  in_progress: { color: 'var(--teal)', bg: 'rgba(14,165,197,0.10)' },
  resolved: { color: 'var(--success)', bg: 'rgba(22,163,74,0.10)' },
  closed: { color: 'var(--text-muted)', bg: 'var(--bg-sunken)' },
};

// Allowed forward transitions (mirrors the backend state machine).
const NEXT: Record<TicketStatus, { status: TicketStatus; label: string }[]> = {
  open: [{ status: 'acknowledged', label: 'Acknowledge' }, { status: 'in_progress', label: 'Start Progress' }],
  acknowledged: [{ status: 'in_progress', label: 'Start Progress' }],
  in_progress: [{ status: 'resolved', label: 'Resolve' }],
  resolved: [{ status: 'closed', label: 'Close' }],
  closed: [],
};

const FILTERS: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

function PriorityPill({ p }: { p: TicketPriority }) {
  const m = PRIORITY_META[p];
  return <Pill color={m.color} bg={m.bg} border={m.bg}>{titleCase(p)}</Pill>;
}
function StatusPill({ s }: { s: TicketStatus }) {
  const m = STATUS_META[s];
  return <Pill color={m.color} bg={m.bg} border={m.bg}>{titleCase(s)}</Pill>;
}

// ── Detail modal ──
function TicketDetailModal({ ticketId, open, onOpenChange, onChanged }: {
  ticketId: string; open: boolean; onOpenChange: (o: boolean) => void; onChanged: () => void;
}) {
  const toast = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [assignees, setAssignees] = useState<SelectOption[]>([]);

  const load = async () => {
    setLoading(true);
    try { setTicket(await ticketsApi.getTicket(ticketId)); }
    catch (e) { toast.error(errMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (open) {
      void load();
      getSelect('assignees').then(setAssignees).catch(() => undefined);
    }
    /* eslint-disable-next-line */
  }, [open, ticketId]);

  const changeStatus = async (status: TicketStatus) => {
    setBusy(true);
    try {
      await ticketsApi.changeTicketStatus(ticketId, status);
      toast.success(`Ticket ${titleCase(status)}`);
      await load();
      onChanged();
    } catch (e) { toast.error(errMessage(e)); }
    finally { setBusy(false); }
  };

  const assign = async (userId: string) => {
    if (!userId) return;
    setBusy(true);
    try {
      await ticketsApi.assignTicket(ticketId, userId);
      toast.success('Ticket assigned');
      await load();
      onChanged();
    } catch (e) { toast.error(errMessage(e)); }
    finally { setBusy(false); }
  };

  const history = useMemo<TicketHistoryEntry[]>(
    () => [...(ticket?.history ?? [])].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [ticket],
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} width={720}
      header={ticket ? (
        <div>
          <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>{ticket.ticketNumber}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <PriorityPill p={ticket.priority} />
            <StatusPill s={ticket.status} />
          </div>
        </div>
      ) : 'Ticket'}
    >
      {loading || !ticket ? (
        <SkeletonTable rows={4} cols={2} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.title}</div>

          {/* SLA + meta */}
          <div className="tv-card-flat" style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            <KV label="Issue Type" value={titleCase(ticket.issueType)} />
            <KV label="Vehicle" value={ticket.vehicle?.vehicleNumber ?? '—'} mono />
            <KV label="Driver" value={ticket.driver?.fullName ?? '—'} />
            <KV label="Location" value={ticket.location ?? '—'} />
            <KV label="SLA" value={formatSla(ticket.openedAt, ticket.priority, ticket.resolvedAt)}
              color={slaColor(slaStatus(ticket.openedAt, ticket.priority, ticket.resolvedAt))} />
            <KV label="Opened" value={shortDate(ticket.openedAt)} />
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{ticket.description}</div>
          </div>
          {ticket.resolution && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Resolution</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{ticket.resolution}</div>
            </div>
          )}
          {ticket.photoUrl && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Photo</div>
              <a href={ticket.photoUrl} target="_blank" rel="noreferrer">
                <img
                  src={ticket.photoUrl}
                  alt="Ticket attachment"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </a>
            </div>
          )}

          {/* Assign */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Assign To</div>
            <TVSelect
              value={ticket.assignedToUser?.id ?? ''}
              onValueChange={assign}
              options={[{ value: '', label: 'Unassigned' }, ...assignees]}
              placeholder="Assign to a team member"
              disabled={busy}
            />
          </div>

          {/* Status actions */}
          {NEXT[ticket.status].length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NEXT[ticket.status].map((n) => (
                <LoadingButton key={n.status} className="btn-brand" loading={busy} onClick={() => changeStatus(n.status)}>
                  {n.label}
                </LoadingButton>
              ))}
            </div>
          )}

          {/* Journey */}
          <div>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Ticket Journey</div>
            {history.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No history yet.</div>
            ) : history.map((h) => (
              <div key={h.id} style={{ display: 'flex', gap: 10, paddingBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, background: h.toStatus ? STATUS_META[h.toStatus].color : 'var(--accent-navy)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {h.fromStatus && h.toStatus ? `${titleCase(h.fromStatus)} → ${titleCase(h.toStatus)}` : titleCase(h.action)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {(h.performedByUser?.username ?? 'System') + ' · ' + shortDate(h.createdAt)}
                  </div>
                  {h.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function KV({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className={mono ? 'font-mono' : ''} style={{ fontSize: 13, color: color ?? 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── Raise ticket modal ──
const EMPTY: { vehicleId: string; issueType: TicketIssueType; priority: TicketPriority; title: string; description: string; location: string } = {
  vehicleId: '', issueType: 'breakdown', priority: 'medium', title: '', description: '', location: '',
};
function RaiseTicketModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    getSelect('vehicles').then(setVehicles).catch(() => undefined);
  }, [open]);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    setSubmitting(true);
    try {
      const body: CreateTicketBody = {
        vehicleId: form.vehicleId || undefined,
        issueType: form.issueType,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || undefined,
      };
      await ticketsApi.createTicket(body);
      toast.success('Ticket raised');
      onOpenChange(false);
      onCreated();
    } catch (e) { toast.error(errMessage(e)); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Raise Ticket" width={560}
      footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Submit</LoadingButton>}>
      <div className="flex flex-col gap-3">
        <Labeled label="Vehicle">
          <TVSelect value={form.vehicleId} onValueChange={(v: string) => set('vehicleId', v)}
            options={[{ value: '', label: 'Unassigned' }, ...vehicles]} placeholder="Select vehicle" />
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Issue Type">
            <TVSelect value={form.issueType} onValueChange={(v: TicketIssueType) => set('issueType', v)}
              options={ISSUE_TYPES.map((t) => ({ value: t, label: titleCase(t) }))} />
          </Labeled>
          <Labeled label="Priority">
            <TVSelect value={form.priority} onValueChange={(v: TicketPriority) => set('priority', v)}
              options={PRIORITIES.map((p) => ({ value: p, label: titleCase(p) }))} />
          </Labeled>
        </div>
        <Labeled label="Title">
          <input className="tv-input w-full" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Brief description" />
        </Labeled>
        <Labeled label="Description">
          <textarea className="tv-input w-full" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the issue…" />
        </Labeled>
        <Labeled label="Location (optional)">
          <input className="tv-input w-full" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Where is it?" />
        </Labeled>
      </div>
    </Modal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

// ── Kanban board ──
const BOARD_LANES: TicketStatus[] = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'];

function TicketCard({ t, onOpen, onAdvance, busy }: {
  t: Ticket; onOpen: (id: string) => void; onAdvance: (id: string, s: TicketStatus) => void; busy: boolean;
}) {
  const breached =
    t.status !== 'resolved' && t.status !== 'closed' &&
    slaStatus(t.openedAt, t.priority, t.resolvedAt) === 'breached';
  const next = NEXT[t.status];
  return (
    <div
      className="tv-card"
      onClick={() => onOpen(t.id)}
      style={{ padding: 10, cursor: 'pointer', position: 'relative', borderLeft: `3px solid ${PRIORITY_META[t.priority].color}` }}
    >
      {breached && (
        <span
          title="SLA breached"
          className="animate-pulse"
          style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, background: 'var(--danger)', boxShadow: '0 0 0 3px rgba(220,38,38,0.18)' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--teal)' }}>{t.ticketNumber}</span>
        <PriorityPill p={t.priority} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, fontWeight: 500 }}>
        {t.title.length > 50 ? `${t.title.slice(0, 50)}…` : t.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        {t.vehicle?.vehicleNumber ?? '—'} ·{' '}
        <span style={{ color: slaColor(slaStatus(t.openedAt, t.priority, t.resolvedAt)) }}>
          {formatSla(t.openedAt, t.priority, t.resolvedAt)}
        </span>
      </div>
      {t.assignedToUser && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--accent-teal)' }} />
          {t.assignedToUser.username}
        </div>
      )}
      {next.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
          {next.map((n) => (
            <button
              key={n.status}
              className="btn-ghost"
              style={{ fontSize: 11, padding: '2px 8px' }}
              disabled={busy}
              onClick={() => onAdvance(t.id, n.status)}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketBoard({ tickets, onOpen, onAdvance, busyId }: {
  tickets: Ticket[]; onOpen: (id: string) => void; onAdvance: (id: string, s: TicketStatus) => void; busyId: string | null;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {BOARD_LANES.map((lane) => {
        const items = tickets.filter((t) => t.status === lane);
        const m = STATUS_META[lane];
        return (
          <div key={lane} style={{ minWidth: 264, flex: '1 0 264px', background: 'var(--bg-sunken)', borderRadius: 12, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titleCase(lane)}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.length === 0
                ? <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 4px' }}>—</div>
                : items.map((t) => <TicketCard key={t.id} t={t} onOpen={onOpen} onAdvance={onAdvance} busy={busyId === t.id} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──
export default function TicketsPage() {
  const toast = useToast();
  const [all, setAll] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TicketStatus | 'all'>('all');
  const [view, setView] = useState<'board' | 'grid'>('board');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [raiseOpen, setRaiseOpen] = useState(false);

  const refetch = async () => {
    setLoading(true); setError(null);
    try { const res = await ticketsApi.getTickets(); setAll(res.data); }
    catch (e) { setError(errMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refetch(); }, []);

  const advance = async (id: string, status: TicketStatus) => {
    setBusyId(id);
    try {
      await ticketsApi.changeTicketStatus(id, status);
      toast.success(`Ticket ${titleCase(status)}`);
      await refetch();
    } catch (e) { toast.error(errMessage(e)); }
    finally { setBusyId(null); }
  };

  const summary = useMemo(() => {
    const openCount = all.filter((t) => t.status === 'open').length;
    const criticalOpen = all.filter((t) => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;
    const overdue = all.filter((t) => t.status !== 'resolved' && t.status !== 'closed' && slaStatus(t.openedAt, t.priority) === 'breached').length;
    const resolved = all.filter((t) => t.resolvedAt);
    const onTime = resolved.filter((t) => t.isResolvedOnTime).length;
    const onTimePct = resolved.length ? Math.round((onTime / resolved.length) * 100) : 0;
    return { openCount, criticalOpen, overdue, onTimePct };
  }, [all]);

  const filtered = tab === 'all' ? all : all.filter((t) => t.status === tab);

  const columns = [
    { key: 'ticketNumber', header: 'Ticket #', render: (r: Ticket) => <span className="font-mono" style={{ color: 'var(--teal)' }}>{r.ticketNumber}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (r: Ticket) => r.vehicle?.vehicleNumber ? <span className="font-mono">{r.vehicle.vehicleNumber}</span> : <span style={{ color: 'var(--text-dim)' }}>—</span> },
    { key: 'issueType', header: 'Issue', render: (r: Ticket) => titleCase(r.issueType) },
    { key: 'priority', header: 'Priority', render: (r: Ticket) => <PriorityPill p={r.priority} /> },
    { key: 'status', header: 'Status', render: (r: Ticket) => <StatusPill s={r.status} /> },
    {
      key: 'sla', header: 'SLA',
      render: (r: Ticket) => (
        <span style={{ fontSize: 12, color: slaColor(slaStatus(r.openedAt, r.priority, r.resolvedAt)) }}>
          {formatSla(r.openedAt, r.priority, r.resolvedAt)}
        </span>
      ),
    },
    {
      key: 'assignedTo', header: 'Assigned',
      render: (r: Ticket) => r.assignedToUser
        ? <span style={{ fontSize: 12 }}>{r.assignedToUser.username}</span>
        : <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>,
    },
    { key: 'openedAt', header: 'Opened', render: (r: Ticket) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shortDate(r.openedAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="TICKETS"
        breadcrumbs={['Operations', 'Tickets']}
        actions={<button className="btn-brand" onClick={() => setRaiseOpen(true)}>+ Raise Ticket</button>}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Open" accent="var(--teal)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{summary.openCount}</span></StatCard>
        <StatCard title="Critical Open" accent="var(--danger)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{summary.criticalOpen}</span></StatCard>
        <StatCard title="Overdue (SLA)" accent="var(--danger)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: summary.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{summary.overdue}</span></StatCard>
        <StatCard title="Resolved On-Time" accent="var(--success)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{summary.onTimePct}%</span></StatCard>
      </div>

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {view === 'grid' && FILTERS.map((f) => {
            const active = tab === f.value;
            return (
              <button key={f.value} onClick={() => setTab(f.value)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid ' + (active ? 'var(--accent-navy)' : 'var(--border)'),
                  background: active ? 'var(--accent-navy)' : 'var(--bg-sunken)',
                  color: active ? '#fff' : 'var(--text-muted)',
                }}>
                {f.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['board', 'grid'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: view === v ? 'var(--accent-navy)' : 'transparent',
                color: view === v ? '#fff' : 'var(--text-muted)',
              }}>
              {v === 'board' ? 'Board' : 'Grid'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : view === 'board' ? (
        <TicketBoard tickets={all} onOpen={setSelectedId} onAdvance={advance} busyId={busyId} />
      ) : (
        <DataTable columns={columns} data={filtered} onRowClick={(r: Ticket) => setSelectedId(r.id)} emptyLabel="No tickets found" pageSize={12} />
      )}

      {selectedId && (
        <TicketDetailModal
          ticketId={selectedId}
          open={!!selectedId}
          onOpenChange={(o) => { if (!o) setSelectedId(null); }}
          onChanged={refetch}
        />
      )}

      <RaiseTicketModal open={raiseOpen} onOpenChange={setRaiseOpen} onCreated={refetch} />
    </div>
  );
}
