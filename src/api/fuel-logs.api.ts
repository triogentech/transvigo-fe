import { getPage, get, post, put, del } from './client';
import type { FuelLog, PaginationParams, PaginatedResponse, CreateFuelLogBody } from '../types/api.types';
export type { CreateFuelLogBody };

export type FuelLogParams = PaginationParams & {
  vehicleId?: string;
  tripId?: string;
  fuelStationId?: string;
};

export const getFuelLogs = (_params?: FuelLogParams): Promise<PaginatedResponse<FuelLog>> =>
  getPage<FuelLog>('/api/fuel-logs', { page: 1, pageSize: 100 });

export const getFuelLogById = (id: string) => get<FuelLog>(`/api/fuel-logs/${id}`);
export const createFuelLog = (body: CreateFuelLogBody) => post<FuelLog>('/api/fuel-logs', body);
export const updateFuelLog = (id: string, body: Partial<CreateFuelLogBody>) =>
  put<FuelLog>(`/api/fuel-logs/${id}`, body);
export const deleteFuelLog = (id: string) => del<void>(`/api/fuel-logs/${id}`);
