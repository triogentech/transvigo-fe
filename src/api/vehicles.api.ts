import { getPage, get, post, put, del } from './client';
import type { Vehicle, VehicleFilters, PaginatedResponse, CreateVehicleBody } from '../types/api.types';
export type { CreateVehicleBody };

export const getVehicles = (_filters?: VehicleFilters): Promise<PaginatedResponse<Vehicle>> =>
  getPage<Vehicle>('/api/vehicles', { page: 1, pageSize: 100 });

export const getVehicleById = (id: string) => get<Vehicle>(`/api/vehicles/${id}`);
export const createVehicle = (body: CreateVehicleBody) => post<Vehicle>('/api/vehicles', body);
export const updateVehicle = (id: string, body: Partial<CreateVehicleBody>) =>
  put<Vehicle>(`/api/vehicles/${id}`, body);
export const deleteVehicle = (id: string) => del<void>(`/api/vehicles/${id}`);
