// API CALLS: 1 (GET /api/pages/drivers) + lazy detail + mutations
// ── SECTION: Drivers Page ──
import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Route, ShieldCheck, Clock, User, CreditCard } from 'lucide-react';

import {
  Card, StatCard, StatusBadge, TVAvatar, DataTable, PageHeader, Modal, AnimatedNumber, TVSelect,
} from '../components/ui.jsx';
import { SkeletonGrid, SkeletonTable, ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';
import { AsyncSelect } from '../components/AsyncSelect.tsx';
import { cx } from '../lib/utils.js';
import { formatINR, shortDate } from '../lib/utils.js';
import { useDriversPage } from '../hooks/pages/useDriversPage';
import { useDriverDetail } from '../hooks/pages/useDriverDetail';
import { useDriversActions } from '../hooks/actions/useDriversActions';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import * as driversApi from '../api/drivers.api';

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'salary', label: 'Salary' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'recurring_deposit', label: 'Recurring Deposit' },
];

const EMPTY_DRIVER = {
  fullName: '', countryDialCode: '+91', contactNumber: '',
  emgCountryDialCode: '+91', emgContactNumber: '', address: '', reference: '',
  aadhaarNumber: '', panNumber: '', drivingLicenceNumber: '',
  accountHolderName: '', accountNumber: '', branchName: '', ifscCode: '', accountType: '',
  vehicleId: '', vehicleLabel: '', vehicleDriver: '',
};

// ── Labelled form field ──
function Field({ label, span, children }) {
  return (
    <div style={span ? { gridColumn: 'span 2' } : undefined}>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

// ── Add Driver Modal ──
function AddDriverModal({ open, onOpenChange, onCreated }) {
  const { createDriver } = useDriversActions();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_DRIVER);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => { if (open) setForm(EMPTY_DRIVER); }, [open]);

  // Only the name and the phone number are needed. Everything else can be added later.
  const REQUIRED = { fullName: 'the driver\'s name', contactNumber: 'the phone number' };
  const clean = (v) => String(v ?? '').trim() || undefined;

  const submit = async () => {
    for (const [k, what] of Object.entries(REQUIRED)) {
      if (!String(form[k]).trim()) { toast.error(`Enter ${what}`); return; }
    }
    setSubmitting(true);
    try {
      const created = await createDriver({
        fullName: form.fullName.trim(),
        countryDialCode: form.countryDialCode || '+91',
        contactNumber: form.contactNumber.trim(),
        emgCountryDialCode: form.emgCountryDialCode || '+91',
        emgContactNumber: clean(form.emgContactNumber),
        aadhaarNumber: clean(form.aadhaarNumber),
        panNumber: clean(form.panNumber),
        address: clean(form.address),
        reference: clean(form.reference),
        drivingLicenceNumber: clean(form.drivingLicenceNumber),
        accountHolderName: clean(form.accountHolderName),
        accountNumber: clean(form.accountNumber),
        branchName: clean(form.branchName),
        ifscCode: clean(form.ifscCode)?.toUpperCase(),
        accountType: form.accountType || undefined,
        vehicleId: form.vehicleId || undefined,
      });
      const av = created?.assignedVehicle;
      toast.success(av ? `Driver added. ${av.vehicleNumber} is now theirs${av.replacedDriverName ? ` (moved from ${av.replacedDriverName})` : ''}.` : 'Driver added');
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const input = (k, placeholder, mono) => (
    <input
      className={cx('tv-input w-full', mono && 'font-mono')}
      value={form[k]}
      onChange={(e) => set(k, e.target.value)}
      placeholder={placeholder}
    />
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      width={680}
      title="Add Driver"
      footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit} disabled={!!form.vehicleInTransit}>Save Driver</LoadingButton>}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Only the name and the phone number are needed. You can add the other details later.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        <Field label="Full Name *">{input('fullName', 'Driver full name')}</Field>
        <Field label="Contact Number *">{input('contactNumber', '9876543210', true)}</Field>
        <Field label="Vehicle (optional)" span>
          <AsyncSelect
            entity="vehicles"
            value={form.vehicleId}
            valueLabel={form.vehicleLabel}
            onChange={(v, opt) => setForm((f) => ({ ...f, vehicleId: v, vehicleLabel: opt?.label ?? '', vehicleDriver: opt?.meta?.driverName ?? '', vehicleInTransit: opt?.meta?.status === 'in_transit' && !!opt?.meta?.driverName }))}
            placeholder="Assign a vehicle to this driver"
            clearable
            clearLabel="No vehicle"
            emptyLabel="No vehicles found"
          />
          {form.vehicleDriver && !form.vehicleInTransit && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--warning)' }}>
              {form.vehicleLabel} is currently {form.vehicleDriver}&apos;s. It will move to this driver.
            </div>
          )}
          {form.vehicleInTransit && (
            <div role="alert" style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)' }}>
              {form.vehicleLabel} is in transit with {form.vehicleDriver}. Its driver can be changed once the trip is completed. Pick another vehicle or leave this empty.
            </div>
          )}
        </Field>
        <div style={{ gridColumn: 'span 2', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>More details (optional)</div>
        <Field label="Emergency Contact">{input('emgContactNumber', '9876543210', true)}</Field>
        <Field label="Driving Licence">{input('drivingLicenceNumber', 'DL number', true)}</Field>
        <Field label="Aadhaar Number">{input('aadhaarNumber', '1234 5678 9012', true)}</Field>
        <Field label="PAN">{input('panNumber', 'ABCDE1234F', true)}</Field>
        <Field label="Address" span>{input('address', 'Residential address')}</Field>
        <Field label="Account Holder">{input('accountHolderName', 'As per bank')}</Field>
        <Field label="Account Number">{input('accountNumber', 'Bank account no.', true)}</Field>
        <Field label="Branch">{input('branchName', 'Branch name')}</Field>
        <Field label="IFSC">{input('ifscCode', 'SBIN0001234', true)}</Field>
        <Field label="Account Type">
          <TVSelect value={form.accountType} onValueChange={(v) => set('accountType', v)} options={[{ value: '', label: 'Not set' }, ...ACCOUNT_TYPES]} />
        </Field>
        <Field label="Reference">{input('reference', 'Referred by')}</Field>
      </div>
    </Modal>
  );
}

