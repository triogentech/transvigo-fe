import { getPage, get, post, put, del } from './client';
import type { FuelStation, PaginationParams, PaginatedResponse, CreateFuelStationBody } from '../types/api.types';
export type { CreateFuelStationBody };

export type FuelStationParams = PaginationParams & {
  cityId?: string;
  isActive?: boolean;
};

export const getFuelStations = (_params?: FuelStationParams): Promise<PaginatedResponse<FuelStation>> =>
  getPage<FuelStation>('/api/fuel-stations', { page: 1, pageSize: 100 });

export const getFuelStationById = (id: string) => get<FuelStation>(`/api/fuel-stations/${id}`);
export const createFuelStation = (body: CreateFuelStationBody) => post<FuelStation>('/api/fuel-stations', body);
export const updateFuelStation = (id: string, body: Partial<CreateFuelStationBody>) =>
  put<FuelStation>(`/api/fuel-stations/${id}`, body);
export const deleteFuelStation = (id: string) => del<void>(`/api/fuel-stations/${id}`);
