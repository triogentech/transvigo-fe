import { useCallback, useEffect, useState } from 'react';
import * as tripsApi from '../api/trips.api';
import * as vehiclesApi from '../api/vehicles.api';
import * as transactionsApi from '../api/transactions.api';
import { errMessage } from '../api/client';
import type {
  ComplianceAlert, DashboardStats, ExpenseBreakdown, Trip, TripActivityPoint,
  Transaction, TxnTowards, Vehicle,
} from '../types/api.types';

// transvigo-be has no /api/dashboard/* endpoints, so we aggregate client-side
// from the list endpoints in parallel. (Adequate at template data scale.)

const DAY = 86400000;
const dateKey = (iso: string) => iso.slice(0, 10);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const ADVANCE: TxnTowards[] = ['driver_advance', 'extra_advance'];

const DOC_FIELDS: Array<[keyof Vehicle, string]> = [
  ['registrationDate', 'Registration'], ['fitnessDate', 'Fitness'],
  ['insuranceDate', 'Insurance'], ['taxDueDate', 'Tax'],
  ['permitDate', 'Permit'], ['puccDate', 'PUCC'], ['npValidUpto', 'National Permit'],
];

export function useDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, v, x] = await Promise.all([
        tripsApi.getTrips(),
        vehiclesApi.getVehicles(),
        transactionsApi.getTransactions(),
      ]);
      setTrips(t.data);
      setVehicles(v.data);
      setTxns(x.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
  const todayKey = dateKey(now.toISOString());

  const tripById = new Map(trips.map((t) => [t.id, t]));

  const credits = txns.filter((t) => t.type === 'credit');
  const revenueMtd = credits.filter((t) => t.createdAt >= monthStart).reduce((s, t) => s + Number(t.amount), 0);
  const revenueLastMonth = credits.filter((t) => t.createdAt >= lastMonthStart && t.createdAt < monthStart).reduce((s, t) => s + Number(t.amount), 0);

  const pendingAdvanceTxns = txns.filter(
    (t) => t.type === 'debit' && ADVANCE.includes(t.txnTowards) &&
      (!t.tripId || tripById.get(t.tripId)?.currentStatus !== 'completed'),
  );
  const pendingAdvances = pendingAdvanceTxns.reduce((s, t) => s + Number(t.amount), 0);
  const pendingTripsCount = new Set(pendingAdvanceTxns.map((t) => t.tripId).filter(Boolean)).size;

  const stats: DashboardStats = {
    activeTrips: trips.filter((t) => t.currentStatus === 'in_transit').length,
    tripsCompletingToday: trips.filter((t) => t.currentStatus !== 'completed' && dateKey(t.estimatedEndTime) === todayKey).length,
    vehiclesOnRoad: vehicles.filter((v) => v.currentStatus === 'in_transit').length,
    totalVehicles: vehicles.length,
    revenueMtd, revenueLastMonth, pendingAdvances, pendingTripsCount,
  };

  // Compliance alerts: any doc date within 30 days (or expired).
  const complianceAlerts: ComplianceAlert[] = [];
  for (const v of vehicles) {
    for (const [field, label] of DOC_FIELDS) {
      const raw = v[field] as string | undefined;
      if (!raw) continue;
      const daysLeft = Math.ceil((new Date(raw).getTime() - now.getTime()) / DAY);
      if (daysLeft <= 30) {
        complianceAlerts.push({ vehicleId: v.id, vehicleNumber: v.vehicleNumber, documentType: label, expiryDate: raw, daysLeft });
      }
    }
  }
  complianceAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

  // Expense breakdown: group debit transactions by txnTowards.
  const expMap = new Map<TxnTowards, { total: number; count: number }>();
  for (const t of txns.filter((x) => x.type === 'debit')) {
    const e = expMap.get(t.txnTowards) ?? { total: 0, count: 0 };
    e.total += Number(t.amount); e.count += 1;
    expMap.set(t.txnTowards, e);
  }
  const expenseBreakdown: ExpenseBreakdown[] = [...expMap.entries()]
    .map(([txnTowards, v]) => ({ txnTowards, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);

  // Trip activity: last 30 days, started (createdAt) vs completed (actualEndTime).
  const activity = new Map<string, TripActivityPoint>();
  for (let i = 29; i >= 0; i--) {
    const key = dateKey(new Date(now.getTime() - i * DAY).toISOString());
    activity.set(key, { date: key, tripsStarted: 0, tripsCompleted: 0 });
  }
  for (const t of trips) {
    const sk = dateKey(t.createdAt);
    if (activity.has(sk)) activity.get(sk)!.tripsStarted += 1;
    if (t.actualEndTime) {
      const ck = dateKey(t.actualEndTime);
      if (activity.has(ck)) activity.get(ck)!.tripsCompleted += 1;
    }
  }
  const tripActivity = [...activity.values()];

  const recentTrips = [...trips].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 10);

  return { stats, vehicles, recentTrips, complianceAlerts, expenseBreakdown, tripActivity, loading, error, refetch: load };
}
