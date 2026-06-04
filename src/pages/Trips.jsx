// ── SECTION: Trips Page ──
import React, { useState, useMemo, useEffect } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  Plus, Filter, ArrowRight, MoreHorizontal, CheckCircle2,
  FileText, MapPin, Truck, User,
} from 'lucide-react';

import {
  PageHeader, SegmentTabs, DataTable, Modal, TVSelect, TVSwitch,
  TVAvatar, StatusBadge, Pill, Menu, MenuItem, MenuLabel, MenuSeparator,
  Popover, useToast,
} from '../components/ui.jsx';
import { SkeletonTable, ErrorBanner, EmptyState, LoadingButton } from '../components/states.tsx';
import { cx, formatINR, relTime, dateTime, shortDate } from '../lib/utils.js';
import { useTripsPage } from '../hooks/useTripsPage.ts';
import { getTripDetailPage } from '../api/pages.api.ts';
import { createTrip as apiCreateTrip, updateTripStatus as apiUpdateTripStatus, deleteTrip as apiDeleteTrip } from '../api/trips.api.ts';
import { errMessage } from '../api/client.ts';

// ── FilterPopover ──
function FilterPopover({ filters, onApply, onReset, allDrivers, allVehicles, allLoadProviders }) {
  const [local, setLocal] = useState({
    status: filters.status || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    driverId: filters.driverId || '',
    vehicleId: filters.vehicleId || '',
    loadProviderId: filters.loadProviderId || '',
  });
  const set = (k, v) => setLocal((f) => ({ ...f, [k]: v }));

  const inputStyle = {
    background: 'var(--navy-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '4px 8px',
    borderRadius: 4,
    width: '100%',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    outline: 'none',
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'created', label: 'Created' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'completed', label: 'Completed' },
  ];

  const DRIVER_OPTIONS = [
    { value: '', label: 'All Drivers' },
    ...(allDrivers ?? []),
  ];
  const VEHICLE_OPTIONS = [
    { value: '', label: 'All Vehicles' },
    ...(allVehicles ?? []),
  ];
  const PROVIDER_OPTIONS = [
    { value: '', label: 'All Providers' },
    ...(allLoadProviders ?? []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Filters</div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
        <TVSelect
          value={local.status}
          onValueChange={(v) => set('status', v)}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-full"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>From Date</div>
          <input
            type="date"
            value={local.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>To Date</div>
          <input
            type="date"
            value={local.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Driver</div>
        <TVSelect
          value={local.driverId}
          onValueChange={(v) => set('driverId', v)}
          options={DRIVER_OPTIONS}
          placeholder="All Drivers"
          className="w-full"
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Vehicle</div>
        <TVSelect
          value={local.vehicleId}
          onValueChange={(v) => set('vehicleId', v)}
          options={VEHICLE_OPTIONS}
          placeholder="All Vehicles"
          className="w-full"
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Load Provider</div>
        <TVSelect
          value={local.loadProviderId}
          onValueChange={(v) => set('loadProviderId', v)}
          options={PROVIDER_OPTIONS}
          placeholder="All Providers"
          className="w-full"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          className="btn-teal px-3 py-1.5"
          style={{ fontSize: 13, flex: 1 }}
          onClick={() => onApply(local)}
        >
          Apply Filters
        </button>
        <button
          className="btn-ghost px-3 py-1.5"
          style={{ fontSize: 13 }}
          onClick={() => {
            const reset = { status: '', dateFrom: '', dateTo: '', driverId: '', vehicleId: '', loadProviderId: '' };
            setLocal(reset);
            onReset();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ── CreateTripModal ──
function CreateTripModal({ open, onOpenChange, createTrip, allDrivers, allVehicles, allLoadProviders }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [touchingLocations, setTouchingLocations] = useState(false);
  const [locations, setLocations] = useState(['']);
  const [form, setForm] = useState({
    start: '', end: '', estStart: '', estEnd: '', distance: '', duration: '',
    driverId: '', vehicleId: '', loadProviderId: '', freight: '', advance: '',
    vendorCode: '', vendorName: '',
  });

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addLocation = () => setLocations((l) => [...l, '']);
  const removeLocation = (i) => setLocations((l) => l.filter((_, idx) => idx !== i));
  const updateLocation = (i, v) => setLocations((l) => l.map((x, idx) => idx === i ? v : x));

  const selectedDriver = (allDrivers ?? []).find((d) => d.value === form.driverId) || null;
  const selectedVehicle = (allVehicles ?? []).find((v) => v.value === form.vehicleId) || null;
  const selectedProvider = (allLoadProviders ?? []).find((p) => p.value === form.loadProviderId) || null;

  const inputStyle = {
    background: 'var(--navy-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '7px 10px',
    borderRadius: 4,
    width: '100%',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    outline: 'none',
  };

  const labelStyle = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };

  function resetForm() {
    setStep(1);
    setForm({ start: '', end: '', estStart: '', estEnd: '', distance: '', duration: '', driverId: '', vehicleId: '', loadProviderId: '', freight: '', advance: '', vendorCode: '', vendorName: '' });
    setTouchingLocations(false);
    setLocations(['']);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const body = {
        startPoint: form.start,
        endPoint: form.end,
        estimatedStartTime: form.estStart ? new Date(form.estStart).toISOString() : new Date().toISOString(),
        estimatedEndTime: form.estEnd ? new Date(form.estEnd).toISOString() : new Date().toISOString(),
        totalTripDistanceKm: Number(form.distance) || 0,
        totalTripTimeMinutes: Number(form.duration) || 0,
        freightTotalAmount: Number(form.freight) || 0,
        advanceAmount: form.advance ? Number(form.advance) : undefined,
        vendorCode: form.vendorCode || undefined,
        vendorName: form.vendorName || undefined,
        driverId: form.driverId || undefined,
        vehicleId: form.vehicleId || undefined,
        loadProviderId: form.loadProviderId || undefined,
        isTouchingLocationAvailable: touchingLocations,
        touchingLocations: touchingLocations
          ? locations.filter(Boolean).map((name, i) => ({ name, sequence: i + 1 }))
          : undefined,
      };
      await createTrip(body);
      toast({
        title: 'Trip created',
        description: `${form.start || 'Origin'} → ${form.end || 'Destination'} scheduled`,
        icon: <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />,
        color: 'var(--success)',
      });
      onOpenChange(false);
      setTimeout(resetForm, 300);
    } catch (e) {
      toast({ title: 'Failed to create trip', description: errMessage(e), color: 'var(--danger)' });
    } finally {
      setSubmitting(false);
    }
  }

  // Progress dots
  const Dots = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: s === step ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: s === step ? 'var(--teal)' : s < step ? 'var(--teal-dim)' : 'var(--navy-light)',
            transition: 'all 200ms ease',
          }}
        />
      ))}
    </div>
  );

  const stepLabel = ['Route & Schedule', 'Assignment', 'Review'][step - 1];

  const DRIVER_OPTIONS_MODAL = [
    { value: '', label: 'Select Driver' },
    ...(allDrivers ?? []),
  ];
  const VEHICLE_OPTIONS_MODAL = [
    { value: '', label: 'Select Vehicle' },
    ...(allVehicles ?? []),
  ];
  const PROVIDER_OPTIONS_MODAL = [
    { value: '', label: 'Select Provider' },
    ...(allLoadProviders ?? []),
  ];

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(resetForm, 300); }}
      width={640}
      title={`New Trip — ${stepLabel}`}
      footer={
        <>
          {step > 1 && (
            <button className="btn-ghost px-4 py-1.5" style={{ fontSize: 13 }} onClick={() => setStep((s) => s - 1)} disabled={submitting}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button className="btn-brand px-4 py-1.5" style={{ fontSize: 13 }} onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <LoadingButton
              loading={submitting}
              className="btn-brand px-4 py-1.5"
              style={{ fontSize: 13 }}
              onClick={handleConfirm}
            >
              Confirm &amp; Create Trip
            </LoadingButton>
          )}
        </>
      }
    >
      <Dots />

      {/* Step 1: Route & Schedule */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Point <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Mumbai" value={form.start} onChange={(e) => setF('start', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>End Point <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Pune" value={form.end} onChange={(e) => setF('end', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Est. Start</label>
              <input type="datetime-local" style={inputStyle} value={form.estStart} onChange={(e) => setF('estStart', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Est. End</label>
              <input type="datetime-local" style={inputStyle} value={form.estEnd} onChange={(e) => setF('estEnd', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Distance (km)</label>
              <input type="number" style={inputStyle} placeholder="e.g. 148" value={form.distance} onChange={(e) => setF('distance', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input type="number" style={inputStyle} placeholder="e.g. 210" value={form.duration} onChange={(e) => setF('duration', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TVSwitch checked={touchingLocations} onCheckedChange={setTouchingLocations} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Touching Locations</span>
          </div>

          {touchingLocations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {locations.map((loc, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder={`Stop ${i + 1}`}
                    value={loc}
                    onChange={(e) => updateLocation(i, e.target.value)}
                  />
                  {locations.length > 1 && (
                    <button
                      className="btn-ghost px-2"
                      style={{ fontSize: 12, color: 'var(--danger)' }}
                      onClick={() => removeLocation(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                className="btn-ghost px-3 py-1"
                style={{ fontSize: 12, alignSelf: 'flex-start' }}
                onClick={addLocation}
              >
                + Add Stop
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Assignment */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Driver <span style={{ color: 'var(--danger)' }}>*</span></label>
            <TVSelect
              value={form.driverId}
              onValueChange={(v) => setF('driverId', v)}
              placeholder="Select Driver"
              options={DRIVER_OPTIONS_MODAL}
            />
          </div>

          <div>
            <label style={labelStyle}>Vehicle <span style={{ color: 'var(--danger)' }}>*</span></label>
            <TVSelect
              value={form.vehicleId}
              onValueChange={(v) => setF('vehicleId', v)}
              placeholder="Select Vehicle"
              options={VEHICLE_OPTIONS_MODAL}
            />
          </div>

          <div>
            <label style={labelStyle}>Load Provider</label>
            <TVSelect
              value={form.loadProviderId}
              onValueChange={(v) => setF('loadProviderId', v)}
              placeholder="Select Provider"
              options={PROVIDER_OPTIONS_MODAL}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Freight (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="number" style={inputStyle} placeholder="0" value={form.freight} onChange={(e) => setF('freight', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Advance (₹)</label>
              <input type="number" style={inputStyle} placeholder="0" value={form.advance} onChange={(e) => setF('advance', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Vendor Code <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>(optional)</span></label>
              <input style={inputStyle} placeholder="e.g. ML-2026-001" value={form.vendorCode} onChange={(e) => setF('vendorCode', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Vendor Name <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>(optional)</span></label>
              <input style={inputStyle} placeholder="e.g. Acme Freight" value={form.vendorName} onChange={(e) => setF('vendorName', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Route Summary */}
          <div className="tv-card-flat" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Route</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MapPin size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <span className="font-display" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                {form.start || '—'} <ArrowRight size={13} style={{ display: 'inline', color: 'var(--teal)' }} /> {form.end || '—'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
              <div><span style={{ color: 'var(--text-dim)' }}>Distance: </span><span className="font-mono" style={{ color: 'var(--text-muted)' }}>{form.distance ? `${form.distance} km` : '—'}</span></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Duration: </span><span className="font-mono" style={{ color: 'var(--text-muted)' }}>{form.duration ? `${form.duration} min` : '—'}</span></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Stops: </span><span className="font-mono" style={{ color: 'var(--text-muted)' }}>{touchingLocations ? locations.filter(Boolean).length : 0}</span></div>
            </div>
            {form.estStart && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>Est. Start: </span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(form.estStart).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          <div className="tv-card-flat" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Assignment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={13} style={{ color: 'var(--teal)' }} />
                <span style={{ color: 'var(--text-muted)' }}>{selectedDriver?.label || <span style={{ color: 'var(--text-dim)' }}>No driver</span>}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={13} style={{ color: 'var(--teal)' }} />
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{selectedVehicle?.label || <span style={{ color: 'var(--text-dim)' }}>No vehicle</span>}</span>
              </div>
            </div>
            {selectedProvider && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Provider: {selectedProvider.label}
              </div>
            )}
          </div>

          {/* Commercial Summary */}
          <div className="tv-card-flat" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Commercial</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Freight</div>
                <div className="font-mono" style={{ fontSize: 15, color: 'var(--teal)', marginTop: 2 }}>
                  {form.freight ? formatINR(Number(form.freight)) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Advance</div>
                <div className="font-mono" style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 2 }}>
                  {form.advance ? formatINR(Number(form.advance)) : '—'}
                </div>
              </div>
            </div>
            {form.vendorCode && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Vendor: {form.vendorCode}{form.vendorName ? ` — ${form.vendorName}` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── TripDetailModal ──
function TripDetailModal({ tripId, open, onOpenChange }) {
  const [detail, setDetail] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');

  useEffect(() => {
    if (!open || !tripId) { setDetail(null); return; }
    setTripLoading(true);
    setTripError(null);
    getTripDetailPage(tripId)
      .then((res) => { setDetail(res); setTripLoading(false); })
      .catch((e) => { setTripError(errMessage(e, 'Failed to load trip')); setTripLoading(false); });
  }, [open, tripId]);

  const trip = detail?.trip ?? null;
  const tripTxns = detail?.transactions ?? [];
  const totalDebit = tripTxns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredit = tripTxns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);

  const txnCols = [
    { key: 'date', header: 'Date', render: (r) => <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{shortDate(r.createdAt)}</span> },
    { key: 'category', header: 'Category', render: (r) => <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r.txnTowards}</span> },
    { key: 'desc', header: 'Description', render: (r) => <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{r.description}</span> },
    { key: 'type', header: 'Type', render: (r) => <span style={{ fontSize: 12, color: r.type === 'credit' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{r.type}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-mono" style={{ fontSize: 12, color: r.type === 'credit' ? 'var(--success)' : 'var(--text-primary)' }}>{r.type === 'credit' ? '+' : '-'}{formatINR(r.amount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.transactionStatus} /> },
  ];

  // Timeline nodes
  const timelineNodes = trip ? [
    { label: 'Created', ts: trip.createdAt, done: true },
    { label: 'In Transit', ts: trip.currentStatus !== 'created' ? trip.estimatedStartTime : null, done: trip.currentStatus === 'in_transit' || trip.currentStatus === 'completed' },
    { label: 'Completed', ts: trip.actualEndTime, done: trip.currentStatus === 'completed' },
  ] : [];

  const DETAIL_TABS = ['overview', 'timeline', 'expenses', 'documents'];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      width={800}
      header={
        trip ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="font-mono font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{trip.tripNumber}</span>
            <StatusBadge status={trip.currentStatus} />
          </div>
        ) : <span style={{ fontSize: 16, color: 'var(--text-dim)' }}>Trip Details</span>
      }
    >
      {tripLoading && (
        <div style={{ padding: '32px 0' }}>
          <SkeletonTable rows={4} cols={3} />
        </div>
      )}
      {tripError && <ErrorBanner message={tripError} />}
      {!tripLoading && !tripError && trip && (
        <TabsPrimitive.Root value={detailTab} onValueChange={setDetailTab}>
          <TabsPrimitive.List
            style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}
          >
            {DETAIL_TABS.map((tab) => {
              const isActive = detailTab === tab;
              return (
                <TabsPrimitive.Trigger
                  key={tab}
                  value={tab}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                    color: isActive ? 'var(--teal)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    marginBottom: -1,
                    textTransform: 'capitalize',
                    transition: 'color 120ms',
                  }}
                >
                  {tab}
                </TabsPrimitive.Trigger>
              );
            })}
          </TabsPrimitive.List>

          {/* Overview */}
          <TabsPrimitive.Content value="overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Route Card */}
                <div className="tv-card-flat" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Route</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <MapPin size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <span className="font-display" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                      {trip.startPoint} <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--teal)' }} /> {trip.endPoint}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Distance</div>
                      <div className="font-mono" style={{ color: 'var(--text-muted)', marginTop: 2 }}>{trip.totalTripDistanceKm} km</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Duration</div>
                      <div className="font-mono" style={{ color: 'var(--text-muted)', marginTop: 2 }}>{Math.floor(trip.totalTripTimeMinutes / 60)}h {trip.totalTripTimeMinutes % 60}m</div>
                    </div>
                  </div>
                  {trip.touchingLocations && trip.touchingLocations.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 4 }}>Stopping Points</div>
                      {trip.touchingLocations.map((loc) => (
                        <div key={loc.id} style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{loc.sequence}. {loc.name || '—'}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Driver Card */}
                <div className="tv-card-flat" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Driver</div>
                  {trip.driver ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <TVAvatar name={trip.driver.fullName} size={36} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{trip.driver.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{trip.driver.contactNumber}</div>
                      </div>
                      <StatusBadge status={trip.driver.currentStatus} />
                    </div>
                  ) : <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Unassigned</span>}
                </div>

                {/* Vehicle Card */}
                <div className="tv-card-flat" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Vehicle</div>
                  {trip.vehicle ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--navy-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={18} style={{ color: 'var(--teal)' }} />
                      </div>
                      <div>
                        <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{trip.vehicle.vehicleNumber}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{trip.vehicle.model}</div>
                      </div>
                      <StatusBadge status={trip.vehicle.currentStatus} />
                    </div>
                  ) : <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Unassigned</span>}
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Commercial Card */}
                <div className="tv-card-flat" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Commercial</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Freight</div>
                      <div className="font-mono" style={{ fontSize: 16, color: 'var(--teal)', marginTop: 3 }}>{formatINR(trip.freightTotalAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Advance</div>
                      <div className="font-mono" style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 3 }}>{formatINR(trip.advanceAmount)}</div>
                    </div>
                  </div>
                  {trip.loadProvider && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                      Provider: {trip.loadProvider.name}
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                    Created {shortDate(trip.createdAt)}
                  </div>
                </div>

                {/* Metrics Card */}
                <div className="tv-card-flat" style={{ padding: 14 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)', marginBottom: 8 }}>Metrics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Transactions</div>
                      <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: 2, fontSize: 14 }}>{tripTxns.length}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Total Debit</div>
                      <div className="font-mono" style={{ color: 'var(--danger)', marginTop: 2 }}>{formatINR(totalDebit)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Total Credit</div>
                      <div className="font-mono" style={{ color: 'var(--success)', marginTop: 2 }}>{formatINR(totalCredit)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsPrimitive.Content>

          {/* Timeline */}
          <TabsPrimitive.Content value="timeline">
            <div style={{ padding: '8px 0 16px', maxWidth: 420 }}>
              {timelineNodes.map((node, i) => {
                const isLast = i === timelineNodes.length - 1;
                const nextDone = i < timelineNodes.length - 1 && timelineNodes[i + 1].done;
                return (
                  <div key={node.label} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 99,
                          background: node.done ? 'var(--teal)' : 'var(--navy-light)',
                          border: `2px solid ${node.done ? 'var(--teal)' : 'var(--border)'}`,
                          flexShrink: 0,
                          marginTop: 4,
                          zIndex: 1,
                        }}
                      />
                      {!isLast && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 32,
                            background: nextDone ? 'var(--teal)' : 'var(--border)',
                            margin: '4px 0',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
                      <div className="font-display" style={{ fontSize: 14, color: node.done ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                        {node.label}
                      </div>
                      {node.ts ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{dateTime(node.ts)}</div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Pending</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsPrimitive.Content>

          {/* Expenses */}
          <TabsPrimitive.Content value="expenses">
            {tripTxns.length === 0 ? (
              <EmptyState title="No transactions" description="No transactions linked to this trip yet." />
            ) : (
              <>
                <DataTable columns={txnCols} data={tripTxns} pageSize={5} />
                <div style={{ display: 'flex', gap: 24, marginTop: 12, padding: '10px 12px', background: 'var(--navy-dark)', borderRadius: 4, fontSize: 13 }}>
                  <div><span style={{ color: 'var(--text-dim)' }}>Total Debit: </span><span className="font-mono" style={{ color: 'var(--danger)' }}>{formatINR(totalDebit)}</span></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Total Credit: </span><span className="font-mono" style={{ color: 'var(--success)' }}>{formatINR(totalCredit)}</span></div>
                </div>
              </>
            )}
          </TabsPrimitive.Content>

          {/* Documents */}
          <TabsPrimitive.Content value="documents">
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 8,
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                margin: '8px 0',
              }}
            >
              <FileText size={32} style={{ color: 'var(--text-dim)' }} />
              <div className="font-display" style={{ fontSize: 15, color: 'var(--text-muted)' }}>Document management coming soon</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Upload &amp; manage trip documents, PODs, and invoices here.</div>
            </div>
          </TabsPrimitive.Content>
        </TabsPrimitive.Root>
      )}
    </Modal>
  );
}

// ── Trips (main page) ──
export default function Trips() {
  const toast = useToast();

  const {
    trips, meta, filterOptions, statusCounts, loading, error, filters, setFilters, refetch,
  } = useTripsPage();

  const allDrivers = filterOptions?.drivers ?? [];
  const allVehicles = filterOptions?.vehicles ?? [];
  const allLoadProviders = filterOptions?.loadProviders ?? [];

  // Tab state (mirrors filters.status)
  const [activeTab, setActiveTab] = useState('all');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Cancel confirm state
  const [cancelTrip, setCancelTrip] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  function openDetail(trip) {
    setSelectedTripId(trip.id);
    setDetailOpen(true);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setFilters({ ...filters, status: tab === 'all' ? undefined : tab, page: 1 });
  }

  const counts = {
    all: statusCounts?.all ?? 0,
    created: statusCounts?.created ?? 0,
    in_transit: statusCounts?.inTransit ?? 0,
    completed: statusCounts?.completed ?? 0,
  };

  const hasFilters = !!(filters.status || filters.dateFrom || filters.dateTo || filters.driverId || filters.vehicleId || filters.loadProviderId);

  async function handleMarkInTransit(trip) {
    try {
      await apiUpdateTripStatus(trip.id, 'in_transit');
      toast({ title: 'Status updated', description: `${trip.tripNumber} is now In Transit`, color: 'var(--teal)', icon: <CheckCircle2 size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} /> });
      await refetch();
    } catch (e) {
      toast({ title: 'Update failed', description: errMessage(e), color: 'var(--danger)' });
    }
  }

  async function handleMarkCompleted(trip) {
    try {
      await apiUpdateTripStatus(trip.id, 'completed');
      toast({ title: 'Trip completed', description: `${trip.tripNumber} marked as Completed`, color: 'var(--success)', icon: <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} /> });
      await refetch();
    } catch (e) {
      toast({ title: 'Update failed', description: errMessage(e), color: 'var(--danger)' });
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTrip) return;
    setCancelling(true);
    try {
      await apiDeleteTrip(cancelTrip.id);
      toast({
        title: 'Trip cancelled',
        description: `${cancelTrip.tripNumber} has been cancelled`,
        color: 'var(--danger)',
        icon: <CheckCircle2 size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />,
      });
      setCancelTrip(null);
      await refetch();
    } catch (e) {
      toast({ title: 'Cancel failed', description: errMessage(e), color: 'var(--danger)' });
    } finally {
      setCancelling(false);
    }
  }

  // Table columns
  const columns = [
    {
      key: 'tripNumber',
      header: 'Trip #',
      width: 170,
      render: (row) => (
        <button
          className="font-mono"
          style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={(e) => { e.stopPropagation(); openDetail(row); }}
        >
          {row.tripNumber}
        </button>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-primary)' }}>
          {row.startPoint}
          <ArrowRight size={12} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          {row.endPoint}
        </span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (row) => row.driver ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <TVAvatar name={row.driver.fullName} size={24} />
          <span style={{ color: 'var(--text-primary)' }}>{row.driver.fullName}</span>
        </span>
      ) : <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>—</span>,
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => row.vehicle
        ? <Pill color="var(--teal)"><span className="font-mono">{row.vehicle.vehicleNumber}</span></Pill>
        : <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>—</span>,
    },
    {
      key: 'loadProvider',
      header: 'Load Provider',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.loadProvider?.name || '—'}</span>,
    },
    {
      key: 'currentStatus',
      header: 'Status',
      render: (row) => <StatusBadge status={row.currentStatus} />,
    },
    {
      key: 'freightTotalAmount',
      header: 'Freight',
      align: 'right',
      render: (row) => <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{formatINR(row.freightTotalAmount)}</span>,
    },
    {
      key: 'advanceAmount',
      header: 'Advance',
      align: 'right',
      render: (row) => <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatINR(row.advanceAmount)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{relTime(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 44,
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Menu
            trigger={
              <button className="btn-ghost p-1.5" style={{ color: 'var(--text-dim)' }}>
                <MoreHorizontal size={15} />
              </button>
            }
          >
            <MenuItem onSelect={() => openDetail(row)}>View Details</MenuItem>
            <MenuLabel>Status</MenuLabel>
            {row.currentStatus === 'created' && (
              <MenuItem onSelect={() => handleMarkInTransit(row)}>
                Mark In Transit
              </MenuItem>
            )}
            {row.currentStatus === 'in_transit' && (
              <MenuItem onSelect={() => handleMarkCompleted(row)}>
                Mark Completed
              </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem danger onSelect={() => setCancelTrip(row)}>
              Cancel Trip
            </MenuItem>
          </Menu>
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* PageHeader */}
      <PageHeader
        title="TRIPS"
        breadcrumbs={['Operations', 'Trips']}
        actions={
          <>
            <Popover
              width={300}
              trigger={
                <button className="btn-ghost px-3 py-1.5 flex items-center gap-2" style={{ fontSize: 13 }}>
                  <Filter size={14} />
                  Filters
                  {hasFilters && (
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--teal)', display: 'inline-block' }} />
                  )}
                </button>
              }
            >
              <FilterPopover
                filters={filters}
                allDrivers={allDrivers}
                allVehicles={allVehicles}
                allLoadProviders={allLoadProviders}
                onApply={(f) => setFilters({
                  ...filters,
                  status: f.status || undefined,
                  dateFrom: f.dateFrom || undefined,
                  dateTo: f.dateTo || undefined,
                  driverId: f.driverId || undefined,
                  vehicleId: f.vehicleId || undefined,
                  loadProviderId: f.loadProviderId || undefined,
                  page: 1,
                })}
                onReset={() => {
                  setActiveTab('all');
                  setFilters({ page: 1, pageSize: filters.pageSize ?? 10 });
                }}
              />
            </Popover>

            <button
              className="btn-brand px-3 py-1.5 flex items-center gap-2"
              style={{ fontSize: 13 }}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} />
              New Trip
            </button>
          </>
        }
      />

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Status Tabs */}
      <SegmentTabs
        value={activeTab}
        onValueChange={handleTabChange}
        tabs={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'created', label: 'Created', count: counts.created },
          { value: 'in_transit', label: 'In Transit', count: counts.in_transit },
          { value: 'completed', label: 'Completed', count: counts.completed },
        ]}
      />

      {/* Trips DataTable */}
      {loading ? (
        <SkeletonTable rows={8} cols={columns.length} />
      ) : trips.length === 0 && !error ? (
        <EmptyState title="No trips found" description="Create a new trip or adjust your filters." />
      ) : (
        <DataTable
          columns={columns}
          data={trips}
          onRowClick={openDetail}
          rowClassName={(row) =>
            cx(
              row.currentStatus === 'in_transit' && 'motion-streak',
              row.currentStatus === 'completed' && 'opacity-60',
            )
          }
          emptyLabel="No trips found"
          pageSize={filters.pageSize ?? 10}
          paginate={false}
        />
      )}

      {/* Pagination */}
      {!loading && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-1" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          <span className="font-mono">{meta.total} total</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost px-3 py-1"
              style={{ fontSize: 12 }}
              disabled={meta.page <= 1}
              onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
            >
              Prev
            </button>
            <span className="font-mono">{meta.page} / {meta.totalPages}</span>
            <button
              className="btn-ghost px-3 py-1"
              style={{ fontSize: 12 }}
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
            >
              Next
            </button>
          </div>
          <TVSelect
            small
            value={String(filters.pageSize ?? 10)}
            onValueChange={(v) => setFilters({ ...filters, pageSize: Number(v), page: 1 })}
            options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
          />
        </div>
      )}

      {/* Create Trip Modal */}
      <CreateTripModal
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) void refetch();
        }}
        createTrip={apiCreateTrip}
        allDrivers={allDrivers}
        allVehicles={allVehicles}
        allLoadProviders={allLoadProviders}
      />

      {/* Trip Detail Modal */}
      <TripDetailModal tripId={selectedTripId} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Cancel Trip — controlled AlertDialog */}
      <AlertDialog.Root open={!!cancelTrip} onOpenChange={(open) => { if (!open) setCancelTrip(null); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="radix-overlay" />
          <AlertDialog.Content
            className="radix-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] p-5"
            style={{ width: 'min(420px, calc(100vw - 32px))', background: 'var(--navy-mid)', border: '1px solid var(--border-hover)', borderRadius: 4 }}
          >
            <AlertDialog.Title className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
              Cancel Trip
            </AlertDialog.Title>
            <AlertDialog.Description style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Cancel trip <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{cancelTrip?.tripNumber}</span>
              {cancelTrip && ` (${cancelTrip.startPoint} → ${cancelTrip.endPoint})`}? This action cannot be undone.
            </AlertDialog.Description>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <AlertDialog.Cancel asChild>
                <button className="btn-ghost px-3 py-1.5" style={{ fontSize: 13 }} disabled={cancelling}>Keep Trip</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <LoadingButton
                  loading={cancelling}
                  style={{ fontSize: 13, background: 'var(--danger)', color: '#fff', borderRadius: 4, fontFamily: 'var(--font-display)', fontWeight: 600, padding: '6px 12px' }}
                  onClick={handleCancelConfirm}
                >
                  Cancel Trip
                </LoadingButton>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
