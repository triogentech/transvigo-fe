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
  accountHolderName: '', accountNumber: '', branchName: '', ifscCode: '', accountType: 'savings',
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

  const REQUIRED = [
    'fullName', 'contactNumber', 'emgContactNumber', 'address', 'aadhaarNumber',
    'drivingLicenceNumber', 'accountHolderName', 'accountNumber', 'branchName', 'ifscCode',
  ];

  const submit = async () => {
    for (const k of REQUIRED) {
      if (!String(form[k]).trim()) { toast.error('Please fill all required fields'); return; }
    }
    setSubmitting(true);
    try {
      await createDriver({
        fullName: form.fullName.trim(),
        countryDialCode: form.countryDialCode || '+91',
        contactNumber: form.contactNumber.trim(),
        emgCountryDialCode: form.emgCountryDialCode || '+91',
        emgContactNumber: form.emgContactNumber.trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
        panNumber: form.panNumber.trim() || undefined,
        address: form.address.trim(),
        reference: form.reference.trim() || undefined,
        drivingLicenceNumber: form.drivingLicenceNumber.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        branchName: form.branchName.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        accountType: form.accountType,
      });
      toast.success('Driver added');
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
      footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save Driver</LoadingButton>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        <Field label="Full Name *" span>{input('fullName', 'Driver full name')}</Field>
        <Field label="Contact Number *">{input('contactNumber', '9876543210', true)}</Field>
        <Field label="Emergency Contact *">{input('emgContactNumber', '9876543210', true)}</Field>
        <Field label="Address *" span>{input('address', 'Residential address')}</Field>
        <Field label="Aadhaar Number *">{input('aadhaarNumber', '1234 5678 9012', true)}</Field>
        <Field label="PAN (optional)">{input('panNumber', 'ABCDE1234F', true)}</Field>
        <Field label="Driving Licence *" span>{input('drivingLicenceNumber', 'DL number', true)}</Field>
        <Field label="Account Holder *">{input('accountHolderName', 'As per bank')}</Field>
        <Field label="Account Number *">{input('accountNumber', 'Bank account no.', true)}</Field>
        <Field label="Branch *">{input('branchName', 'Branch name')}</Field>
        <Field label="IFSC *">{input('ifscCode', 'SBIN0001234', true)}</Field>
        <Field label="Account Type *">
          <TVSelect value={form.accountType} onValueChange={(v) => set('accountType', v)} options={ACCOUNT_TYPES} />
        </Field>
        <Field label="Reference (optional)">{input('reference', 'Referred by')}</Field>
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
              <KVRow label="Emergency Contact" value={`${driver.emgCountryDialCode || ''} ${driver.emgContactNumber}`} mono />
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

// ── Main Page ──
export default function Drivers() {
  const { drivers, summary, loading, error, refetch, setFilters } = useDriversPage();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
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

                  {/* Licence masked */}
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    DL ••••-{driver.drivingLicenceNumber ? driver.drivingLicenceNumber.slice(-4) : '••••'}
                  </div>
                </div>

                {/* Footer: View Profile */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
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

      {/* 5. Add Driver Modal */}
      <AddDriverModal open={addOpen} onOpenChange={setAddOpen} onCreated={refetch} />
    </div>
  );
}