// ── Status accent color helper ──
function accentColor(status) {
  if (status === 'in_transit') return 'var(--accent-teal)';
  if (status === 'assigned') return '#6366F1';
  return 'var(--accent-green)'; // available
}

// ── PAN masking ──
function maskPAN(pan) {
  if (!pan || pan.length < 4) return pan || '—';
  return pan.slice(0, 2) + 'XXXXXXX' + pan.slice(-1);
}

// ── Aadhaar masked ──
function maskAadhaar(aadhaar) {
  if (!aadhaar) return '—';
  const last4 = aadhaar.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

// ── Account number masked ──
function maskAccount(acc) {
  if (!acc) return '—';
  return `••••${acc.slice(-4)}`;
}

// ── Tab trigger style ──
function tabTriggerStyle(active) {
  return {
    padding: '8px 16px',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    color: active ? 'var(--teal)' : 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--teal)' : '2px solid transparent',
    marginBottom: -1,
    cursor: 'pointer',
    outline: 'none',
    transition: 'color 150ms ease, border-color 150ms ease',
  };
}

// ── KV Row ──
function KVRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span
        className={mono ? 'font-mono' : ''}
        style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)' }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

// ── Sub-card ──
function SubCard({ title, children }) {
  return (
    <div className="tv-card-flat" style={{ padding: '12px 14px', borderRadius: 4, marginBottom: 12 }}>
      {title && (
        <div
          className="font-display"
          style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}
        >
          {title}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Document card ──
function DocCard({ icon: Icon, label, verified }) {
  return (
    <div className="tv-card-flat" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={20} style={{ color: 'var(--text-muted)' }} />
      <div style={{ flex: 1 }}>
        <div className="font-display" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          {verified
            ? <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
            : <Clock size={13} style={{ color: 'var(--warning)' }} />
          }
          <span style={{ fontSize: 11, color: verified ? 'var(--success)' : 'var(--warning)', fontFamily: 'var(--font-body)' }}>
            {verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Trip History tab — driven by detail.recentTrips from useDriverDetail ──
function TripHistoryTab({ recentTrips, loading }) {
  const tripColumns = [
    {
      key: 'tripNumber',
      header: 'Trip #',
      width: 180,
      render: (row) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{row.tripNumber}</span>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.startPoint} → {row.endPoint}</span>
      ),
    },
    {
      key: 'currentStatus',
      header: 'Status',
      width: 110,
      render: (row) => <StatusBadge status={row.currentStatus} />,
    },
    {
      key: 'freightTotalAmount',
      header: 'Freight',
      align: 'right',
      width: 120,
      render: (row) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{formatINR(row.freightTotalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      width: 110,
      render: (row) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shortDate(row.createdAt)}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 13 }}>
        Loading trips…
      </div>
    );
  }

  if (!recentTrips || recentTrips.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 13 }}>
        No trips found for this driver.
      </div>
    );
  }

  return (
    <DataTable
      columns={tripColumns}
      data={recentTrips}
      paginate={false}
      emptyLabel="No trips found"
    />
  );
}

