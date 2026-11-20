import { get, post, put } from './client';
import type { TripBill, TripBillStatus, TripBillSummary, UpdateTripBillBody } from '../types/api.types';

export interface TripBillFilters {
  status?: TripBillStatus;
  loadProviderId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
export interface TripBillsResponse { data: TripBill[]; summary: TripBillSummary }

export const getTripBills = (f: TripBillFilters = {}) =>
  get<TripBillsResponse>('/api/trip-bills', { page: 1, pageSize: 200, ...f });

export const updateTripBill = (id: string, body: UpdateTripBillBody) => put<TripBill>(`/api/trip-bills/${id}`, body);

export const generateMissingBills = () => post<{ created: number }>('/api/trip-bills/generate-missing', {});
