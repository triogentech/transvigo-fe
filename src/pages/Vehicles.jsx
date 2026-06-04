// API CALLS: 1 (GET /api/pages/vehicles) + lazy detail + mutations
import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Eye, Link2, Pencil, MoreVertical } from 'lucide-react';
import {
  Card, PageHeader, StatusBadge, TVProgress, TVTooltip, SegmentTabs,
  DataTable, Modal, TVSelect, Menu, MenuItem,
} from '../components/ui.jsx';
import { LoadingButton, SkeletonGrid, SkeletonTable, ErrorBanner } from '../components/states';
import { cx } from '../lib/utils.js';
import { formatNum, daysUntil, shortDate, expiryColor } from '../lib/utils.js';
import { useVehiclesPage } from '../hooks/pages/useVehiclesPage';
import { useVehiclesActions } from '../hooks/actions/useVehiclesActions';
import { getSelect } from '../api/select.api';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';

// ── Progress color from compliance % ──
function complianceColor(pct) {
  if (pct > 70)  return 'var(--success)';
  if (pct >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

// ── Status top strip style ──
function statusStripStyle(status) {
  if (status === 'in_transit') return { borderTop: '3px solid var(--accent-teal)' };
  if (status === 'assigned')   return { borderTop: '3px solid var(--accent-green)' };
  return { borderTop: '3px solid var(--border-strong)' };
}

// ── Per-card compliance expander (uses server-computed complianceScore + nearestExpiry) ──
function ComplianceSection({ vehicle }) {
  const [hovered, setHovered] = useState(false);
  const score = vehicle.complianceScore ?? 0;
  const color = complianceColor(score);

  return (
    <div
      className="mt-3 pt-3"
      style={{ borderTop: '1px solid var(--border)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Compliance
        </span>
        <span className="font-mono font-medium" style={{ fontSize: 12, color }}>
          {score}%
        </span>
      </div>
      <TVProgress value={score} color={color} height={5} />

      {hovered && vehicle.nearestExpiry && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 10, color: 'var(--text-dim)', minWidth: 72 }}>
              {vehicle.nearestExpiry.field}
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: expiryColor(vehicle.nearestExpiry.daysLeft) }}>
              {shortDate(vehicle.nearestExpiry.date)}
              {' '}
              <span style={{ color: 'var(--text-dim)' }}>({vehicle.nearestExpiry.daysLeft}d)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vehicle Grid Card ──
function VehicleCard({ vehicle, onView, onEdit, onAssign }) {
  return (
    <Card
      streak={vehicle.currentStatus === 'in_transit'}
      style={statusStripStyle(vehicle.currentStatus)}
      className="p-0 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <div
            className="font-mono font-bold"
            style={{ fontSize: 18, color: 'var(--teal)', letterSpacing: '0.03em' }}
          >
            {vehicle.vehicleNumber}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {vehicle.model}
            <span
              className="ml-2 font-mono"
              style={{
                fontSize: 10,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '1px 5px',
              }}
            >
              {vehicle.axleType}
            </span>
          </div>
        </div>
        <StatusBadge status={vehicle.currentStatus} />
      </div>

      {/* Body */}
      <div className="px-4 pb-2 flex-1">
        <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          ODO:{' '}
          <span style={{ color: 'var(--text-primary)' }}>
            {formatNum(vehicle.odometerReading)} KM
          </span>
        </div>

        {vehicle.currentStatus === 'in_transit' && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cx('font-mono motion-streak', 'inline-block')}
              style={{
                fontSize: 11,
                color: 'var(--teal)',
                background: 'rgba(14,165,197,0.10)',
                borderRadius: 3,
                padding: '1px 7px',
              }}
            >
              On trip
            </span>
          </div>
        )}

        <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Driver:{' '}
          <span style={{ color: vehicle.currentDriver ? 'var(--text-primary)' : 'var(--text-dim)' }}>
            {vehicle.currentDriver ? vehicle.currentDriver.fullName : 'Unassigned'}
          </span>
        </div>

        <ComplianceSection vehicle={vehicle} />
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-4 px-4 py-2.5"
        style={{ borderTop: '1px solid var(--border)', marginTop: 'auto' }}
      >
        {[
          { label: 'View', icon: Eye, onClick: () => onView(vehicle) },
          { label: 'Edit', icon: Pencil, onClick: () => onEdit(vehicle) },
          { label: 'Assign', icon: Link2, onClick: () => onAssign(vehicle) },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-1 transition-colors"
            style={{ fontSize: 12, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── Date cell for table ──
function DocDateCell({ iso }) {
  if (!iso) return <span style={{ color: 'var(--text-dim)' }}>—</span>;
  const days = daysUntil(iso);
  const color = expiryColor(days);
  const expired = days < 0;
  const warn = days >= 0 && days < 15;
  return (
    <TVTooltip
      content={expired ? `Expired ${Math.abs(days)}d ago` : warn ? `Expires in ${days}d` : `${days}d remaining`}
      side="top"
    >
      <span
        className="font-mono inline-flex items-center gap-1"
        style={{
          fontSize: 11.5,
          color,
          textDecoration: expired ? 'line-through' : 'none',
          cursor: 'default',
        }}
      >
        {warn && !expired && (
          <AlertTriangle size={11} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        )}
        {shortDate(iso)}
      </span>
    </TVTooltip>
  );
}

// ── Table columns ──
function makeColumns({ onView, onEdit, onAssign }) {
  return [
  {
    key: 'vehicleNumber',
    header: 'Vehicle #',
    width: 148,
    render: (row) => (
      <span className="font-mono font-medium" style={{ color: 'var(--teal)', fontSize: 13 }}>
        {row.vehicleNumber}
      </span>
    ),
  },
  {
    key: 'model',
    header: 'Model',
    render: (row) => (
      <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{row.model || '—'}</span>
    ),
  },
  {
    key: 'axleType',
    header: 'Axle',
    width: 80,
    render: (row) => (
      <span className="font-mono uppercase" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {row.axleType}
      </span>
    ),
  },
  {
    key: 'currentStatus',
    header: 'Status',
    width: 110,
    render: (row) => <StatusBadge status={row.currentStatus} />,
  },
  {
    key: 'currentDriver',
    header: 'Driver',
    width: 150,
    render: (row) =>
      row.currentDriver ? (
        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{row.currentDriver.fullName}</span>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Unassigned</span>
      ),
  },
  {
    key: 'odometerReading',
    header: 'ODO (KM)',
    align: 'right',
    width: 110,
    render: (row) => (
      <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {formatNum(row.odometerReading)}
      </span>
    ),
  },
  {
    key: 'fitnessDate',
    header: 'Fitness',
    width: 118,
    render: (row) => <DocDateCell iso={row.fitnessDate} />,
  },
  {
    key: 'insuranceDate',
    header: 'Insurance',
    width: 118,
    render: (row) => <DocDateCell iso={row.insuranceDate} />,
  },
  {
    key: 'permitDate',
    header: 'Permit',
    width: 118,
    render: (row) => <DocDateCell iso={row.permitDate} />,
  },
  {
    key: 'puccDate',
    header: 'PUCC',
    width: 118,
    render: (row) => <DocDateCell iso={row.puccDate} />,
  },
  {
    key: 'npValidUpto',
    header: 'Nat. Permit',
    width: 118,
    render: (row) => <DocDateCell iso={row.npValidUpto} />,
  },
  {
    key: 'actions',
    header: '',
    width: 44,
    align: 'center',
    render: (row) => (
      <Menu
        align="end"
        trigger={
          <button className="btn-ghost p-1" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={14} />
          </button>
        }
      >
        <MenuItem icon={Eye} onSelect={() => onView(row)}>View</MenuItem>
        <MenuItem icon={Pencil} onSelect={() => onEdit(row)}>Edit</MenuItem>
        <MenuItem icon={Link2} onSelect={() => onAssign(row)}>Assign</MenuItem>
      </Menu>
    ),
  },
  ];
}

// ── Input styles ──
const inputStyle = {
  background: 'var(--navy-base)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-body)',
};
const monoInputStyle = { ...inputStyle, fontFamily: 'var(--font-mono)' };
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 };
const sectionDivider = { height: 1, background: 'var(--border)', margin: '20px 0' };

const EMPTY_FORM = {
  vehicleNumber: '', model: '', axleType: 'single',
  engineNumber: '', chassisNumber: '',
  registrationDate: '', fitnessDate: '', insuranceDate: '',
  taxDueDate: '', permitDate: '', puccDate: '', npValidUpto: '',
  odometerReading: '',
};

// ISO date/datetime → yyyy-MM-dd for <input type="date">.
const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

// ── Add / Edit Vehicle Modal ──
function VehicleFormModal({ open, onOpenChange, vehicle, createVehicle, updateVehicle, refetch }) {
  const toast = useToast();
  const isEdit = !!vehicle;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Prefill when opening in edit mode; reset for add.
  useEffect(() => {
    if (!open) return;
    if (vehicle) {
      setForm({
        vehicleNumber: vehicle.vehicleNumber ?? '',
        model: vehicle.model ?? '',
        axleType: vehicle.axleType ?? 'single',
        engineNumber: vehicle.engineNumber ?? '',
        chassisNumber: vehicle.chassisNumber ?? '',
        registrationDate: dateInput(vehicle.registrationDate),
        fitnessDate: dateInput(vehicle.fitnessDate),
        insuranceDate: dateInput(vehicle.insuranceDate),
        taxDueDate: dateInput(vehicle.taxDueDate),
        permitDate: dateInput(vehicle.permitDate),
        puccDate: dateInput(vehicle.puccDate),
        npValidUpto: dateInput(vehicle.npValidUpto),
        odometerReading: vehicle.odometerReading != null ? String(vehicle.odometerReading) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, vehicle]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd() {
    setSaving(true);
    try {
      const body = {
        vehicleNumber: form.vehicleNumber,
        model: form.model || undefined,
        type: 'truck',
        axleType: form.axleType,
        engineNumber: form.engineNumber,
        chassisNumber: form.chassisNumber,
        odometerReading: form.odometerReading !== '' ? Number(form.odometerReading) : undefined,
        registrationDate: form.registrationDate,
        fitnessDate: form.fitnessDate,
        insuranceDate: form.insuranceDate,
        taxDueDate: form.taxDueDate,
        permitDate: form.permitDate,
        puccDate: form.puccDate,
        npValidUpto: form.npValidUpto,
        isActive: true,
      };
      if (isEdit) {
        await updateVehicle(vehicle.id, body);
        toast.success('Vehicle updated');
      } else {
        await createVehicle(body);
        toast.success('Vehicle added');
      }
      refetch();
      onOpenChange(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(errMessage(err, isEdit ? 'Failed to update vehicle' : 'Failed to add vehicle'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'EDIT VEHICLE' : 'ADD VEHICLE'}
      width={560}
      footer={
        <>
          <button
            className="btn-ghost px-4 py-2"
            style={{ fontSize: 13 }}
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </button>
          <LoadingButton
            className="btn-brand px-4 py-2"
            style={{ fontSize: 13 }}
            loading={saving}
            onClick={handleAdd}
          >
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </LoadingButton>
        </>
      }
    >
      {/* ── Vehicle Identity ── */}
      <div>
        <div className="font-display font-semibold uppercase tracking-wider mb-3" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Vehicle Identity
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={labelStyle}>Vehicle Number *</label>
            <input
              style={monoInputStyle}
              placeholder="MH14-AB-0000"
              value={form.vehicleNumber}
              onChange={(e) => set('vehicleNumber', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Model</label>
            <input
              style={inputStyle}
              placeholder="e.g. Tata Prima 4928S"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <input
              style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
              value="truck"
              disabled
            />
          </div>
          <div>
            <label style={labelStyle}>Axle Type</label>
            <TVSelect
              value={form.axleType}
              onValueChange={(v) => set('axleType', v)}
              options={[
                { value: 'single', label: 'Single Axle' },
                { value: 'multi', label: 'Multi Axle' },
              ]}
              className="w-full"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={sectionDivider} />

      {/* ── Engine Details ── */}
      <div>
        <div className="font-display font-semibold uppercase tracking-wider mb-3" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Engine Details
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={labelStyle}>Engine Number</label>
            <input
              style={monoInputStyle}
              placeholder="ENG000000"
              value={form.engineNumber}
              onChange={(e) => set('engineNumber', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Chassis Number</label>
            <input
              style={monoInputStyle}
              placeholder="CHS000000"
              value={form.chassisNumber}
              onChange={(e) => set('chassisNumber', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={sectionDivider} />

      {/* ── Compliance Dates ── */}
      <div>
        <div className="font-display font-semibold uppercase tracking-wider mb-3" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Compliance Dates
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[
            { key: 'registrationDate', label: 'Registration' },
            { key: 'fitnessDate',      label: 'Fitness' },
            { key: 'insuranceDate',    label: 'Insurance' },
            { key: 'taxDueDate',       label: 'Road Tax' },
            { key: 'permitDate',       label: 'Permit' },
            { key: 'puccDate',         label: 'PUCC' },
            { key: 'npValidUpto',      label: 'National Permit' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                type="date"
                style={{ ...monoInputStyle, colorScheme: 'dark' }}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={sectionDivider} />

      {/* ── Initial Odometer ── */}
      <div>
        <div className="font-display font-semibold uppercase tracking-wider mb-3" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Initial Odometer
        </div>
        <div style={{ maxWidth: 240 }}>
          <label style={labelStyle}>Odometer Reading (KM)</label>
          <input
            type="number"
            style={monoInputStyle}
            placeholder="0"
            min="0"
            value={form.odometerReading}
            onChange={(e) => set('odometerReading', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── View Vehicle Modal (read-only) ──
function ViewVehicleModal({ vehicle, onClose }) {
  if (!vehicle) return null;
  const rows = [
    ['Vehicle Number', vehicle.vehicleNumber],
    ['Model', vehicle.model || '—'],
    ['Axle Type', vehicle.axleType],
    ['Status', vehicle.currentStatus],
    ['Assigned Driver', vehicle.currentDriver ? vehicle.currentDriver.fullName : 'Unassigned'],
    ['Odometer (KM)', formatNum(vehicle.odometerReading)],
    ['Engine Number', vehicle.engineNumber],
    ['Chassis Number', vehicle.chassisNumber],
    ['Registration', shortDate(vehicle.registrationDate)],
    ['Fitness', shortDate(vehicle.fitnessDate)],
    ['Insurance', shortDate(vehicle.insuranceDate)],
    ['Road Tax', shortDate(vehicle.taxDueDate)],
    ['Permit', shortDate(vehicle.permitDate)],
    ['PUCC', shortDate(vehicle.puccDate)],
    ['National Permit', shortDate(vehicle.npValidUpto)],
  ];
  return (
    <Modal
      open={!!vehicle}
      onOpenChange={(o) => !o && onClose()}
      title={`VEHICLE · ${vehicle.vehicleNumber}`}
      width={520}
      footer={<button className="btn-ghost px-4 py-2" style={{ fontSize: 13 }} onClick={onClose}>Close</button>}
    >
      <div className="grid gap-y-2.5 items-center" style={{ gridTemplateColumns: '160px 1fr' }}>
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</div>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value}</div>
          </React.Fragment>
        ))}
      </div>
    </Modal>
  );
}

// ── Assign Driver Modal ──
const UNASSIGNED = '__unassigned__';
function AssignDriverModal({ vehicle, onClose, updateVehicle, refetch }) {
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState(UNASSIGNED);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setDriverId(vehicle.currentDriverId ?? vehicle.currentDriver?.id ?? UNASSIGNED);
    getSelect('drivers').then(setDrivers).catch(() => setDrivers([]));
  }, [vehicle]);

  if (!vehicle) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const next = driverId === UNASSIGNED ? null : driverId;
      await updateVehicle(vehicle.id, { currentDriverId: next });
      toast.success(next ? 'Driver assigned' : 'Driver unassigned');
      refetch();
      onClose();
    } catch (err) {
      toast.error(errMessage(err, 'Failed to assign driver'));
    } finally {
      setSaving(false);
    }
  }

  const options = [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...drivers.map((d) => ({ value: d.value, label: d.label })),
  ];

  return (
    <Modal
      open={!!vehicle}
      onOpenChange={(o) => !o && onClose()}
      title={`ASSIGN DRIVER · ${vehicle.vehicleNumber}`}
      width={420}
      footer={
        <>
          <button className="btn-ghost px-4 py-2" style={{ fontSize: 13 }} onClick={onClose} disabled={saving}>Cancel</button>
          <LoadingButton className="btn-brand px-4 py-2" style={{ fontSize: 13 }} loading={saving} onClick={handleSave}>Save</LoadingButton>
        </>
      }
    >
      <label style={labelStyle}>Driver</label>
      <TVSelect value={driverId} onValueChange={setDriverId} options={options} className="w-full" style={{ width: '100%' }} />
    </Modal>
  );
}

// ── Main Page ──
export default function Vehicles() {
  const { vehicles, meta, loading, error, filters, setFilters, refetch } = useVehiclesPage();
  const { createVehicle, updateVehicle } = useVehiclesActions();
  const [view, setView] = useState('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [formVehicle, setFormVehicle] = useState(null);
  const [viewVehicle, setViewVehicle] = useState(null);
  const [assignVehicle, setAssignVehicle] = useState(null);

  const onView = (v) => setViewVehicle(v);
  const onEdit = (v) => { setFormVehicle(v); setFormOpen(true); };
  const onAssign = (v) => setAssignVehicle(v);

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* 1) Page Header */}
      <PageHeader
        title="VEHICLES"
        breadcrumbs={['Fleet', 'Vehicles']}
        actions={
          <button
            className="btn-brand flex items-center gap-1.5 px-4 py-2"
            style={{ fontSize: 13 }}
            onClick={() => { setFormVehicle(null); setFormOpen(true); }}
          >
            <Plus size={15} />
            Add Vehicle
          </button>
        }
      />

      {/* 2) Error banner */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* 3) View Toggle */}
      <SegmentTabs
        tabs={[
          { value: 'grid', label: 'Grid View' },
          { value: 'table', label: 'Table View' },
        ]}
        value={view}
        onValueChange={setView}
      />

      {/* 4) Grid View */}
      {view === 'grid' && (
        loading
          ? <SkeletonGrid count={6} />
          : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} onView={onView} onEdit={onEdit} onAssign={onAssign} />
              ))}
            </div>
          )
      )}

      {/* 5) Table View */}
      {view === 'table' && (
        loading
          ? <SkeletonTable rows={8} cols={makeColumns({}).length} />
          : (
            <DataTable
              columns={makeColumns({ onView, onEdit, onAssign })}
              data={vehicles}
              pageSize={filters.pageSize ?? 10}
              rowClassName={(row) => (row.currentStatus === 'in_transit' ? 'motion-streak' : '')}
            />
          )
      )}

      {/* 6) Pagination */}
      {!loading && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-1" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          <span className="font-mono">{meta.total} total</span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost px-3 py-1"
              style={{ fontSize: 12 }}
              disabled={meta.page <= 1}
              onClick={() => setFilters({ page: meta.page - 1 })}
            >
              Prev
            </button>
            <span className="font-mono">{meta.page} / {meta.totalPages}</span>
            <button
              className="btn-ghost px-3 py-1"
              style={{ fontSize: 12 }}
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters({ page: meta.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 7) Add / Edit / View / Assign Modals */}
      <VehicleFormModal
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setFormVehicle(null); }}
        vehicle={formVehicle}
        createVehicle={createVehicle}
        updateVehicle={updateVehicle}
        refetch={refetch}
      />
      <ViewVehicleModal vehicle={viewVehicle} onClose={() => setViewVehicle(null)} />
      <AssignDriverModal
        vehicle={assignVehicle}
        onClose={() => setAssignVehicle(null)}
        updateVehicle={updateVehicle}
        refetch={refetch}
      />
    </div>
  );
}
