import { get } from './client';
import type {
  ActivityLog, Driver, FuelLog, GarageLog, Role, RolePermission, TollLog,
  Transaction, Trip, TripStatus, TxnTowards, TyreLog, Vehicle,
} from '../types/api.types';
import type { SelectOption } from './select.api';

export interface PageMeta { page: number; pageSize: number; total: number; totalPages: number }

// ── Dashboard ──
export interface DashboardPage {
  stats: {
    activeTrips: number; tripsCompletingToday: number;
    vehiclesOnRoad: number; totalVehicles: number;
    revenueMtd: number; revenueLastMonth: number; revenueGrowthPct: number;
    pendingAdvances: number; pendingTripsCount: number;
  };
  fleetStatus: { idle: number; assigned: number; inTransit: number };
  recentTrips: Array<Pick<Trip, 'id' | 'tripNumber' | 'startPoint' | 'endPoint' | 'currentStatus' | 'freightTotalAmount' | 'estimatedStartTime'> & {
    driver: { id: string; fullName: string } | null;
    vehicle: { id: string; vehicleNumber: string } | null;
    loadProvider: { id: string; name: string } | null;
  }>;
  tripActivity: Array<{ date: string; started: number; completed: number }>;
  expenseBreakdown: Array<{ txnTowards: TxnTowards; total: number; count: number }>;
  complianceAlerts: Array<{ vehicleId: string; vehicleNumber: string; documentType: string; expiryDate: string; daysLeft: number }>;
  generatedAt: string;
}

export const getDashboardPage = () => get<DashboardPage>('/api/pages/dashboard');

export interface AnalyticsPage {
  fleet: { fuel: number; toll: number; job: number; invoice: number; tyre: number; total: number };
  perVehicle: Array<{ vehicleId: string; vehicleNumber: string; model: string | null; fuel: number; toll: number; job: number; invoice: number; total: number }>;
  vehicleBrands: Array<{ brand: string; count: number; totalCost: number; avgCost: number; breakdowns: number }>;
  tyreBrands: Array<{ brand: string; totalTyres: number; avgKmPerTyre: number; avgPurchaseCost: number; costPer1000km: number }>;
}
export const getAnalyticsPage = () => get<AnalyticsPage>('/api/pages/analytics');

// ── Trips ──
export type TripListItem = Trip & { _count?: { transactions: number; fuelLogs: number } };
export interface TripsPage {
  trips: TripListItem[];
  meta: PageMeta;
  filters: { drivers: SelectOption[]; vehicles: SelectOption[]; loadProviders: SelectOption[] };
  statusCounts: { all: number; created: number; inTransit: number; completed: number };
}
export interface TripsPageParams {
  page?: number; pageSize?: number; status?: TripStatus;
  driverId?: string; vehicleId?: string; loadProviderId?: string;
  dateFrom?: string; dateTo?: string; search?: string;
}
export const getTripsPage = (params?: TripsPageParams) => get<TripsPage>('/api/pages/trips', params);

export interface TripDetailPage {
  trip: Trip;
  transactions: Transaction[];
  fuelLogs: FuelLog[];
  tollLogs: TollLog[];
  activityLogs: ActivityLog[];
  stats: { totalExpenses: number; totalCredits: number; netFlow: number; totalFuelLitres: number; totalFuelCost: number };
}
export const getTripDetailPage = (id: string) => get<TripDetailPage>(`/api/pages/trips/${id}`);

// ── Vehicles / Drivers / Transactions / Maintenance / Fuel / Audit ──
export const getVehiclesPage = (params?: Record<string, unknown>) =>
  get<{ vehicles: Array<Vehicle & Record<string, unknown>>; meta: PageMeta; summary: Record<string, number>; complianceOverview: { critical: number; warning: number; healthy: number } }>('/api/pages/vehicles', params);
export const getVehicleDetailPage = (id: string) =>
  get<{ vehicle: Vehicle; currentTrip: Trip | null; recentTrips: TripListItem[]; fuelLogs: FuelLog[]; garageLogs: GarageLog[]; tyreLogs: TyreLog[]; complianceStatus: Array<{ field: string; label: string; date: string; daysLeft: number; status: string }> }>(`/api/pages/vehicles/${id}`);

export const getDriversPage = (params?: Record<string, unknown>) =>
  get<{ drivers: Array<Driver & Record<string, unknown>>; meta: PageMeta; summary: Record<string, number> }>('/api/pages/drivers', params);
export const getDriverDetailPage = (id: string) =>
  get<{ driver: Driver; user: { id: string; email: string } | null; recentTrips: TripListItem[]; tripStats: { totalTrips: number; completedTrips: number; totalFreightHandled: number; avgFreightPerTrip: number } }>(`/api/pages/drivers/${id}`);

export const getTransactionsPage = (params?: Record<string, unknown>) =>
  get<{ transactions: Array<Transaction & { trip: { id: string; tripNumber: string; startPoint: string; endPoint: string } | null }>; meta: PageMeta; summary: { totalDebits: number; totalCredits: number; netFlow: number; manualCount: number; byCategory: Array<{ txnTowards: TxnTowards; total: number; count: number }> }; filters: { trips: SelectOption[] } }>('/api/pages/transactions', params);

export const getMaintenancePage = (params?: Record<string, unknown>) =>
  get<{ garageLogs: GarageLog[]; tyreLogs: TyreLog[]; meta: { garageLogsMeta: PageMeta; tyreLogsMeta: PageMeta }; filters: { vehicles: SelectOption[]; garages: SelectOption[] }; summary: Record<string, number> }>('/api/pages/maintenance', params);

export const getFuelLogsPage = (params?: Record<string, unknown>) =>
  get<{ fuelLogs: FuelLog[]; meta: PageMeta; filters: { vehicles: SelectOption[]; fuelStations: SelectOption[] }; summary: { totalLitres: number; totalCost: number; avgRatePerLitre: number; byFuelType: Array<{ fuelType: string; litres: number; cost: number }> } }>('/api/pages/fuel-logs', params);

export const getAuditLogPage = (params?: Record<string, unknown>) =>
  get<{ logs: ActivityLog[]; meta: PageMeta; filters: { users: SelectOption[]; collections: string[] }; summary: { totalToday: number; byAction: { CREATE: number; UPDATE: number; DELETE: number } } }>('/api/pages/audit-log', params);

export const getAdminRolesPage = () =>
  get<{ roles: Array<Role & { _count: { users: number }; permissions: RolePermission[] }>; modules: Array<{ slug: string; label: string; group: string; icon: string }>; orgUserCount: number }>('/api/pages/admin/roles');
