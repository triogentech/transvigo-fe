import { getPage, get, post, put, del } from './client';
import type { Trip, TripFilters, PaginatedResponse, CreateTripBody, TripStatus } from '../types/api.types';
export type { CreateTripBody };

// transvigo-be has no server-side filtering: we fetch up to 100 rows and the
// hooks filter/paginate client-side. The trips list endpoint already includes
// driver/vehicle/loadProvider/touchingLocations by default (no ?include needed).
export const getTrips = (_filters?: TripFilters): Promise<PaginatedResponse<Trip>> =>
  getPage<Trip>('/api/trips', { page: 1, pageSize: 100 });

export const getTripById = (id: string) => get<Trip>(`/api/trips/${id}`);
export const createTrip = (body: CreateTripBody) => post<Trip>('/api/trips', body);
export const updateTrip = (id: string, body: Partial<CreateTripBody>) =>
  put<Trip>(`/api/trips/${id}`, body);

// The status endpoint expects the hyphenated public value (created|in-transit|completed).
const STATUS_WIRE: Record<TripStatus, 'created' | 'in-transit' | 'completed'> = {
  created: 'created', in_transit: 'in-transit', completed: 'completed',
};
export const updateTripStatus = (id: string, status: TripStatus) =>
  put<Trip>(`/api/trips/${id}/status`, { status: STATUS_WIRE[status] });

export const deleteTrip = (id: string) => del<void>(`/api/trips/${id}`);