// ── Driver Detail Modal Content ──
// Uses useDriverDetail(id) to lazily fetch the full driver record + recentTrips
function DriverDetailModal({ driverId, driverName, driverStatus, open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('profile');
  const { detail, loading, error } = useDriverDetail(open ? driverId : null);
  const toast = useToast();
  const [creds, setCreds] = useState(null);
  const [credLoading, setCredLoading] = useState(false);

  const driver = detail?.driver ?? null;

  React.useEffect(() => { if (!open) setCreds(null); }, [open]);

  const createLogin = async () => {
    setCredLoading(true);
    try {
      const r = await driversApi.createDriverCredentials(driverId);
      setCreds(r);
      toast.success('Login created');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setCredLoading(false);
    }
  };

  const resetLogin = async () => {
    setCredLoading(true);
    try {
      const r = await driversApi.resetDriverPassword(driverId);
      setCreds({ username: driver?.contactNumber, password: r.password, role: 'Driver' });
      toast.success('Password reset');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setCredLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      width={720}
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TVAvatar name={driverName} size={36} />
          <div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{driverName}</div>
            <div style={{ marginTop: 4 }}><StatusBadge status={driverStatus} /></div>
          </div>
        </div>
      }
    >
      {loading && (
        <SkeletonTable rows={4} cols={2} />
      )}
      {!loading && error && (
        <ErrorBanner message={error} />
      )}
      {!loading && !error && driver && (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Tab list */}
          <Tabs.List style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            {['profile', 'trips', 'documents'].map((tab) => {
              const active = activeTab === tab;
              const labels = { profile: 'Profile', trips: 'Trip History', documents: 'Documents' };
              return (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  style={tabTriggerStyle(active)}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {labels[tab]}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {/* Profile tab */}
          <Tabs.Content value="profile">
            <SubCard title="Personal">
              <KVRow label="Full Name" value={driver.fullName} />
              <KVRow label="Contact" value={`${driver.countryDialCode || ''} ${driver.contactNumber}`} mono />
              <KVRow label="Emergency Contact" value={driver.emgContactNumber ? `${driver.emgCountryDialCode || ''} ${driver.emgContactNumber}` : null} mono />
              <KVRow label="Address" value={driver.address} />
            </SubCard>

            <SubCard title="KYC">
              <KVRow label="Aadhaar" value={maskAadhaar(driver.aadhaarNumber)} mono />
              <KVRow label="PAN" value={maskPAN(driver.panNumber)} mono />
              <div style={{ gridColumn: 'span 2' }}>
                <KVRow label="Driving Licence" value={driver.drivingLicenceNumber ? `DL ••••${driver.drivingLicenceNumber.slice(-4)}` : '—'} mono />
              </div>
            </SubCard>

            <SubCard title="Bank Account">
              <KVRow label="Account Holder" value={driver.accountHolderName} />
              <KVRow label="Account Number" value={maskAccount(driver.accountNumber)} mono />
              <KVRow label="Branch" value={driver.branchName} />
              <KVRow label="IFSC" value={driver.ifscCode} mono />
              <KVRow label="Account Type" value={driver.accountType ? driver.accountType.charAt(0).toUpperCase() + driver.accountType.slice(1) : '—'} />
            </SubCard>

            <SubCard title="App Login">
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!creds && (driver.userId ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Login enabled · username <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{driver.contactNumber}</span>
                    </span>
                    <LoadingButton className="btn-brand" loading={credLoading} onClick={resetLogin}>Reset Password</LoadingButton>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No app login yet for this driver.</span>
                    <LoadingButton className="btn-brand" loading={credLoading} onClick={createLogin}>Create Login</LoadingButton>
                  </div>
                ))}
                {creds && (
                  <div className="tv-card-flat" style={{ padding: '12px 14px', borderRadius: 6, border: '1px solid var(--success)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Share these with the driver:</div>
                    <div style={{ fontSize: 13 }}>Username: <b className="font-mono" style={{ color: 'var(--text-primary)' }}>{creds.username}</b></div>
                    <div style={{ fontSize: 13 }}>Password: <b className="font-mono" style={{ color: 'var(--text-primary)' }}>{creds.password}</b></div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                      They sign in to the Driver app with their phone number, then can change the password.
                    </div>
                  </div>
                )}
              </div>
            </SubCard>
          </Tabs.Content>

          {/* Trip History tab */}
          <Tabs.Content value="trips">
            <TripHistoryTab recentTrips={detail?.recentTrips} loading={false} />
          </Tabs.Content>

          {/* Documents tab */}
          <Tabs.Content value="documents">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
              <DocCard icon={CreditCard} label="Driving Licence" verified={true} />
              <DocCard icon={User} label="Aadhaar Card" verified={true} />
              <DocCard icon={CreditCard} label="PAN Card" verified={!!driver.panNumber} />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Modal>
  );
}

// ── Assign / change / remove a driver's vehicle ──
function AssignVehicleModal({ driver, onClose, onDone }) {
  const { assignVehicle } = useDriversActions();
  const toast = useToast();
  const [pick, setPick] = useState({ id: '', label: '', currentDriver: '', inTransit: false });
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { setPick({ id: '', label: '', currentDriver: '', inTransit: false }); }, [driver]);
  if (!driver) return null;
  const mine = driver.assignedVehicles ?? [];
  // A vehicle in transit keeps its driver until the trip is completed.
  const mineInTransit = mine.filter((v) => v.currentStatus === 'in_transit');
  const pickBlocked = pick.inTransit && pick.currentDriver && pick.currentDriver !== driver.fullName;

  async function save(vehicleId) {
    setBusy(true);
    try {
      const r = await assignVehicle(driver.id, vehicleId);
      toast.success(vehicleId
        ? `${pick.label} is now ${driver.fullName}'s${r.replacedDriverName ? ` (moved from ${r.replacedDriverName})` : ''}.${r.tripsUpdated ? ` ${r.tripsUpdated} waiting trip${r.tripsUpdated === 1 ? '' : 's'} now ${r.tripsUpdated === 1 ? 'has' : 'have'} this driver.` : ''}`
        : 'Vehicle removed');
      onDone();
    } catch (e) {
      toast.error(errMessage(e));
    } finally { setBusy(false); }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o && !busy) onClose(); }}
      width={460}
      title={`Vehicle for ${driver.fullName}`}
      footer={<LoadingButton className="btn-brand" loading={busy} onClick={() => save(pick.id)} disabled={!pick.id || pickBlocked}>Assign vehicle</LoadingButton>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {mine.length ? <>Now: <span className="font-mono">{mine.map((v) => v.vehicleNumber).join(', ')}</span>.</> : 'No vehicle is assigned yet.'}
          {' '}Trips that have not started and have no driver on the chosen vehicle will get this driver.
        </div>
        <AsyncSelect
          entity="vehicles"
          value={pick.id}
          valueLabel={pick.label}
          onChange={(v, opt) => setPick({ id: v, label: opt?.label ?? '', currentDriver: opt?.meta?.driverName ?? '', inTransit: opt?.meta?.status === 'in_transit' })}
          placeholder="Choose a vehicle"
          emptyLabel="No vehicles found"
        />
        {pick.currentDriver && pick.currentDriver !== driver.fullName && !pick.inTransit && (
          <div style={{ fontSize: 12, color: 'var(--warning)' }}>{pick.label} is currently {pick.currentDriver}&apos;s. It will move to {driver.fullName}.</div>
        )}
        {pickBlocked && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>{pick.label} is in transit with {pick.currentDriver}. Its driver can be changed once the trip is completed.</div>
        )}
        {mineInTransit.length > 0 && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--danger)' }}>
            {mineInTransit.map((v) => v.vehicleNumber).join(', ')} {mineInTransit.length === 1 ? 'is' : 'are'} in transit, so {mineInTransit.length === 1 ? 'it stays' : 'they stay'} with {driver.fullName} until the trip is completed.
          </div>
        )}
        {mine.length > 0 && (
          <button className="btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--danger)' }} disabled={busy || mineInTransit.length > 0} onClick={() => save(null)}>
            Remove {mine.length === 1 ? 'this vehicle' : 'all vehicles'} from {driver.fullName}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ──
export default function Drivers() {
  const { drivers, summary, loading, error, refetch, setFilters } = useDriversPage();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignDriver, setAssignDriver] = useState(null);
  const [search, setSearch] = useState('');

  const total     = summary.total     ?? 0;
  const available = summary.available ?? 0;
  const onTrip    = summary.inTransit ?? 0;
  const assigned  = summary.assigned  ?? 0;

  return (
    <div className="animate-fadeIn">
      {/* 1. Page Header */}
      <PageHeader
        title="DRIVERS"
        breadcrumbs={['Fleet', 'Drivers']}
        actions={
          <button className="btn-brand" onClick={() => setAddOpen(true)}>
            + Add Driver
          </button>
        }
      />

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Search (server-side: name / contact number) */}
      <div style={{ marginBottom: 16 }}>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setFilters({ search: v || undefined, page: 1 }); }}
          placeholder="Search drivers…"
        />
      </div>

      {/* 2. Stats row */}
      <div className="grid grid-cols-4 gap-4" style={{ marginTop: 20, marginBottom: 24 }}>
        <StatCard title="Total Drivers" accent="var(--teal)">
          <AnimatedNumber
            value={total}
            className="font-display"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}
          />
        </StatCard>

        <StatCard title="Available" accent="var(--success)">
          <AnimatedNumber
            value={available}
            className="font-display"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}
          />
        </StatCard>

        <StatCard title="On Trip" accent="var(--teal)">
          <AnimatedNumber
            value={onTrip}
            className="font-display"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)' }}
          />
        </StatCard>

        <StatCard title="Assigned" accent="var(--warning)">
          <AnimatedNumber
            value={assigned}
            className="font-display"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}
          />
        </StatCard>
      </div>

      {/* 3. Driver Cards grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : drivers.length === 0 ? (
        <div className="tv-card" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-dim)' }}>
          <div className="font-display" style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 4 }}>No drivers yet</div>
          <div style={{ fontSize: 13 }}>Click “+ Add Driver” to add your first driver.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {drivers.map((driver) => {
            const isInTransit = driver.currentStatus === 'in_transit';
            return (
              <Card
                key={driver.id}
                streak={isInTransit}
                style={{
                  borderLeft: `4px solid ${accentColor(driver.currentStatus)}`,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Header: Avatar + Name + Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TVAvatar name={driver.fullName} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="font-display"
                      style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {driver.fullName}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <StatusBadge status={driver.currentStatus} />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Contact */}
                  <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {driver.contactNumber}
                  </div>

                  {/* In-transit: on-trip indicator */}
                  {isInTransit && (
                    <div
                      className="motion-streak"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 3,
                        background: 'rgba(14,165,197,0.08)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <Route size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--teal)' }}>
                        On trip
                      </span>
                    </div>
                  )}

                  {/* The vehicle that belongs to this driver */}
                  <div style={{ fontSize: 12, color: driver.assignedVehicles?.length ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                    {driver.assignedVehicles?.length
                      ? <>Vehicle <span className="font-mono">{driver.assignedVehicles.map((v) => v.vehicleNumber).join(', ')}</span></>
                      : 'No vehicle assigned'}
                  </div>

                  {/* Licence masked (only when it has been added) */}
                  {driver.drivingLicenceNumber ? (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>DL ••••-{driver.drivingLicenceNumber.slice(-4)}</div>
                  ) : null}
                </div>

                {/* Footer: View Profile / Assign vehicle */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2, display: 'flex', gap: 16 }}>
                  <button
                    onClick={() => setSelectedDriver(driver)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    View Profile →
                  </button>
                  <button
                    onClick={() => setAssignDriver(driver)}
                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 150ms ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    {driver.assignedVehicles?.length ? 'Change vehicle' : 'Assign vehicle'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Driver Detail Modal */}
      {selectedDriver && (
        <DriverDetailModal
          driverId={selectedDriver.id}
          driverName={selectedDriver.fullName}
          driverStatus={selectedDriver.currentStatus}
          open={!!selectedDriver}
          onOpenChange={(open) => { if (!open) setSelectedDriver(null); }}
        />
      )}

      <AssignVehicleModal driver={assignDriver} onClose={() => setAssignDriver(null)} onDone={() => { setAssignDriver(null); refetch(); }} />

      {/* 5. Add Driver Modal */}
      <AddDriverModal open={addOpen} onOpenChange={setAddOpen} onCreated={refetch} />
    </div>
  );
}
