// API CALLS: 1 (GET /api/pages/transactions) + lazy detail + mutations
// ── SECTION: Transactions Page ──
import React, { useState, useMemo } from 'react';
import {
  ArrowDownCircle, ArrowUpCircle, PenLine,
  Wallet, Smartphone, Banknote, CreditCard, Landmark,
  Filter, Plus,
} from 'lucide-react';
import {
  Card, PageHeader, DataTable, Modal, TVSelect, TVSwitch,
  Popover, Pill, StatusBadge,
} from '../components/ui.jsx';
import { SkeletonTable, ErrorBanner, EmptyState, LoadingButton } from '../components/states.tsx';
import { SearchInput } from '../components/SearchInput';
import { cx } from '../lib/utils.js';
import { formatINR, relTime } from '../lib/utils.js';
import { useTransactionsPage } from '../hooks/pages/useTransactionsPage';
import { useTransactionsActions } from '../hooks/actions/useTransactionsActions';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client.ts';

// ── Category color map — keys match API txnTowards (underscore) ──
const CAT_COLOR = {
  'fuel':           { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  'driver_advance': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'extra_advance':  { bg: '#FAF5FF', text: '#7C3AED', border: '#E9D5FF' },
  'incentives':     { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  'food':           { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'challan':        { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  'maintenance':    { bg: '#F8FAFC', text: '#475569', border: '#CBD5E1' },
};
const catText = (c) => CAT_COLOR[c]?.text || 'var(--accent-teal)';

// ── All txnTowards values ──
const TXN_TOWARDS_OPTIONS = [
  'fuel', 'driver_advance', 'extra_advance', 'incentives', 'food', 'challan', 'maintenance',
];

// ── Method config ──
const METHOD_CONFIG = {
  upi:           { Icon: Smartphone,  label: 'UPI' },
  cash:          { Icon: Banknote,    label: 'Cash' },
  card:          { Icon: CreditCard,  label: 'Card' },
  bank_transfer: { Icon: Landmark,    label: 'Bank Transfer' },
  wallet:        { Icon: Wallet,      label: 'Wallet' },
  netbanking:    { Icon: Landmark,    label: 'Netbanking' },
};

// ── Input style helper ──
const inputStyle = {
  background: 'var(--navy-base)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  width: '100%',
};

const labelStyle = {
  fontSize: 11,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 4,
  display: 'block',
};

// ── Default form state ──
const DEFAULT_FORM = {
  type: 'debit',
  txnTowards: '',
  amount: '',
  description: '',
  method: 'upi',
  tripId: '',
  transactionFrom: '',
  transactionTo: '',
  isTxnAddedManually: true,
};

export default function Transactions() {
  const toast = useToast();

  const {
    transactions, meta, summary, filterOptions, loading, error, filters, setFilters, refetch,
  } = useTransactionsPage();

  const { createTransaction } = useTransactionsActions();

  // ── Modal state ──
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // ── Summary from server (no client-side recompute) ──
  const totalDebit  = summary?.totalDebits  ?? 0;
  const totalCredit = summary?.totalCredits ?? 0;
  const netFlow     = summary?.netFlow      ?? 0;
  const manualCount = summary?.manualCount  ?? 0;

  // ── Active filter indicator ──
  const hasFilters = !!(filters.type || filters.txnTowards || filters.transactionStatus || filters.tripId);

  // ── Table columns ──
  const columns = [
    {
      key: 'transactionRef',
      header: 'TXN ID',
      width: 120,
      render: (row) => (
        <span
          className="font-mono truncate block"
          style={{ fontSize: 10, color: 'var(--text-dim)', maxWidth: 110 }}
          title={row.transactionRef}
        >
          {row.transactionRef}
        </span>
      ),
    },
    {
      key: 'tripId',
      header: 'Trip #',
      width: 160,
      render: (row) => row.tripId ? (
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--teal)' }}>
          {row.trip?.tripNumber || row.tripId.slice(0, 8) + '…'}
        </span>
      ) : (
        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: 90,
      render: (row) =>
        row.type === 'debit' ? (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--danger)' }}>
            <ArrowDownCircle size={13} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-body)' }}>Debit</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <ArrowUpCircle size={13} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-body)' }}>Credit</span>
          </span>
        ),
    },
    {
      key: 'txnTowards',
      header: 'Category',
      width: 140,
      render: (row) => (
        <Pill {...(CAT_COLOR[row.txnTowards] || {})}>
          {row.txnTowards?.replace(/_/g, ' ') || '—'}
        </Pill>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: 120,
      align: 'right',
      render: (row) => (
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: row.type === 'debit' ? 'var(--danger)' : 'var(--success)',
          }}
        >
          {row.type === 'debit' ? '-' : '+'}{formatINR(row.amount)}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      width: 130,
      render: (row) => {
        const cfg = METHOD_CONFIG[row.method] || { Icon: Wallet, label: row.method || '—' };
        return (
          <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <cfg.Icon size={13} style={{ color: 'var(--text-dim)' }} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'transactionStatus',
      header: 'Status',
      width: 90,
      render: (row) => <StatusBadge status={row.transactionStatus} />,
    },
    {
      key: 'isTxnAddedManually',
      header: 'Manual',
      width: 60,
      align: 'center',
      render: (row) =>
        row.isTxnAddedManually ? (
          <PenLine size={14} style={{ color: 'var(--teal)' }} />
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      width: 100,
      render: (row) => (
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{relTime(row.createdAt)}</span>
      ),
    },
  ];

  // ── Trip options for modal — sourced from filterOptions.trips ──
  const tripOptions = useMemo(() => [
    { value: '', label: 'No trip linked' },
    ...(filterOptions?.trips ?? []).map((t) => ({
      value: t.value,
      label: t.label,
    })),
  ], [filterOptions]);

  // ── Form field updater ──
  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Save handler ──
  async function handleSave() {
    setSubmitting(true);
    try {
      let fromObj = {};
      let toObj = {};
      try { fromObj = JSON.parse(form.transactionFrom); } catch (_) { fromObj = {}; }
      try { toObj = JSON.parse(form.transactionTo); } catch (_) { toObj = {}; }

      const body = {
        type: form.type,
        txnTowards: form.txnTowards,
        amount: Number(form.amount),
        description: form.description,
        method: form.method || undefined,
        transactionFrom: fromObj,
        transactionTo: toObj,
        isTxnAddedManually: form.isTxnAddedManually,
        tripId: form.tripId || undefined,
        currency: 'INR',
      };
      await createTransaction(body);
      refetch();
      toast.success('Transaction added');
      setAddOpen(false);
      setForm(DEFAULT_FORM);
    } catch (e) {
      toast.error(errMessage(e, 'Failed to save transaction'));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Filter popover content ──
  const filterPopoverContent = (
    <div className="flex flex-col gap-3" style={{ minWidth: 260 }}>
      <div className="font-display font-bold" style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
        Filters
      </div>

      <div>
        <label style={labelStyle}>Type</label>
        <TVSelect
          value={filters.type || 'all'}
          onValueChange={(v) => setFilters({ type: v === 'all' ? undefined : v, page: 1 })}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'debit', label: 'Debit' },
            { value: 'credit', label: 'Credit' },
          ]}
          className="w-full"
        />
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <TVSelect
          value={filters.txnTowards || 'all'}
          onValueChange={(v) => setFilters({ txnTowards: v === 'all' ? undefined : v, page: 1 })}
          options={[
            { value: 'all', label: 'All Categories' },
            ...TXN_TOWARDS_OPTIONS.map((c) => ({
              value: c,
              label: c.replace(/_/g, ' '),
              dot: catText(c),
            })),
          ]}
          className="w-full"
        />
      </div>

      <div>
        <label style={labelStyle}>Status</label>
        <TVSelect
          value={filters.transactionStatus || 'all'}
          onValueChange={(v) => setFilters({ transactionStatus: v === 'all' ? undefined : v, page: 1 })}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'success', label: 'Success' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
          ]}
          className="w-full"
        />
      </div>

      <div>
        <label style={labelStyle}>Trip</label>
        <TVSelect
          value={filters.tripId || 'all'}
          onValueChange={(v) => setFilters({ tripId: v === 'all' ? undefined : v, page: 1 })}
          options={[
            { value: 'all', label: 'All Trips' },
            ...(filterOptions?.trips ?? []).map((t) => ({ value: t.value, label: t.label })),
          ]}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          className="btn-ghost px-3 py-1.5"
          style={{ fontSize: 12 }}
          onClick={() => setFilters({ page: 1, pageSize: filters.pageSize ?? 10, type: undefined, txnTowards: undefined, transactionStatus: undefined, tripId: undefined })}
        >
          Reset
        </button>
      </div>
    </div>
  );

  // ── Page actions ──
  const pageActions = (
    <>
      <Popover
        trigger={
          <button className="btn-ghost flex items-center gap-1.5 px-3 py-1.5" style={{ fontSize: 13 }}>
            <Filter size={14} />
            Filter
            {hasFilters && (
              <span
                className="font-mono"
                style={{
                  fontSize: 9,
                  background: 'var(--accent-teal)',
                  color: '#fff',
                  borderRadius: 99,
                  padding: '1px 5px',
                  marginLeft: 2,
                }}
              >
                •
              </span>
            )}
          </button>
        }
        align="end"
        width={300}
      >
        {filterPopoverContent}
      </Popover>

      <button
        className="btn-brand flex items-center gap-1.5 px-3 py-1.5"
        style={{ fontSize: 13 }}
        onClick={() => setAddOpen(true)}
      >
        <Plus size={14} />
        Add Transaction
      </button>
    </>
  );

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* 1 ── Page Header */}
      <PageHeader
        title="TRANSACTIONS"
        breadcrumbs={['Finance', 'Transactions']}
        actions={pageActions}
      />

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Search (server-side: ref / description) */}
      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setFilters({ search: v === '' ? undefined : v, page: 1 }); }}
        placeholder="Search transactions…"
      />

      {/* 2 ── Summary Bar (server-computed — no client-side recompute) */}
      <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {/* Total Debits */}
        <Card className="p-3">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Total Debits
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--danger)', lineHeight: 1.2 }}
          >
            {formatINR(totalDebit)}
          </div>
        </Card>

        {/* Total Credits */}
        <Card className="p-3">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Total Credits
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--success)', lineHeight: 1.2 }}
          >
            {formatINR(totalCredit)}
          </div>
        </Card>

        {/* Net Flow */}
        <Card className="p-3">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Net Flow
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: netFlow >= 0 ? 'var(--success)' : 'var(--danger)',
              lineHeight: 1.2,
            }}
          >
            {netFlow >= 0 ? '+' : ''}{formatINR(netFlow)}
          </div>
        </Card>

        {/* Manual Count */}
        <Card className="p-3">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Manual Entries
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--teal)', lineHeight: 1.2 }}
          >
            {manualCount}
          </div>
        </Card>
      </div>

      {/* 3 ── Active filter chips */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--text-dim)' }}>Active filters:</span>
          {filters.type && (
            <Pill color="var(--teal)">{filters.type}</Pill>
          )}
          {filters.txnTowards && (
            <Pill {...(CAT_COLOR[filters.txnTowards] || {})}>{filters.txnTowards.replace(/_/g, ' ')}</Pill>
          )}
          {filters.transactionStatus && (
            <Pill color={filters.transactionStatus === 'success' ? 'var(--success)' : filters.transactionStatus === 'failed' ? 'var(--danger)' : 'var(--warning)'}>
              {filters.transactionStatus}
            </Pill>
          )}
          {filters.tripId && (
            <Pill color="var(--teal)">Trip filtered</Pill>
          )}
          <button
            style={{ color: 'var(--text-dim)', fontSize: 11, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => setFilters({ page: 1, pageSize: filters.pageSize ?? 10, type: undefined, txnTowards: undefined, transactionStatus: undefined, tripId: undefined })}
          >
            Clear all
          </button>
        </div>
      )}

      {/* 4 ── Transactions DataTable */}
      {loading ? (
        <SkeletonTable rows={8} cols={columns.length} />
      ) : transactions.length === 0 && !error ? (
        <EmptyState title="No transactions found" description="Add a transaction or adjust your filters." />
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          pageSize={filters.pageSize ?? 10}
          paginate={false}
          emptyLabel="No transactions found"
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
          <TVSelect
            small
            value={String(filters.pageSize ?? 10)}
            onValueChange={(v) => setFilters({ pageSize: Number(v), page: 1 })}
            options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
          />
        </div>
      )}

      {/* 5 ── Add Transaction Modal */}
      <Modal
        open={addOpen}
        onOpenChange={(o) => { setAddOpen(o); if (!o) setForm(DEFAULT_FORM); }}
        title="Add Transaction"
        width={560}
        footer={
          <>
            <button
              className="btn-ghost px-4 py-1.5"
              style={{ fontSize: 13 }}
              onClick={() => { setAddOpen(false); setForm(DEFAULT_FORM); }}
              disabled={submitting}
            >
              Cancel
            </button>
            <LoadingButton
              loading={submitting}
              className="btn-brand px-4 py-1.5"
              style={{ fontSize: 13 }}
              onClick={handleSave}
            >
              Save Transaction
            </LoadingButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <TVSelect
              value={form.type}
              onValueChange={setField('type')}
              options={[
                { value: 'debit',  label: 'Debit',  dot: 'var(--danger)' },
                { value: 'credit', label: 'Credit', dot: 'var(--success)' },
              ]}
            />
          </div>

          {/* Category / Towards */}
          <div>
            <label style={labelStyle}>Transaction Towards</label>
            <TVSelect
              value={form.txnTowards}
              onValueChange={setField('txnTowards')}
              placeholder="Select category…"
              options={TXN_TOWARDS_OPTIONS.map((c) => ({
                value: c,
                label: c.replace(/_/g, ' '),
                dot: catText(c),
              }))}
            />
          </div>

          {/* Amount */}
          <div>
            <label style={labelStyle}>Amount</label>
            <div className="flex items-center" style={{ background: 'var(--navy-base)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <span
                className="font-mono px-3 py-2"
                style={{ color: 'var(--text-muted)', fontSize: 14, borderRight: '1px solid var(--border)', background: 'var(--navy-mid)' }}
              >
                ₹
              </span>
              <input
                type="number"
                className="font-mono"
                value={form.amount}
                onChange={(e) => setField('amount')(e.target.value)}
                placeholder="0"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description')(e.target.value)}
              rows={2}
              placeholder="Brief description of this transaction…"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
            />
          </div>

          {/* Method */}
          <div>
            <label style={labelStyle}>Payment Method</label>
            <TVSelect
              value={form.method}
              onValueChange={setField('method')}
              options={[
                { value: 'upi',           label: 'UPI' },
                { value: 'cash',          label: 'Cash' },
                { value: 'card',          label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'wallet',        label: 'Wallet' },
                { value: 'netbanking',    label: 'Netbanking' },
              ]}
            />
          </div>

          {/* Trip — from filterOptions.trips */}
          <div>
            <label style={labelStyle}>Link Trip</label>
            <TVSelect
              value={form.tripId}
              onValueChange={setField('tripId')}
              placeholder="Select trip…"
              options={tripOptions}
            />
          </div>

          {/* Transaction From */}
          <div>
            <label style={labelStyle}>Transaction From</label>
            <textarea
              value={form.transactionFrom}
              onChange={(e) => setField('transactionFrom')(e.target.value)}
              rows={2}
              placeholder='{"name":"...","type":"..."}'
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, display: 'block' }}>
              JSON — e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>{'{"name":"Acme Wallet","type":"org"}'}</code>
            </span>
          </div>

          {/* Transaction To */}
          <div>
            <label style={labelStyle}>Transaction To</label>
            <textarea
              value={form.transactionTo}
              onChange={(e) => setField('transactionTo')(e.target.value)}
              rows={2}
              placeholder='{"name":"...","type":"..."}'
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, display: 'block' }}>
              JSON — e.g. <code style={{ fontFamily: 'var(--font-mono)' }}>{'{"name":"Ramesh Yadav","type":"driver"}'}</code>
            </span>
          </div>

          {/* Manual switch */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                Manually Added
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                Mark if this transaction was entered manually
              </div>
            </div>
            <TVSwitch
              checked={form.isTxnAddedManually}
              onCheckedChange={setField('isTxnAddedManually')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
