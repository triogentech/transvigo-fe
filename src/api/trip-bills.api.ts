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

/** Bills older completed trips in batches until none are left; returns how many were created. */
export async function generateMissingBills(): Promise<{ created: number }> {
  let created = 0;
  for (let i = 0; i < 100; i++) {
    const r = await post<{ created: number; remaining: number }>('/api/trip-bills/generate-missing', {});
    created += r.created;
    if (r.remaining === 0 || r.created === 0) break;
  }
  return { created };
}
