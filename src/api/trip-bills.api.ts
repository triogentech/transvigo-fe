import { withDayBounds } from '../lib/day-range';
import { get, put } from './client';
import type { TripBill, TripBillStatus, TripBillSummary, UpdateTripBillBody } from '../types/api.types';

export interface TripBillFilters {
  status?: TripBillStatus;
  loadProviderId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  /** Column filters: they combine with each other, the status and the search. */
  invoiceNumber?: string;
  tripNumber?: string;
  /** Only bills waiting this many days or more, counted from the day the trip closed. */
  pendingMinDays?: string;
  vehicleNumber?: string;
  tripStartFrom?: string;
  tripStartTo?: string;
  tripCloseFrom?: string;
  tripCloseTo?: string;
}
export interface TripBillsResponse { data: TripBill[]; summary: TripBillSummary }

export const getTripBills = (f: TripBillFilters = {}) =>
  get<TripBillsResponse>('/api/trip-bills', { page: 1, pageSize: 200, ...withDayBounds(f) });

export const updateTripBill = (id: string, body: UpdateTripBillBody) => put<TripBill>(`/api/trip-bills/${id}`, body);
