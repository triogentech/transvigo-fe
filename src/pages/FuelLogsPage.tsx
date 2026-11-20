// API CALLS: 1 (GET /api/pages/fuel-logs)
import React, { useEffect, useState } from 'react';
import { getSelect, type SelectOption } from '../api/select.api';
import { useFuelLogsPage } from '../hooks/pages/useFuelLogsPage';
import { useFuelLogsActions } from '../hooks/actions/useFuelLogsActions';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate, formatINR } from '../lib/utils.js';
import type { CreateFuelLogBody, FuelLog, FuelType } from '../types/api.types';
import { ErrorBanner, LoadingButton, SkeletonTable } from '../components/states';
import { SearchInput } from '../components/SearchInput';
import { AsyncSelect } from '../components/AsyncSelect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const TVSelect: React.FC<any> = UI.TVSelect;

interface FormState {
  fuelStationId: string;
  date: string;
  fuelType: FuelType;
  fuelQuantityLtr: string;
  rate: string;
  amount: string;
}

const EMPTY_FORM: FormState = {
  fuelStationId: '',
  date: '',
  fuelType: 'diesel',
  fuelQuantityLtr: '',
  rate: '',
  amount: '',
};

const FUEL_TYPE_OPTIONS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'gas', label: 'Gas' },
];

export default function FuelLogsPage() {
  const { fuelLogs, filterOptions, summary, loading, error, refetch, filters, setFilters } = useFuelLogsPage();
  const { createFuelLog } = useFuelLogsActions();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [stationTried, setStationTried] = useState(false);
  const [stations, setStations] = useState<SelectOption[]>([]);
  useEffect(() => { void getSelect('fuel-stations').then(setStations).catch(() => undefined); }, []);

  // Map vehicle id → display label (vehicle number) from the filter options,
  // so the table shows the vehicle number instead of the raw UUID.
  const vehicleNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    (filterOptions?.vehicles ?? []).forEach((o) => m.set(o.value, o.label));
    return m;
  }, [filterOptions]);

  const [search, setSearch] = useState('');
  const searchedRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fuelLogs;
    return fuelLogs.filter(
      (f) =>
        (f.fuelType ?? '').toLowerCase().includes(q) ||
        (f.vehicleId ? (vehicleNameById.get(f.vehicleId) ?? '').toLowerCase().includes(q) : false) ||
        shortDate(f.date).toLowerCase().includes(q),
    );
  }, [fuelLogs, search, vehicleNameById]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setStationTried(false);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.fuelStationId) { setStationTried(true); return toast.error('Select the fuel station vendor'); }
    setSubmitting(true);
    try {
      const body: CreateFuelLogBody = {
        fuelStationId: form.fuelStationId,
        date: form.date,
        fuelType: form.fuelType,
        fuelQuantityLtr: parseFloat(form.fuelQuantityLtr) || 0,
        rate: parseFloat(form.rate) || 0,
        amount: parseFloat(form.amount) || 0,
      };
      await createFuelLog(body);
      await refetch();
      toast.success('Fuel log created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: FuelLog) => shortDate(row.date),
    },
    { key: 'fuelType', header: 'Fuel Type' },
    {
      key: 'fuelStation',
      header: 'Fuel station vendor',
      render: (row: FuelLog) =>
        row.fuelStation ? (
          <span>{row.fuelStation.name} <span className="font-mono" style={{ color: 'var(--text-dim)' }}>· {row.fuelStation.vendorCode ?? ''}</span></span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: 'fuelQuantityLtr',
      header: 'Quantity',
      render: (row: FuelLog) => (
        <span className="font-mono">{row.fuelQuantityLtr} L</span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (row: FuelLog) => (
        <span className="font-mono">{formatINR(row.rate)}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: FuelLog) => (
        <span className="font-mono">{formatINR(row.amount)}</span>
      ),
    },
    {
      key: 'vehicleId',
      header: 'Vehicle',
      render: (row: FuelLog) =>
        row.vehicleId ? (
          <span className="font-mono">{vehicleNameById.get(row.vehicleId) ?? row.vehicleId}</span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Fuel Logs" breadcrumbs={['Operations', 'Fuel Logs']} />
        <SkeletonTable rows={8} cols={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Fuel Logs" breadcrumbs={['Operations', 'Fuel Logs']} />
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  const stationOptions = [
    { value: '', label: 'All Stations' },
    ...(filterOptions?.fuelStations ?? []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fuel Logs"
        breadcrumbs={['Operations', 'Fuel Logs']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Fuel Log
          </button>
        }
      />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="tv-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Litres</div>
            <div className="font-mono" style={{ fontSize: 22, marginTop: 6, color: 'var(--text-primary)' }}>{summary.totalLitres.toFixed(2)} L</div>
          </div>
          <div className="tv-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Cost</div>
            <div className="font-mono" style={{ fontSize: 22, marginTop: 6, color: 'var(--text-primary)' }}>{formatINR(summary.totalCost)}</div>
          </div>
          <div className="tv-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Rate / Litre</div>
            <div className="font-mono" style={{ fontSize: 22, marginTop: 6, color: 'var(--text-primary)' }}>{formatINR(summary.avgRatePerLitre)}</div>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search fuel logs…" />
        <div style={{ minWidth: 200 }}>
            <AsyncSelect
              entity="vehicles"
              value={(filters.vehicleId as string) ?? ''}
              valueLabel={vehicleNameById.get(filters.vehicleId as string) ?? ''}
              onChange={(v) => setFilters({ vehicleId: v || undefined, page: 1 })}
              placeholder="All Vehicles"
              clearable
              clearLabel="All Vehicles"
              emptyLabel="No vehicles found"
            />
          </div>
          {stationOptions.length > 1 && (
            <select
              className="tv-input"
              onChange={(e) => setFilters({ fuelStationId: e.target.value || undefined, page: 1 })}
            >
              {stationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
      </div>

      <DataTable
        columns={columns}
        data={searchedRows}
        loading={loading}
        emptyLabel="No fuel logs found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Fuel Log"
        footer={
          <LoadingButton
            className="btn-brand"
            loading={submitting}
            onClick={submit}
          >
            Save
          </LoadingButton>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Fuel station vendor <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              className="tv-input w-full"
              style={!form.fuelStationId && stationTried ? { borderColor: 'var(--danger)' } : undefined}
              value={form.fuelStationId}
              onChange={(e) => set('fuelStationId', e.target.value)}
            >
              <option value="">Select fuel station</option>
              {stations.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
            {!form.fuelStationId && stationTried && <div role="alert" style={{ marginTop: 5, fontSize: 12, color: 'var(--danger)' }}>Select the fuel station vendor.</div>}
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-dim)' }}>Not in the list? Add it on the <a href="/vendors" style={{ color: 'var(--teal)' }}>Vendors</a> page (type: Fuel station vendor).</div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Date
            </label>
            <input
              type="date"
              className="tv-input w-full"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Fuel Type
            </label>
            <TVSelect
              value={form.fuelType}
              onValueChange={(v: FuelType) => set('fuelType', v)}
              options={FUEL_TYPE_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Quantity (L)
              </label>
              <input
                type="number"
                className="tv-input w-full"
                value={form.fuelQuantityLtr}
                onChange={(e) => set('fuelQuantityLtr', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Rate (₹)
              </label>
              <input
                type="number"
                className="tv-input w-full"
                value={form.rate}
                onChange={(e) => set('rate', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                className="tv-input w-full"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
