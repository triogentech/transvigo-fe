import { getPage, get, post, put, del } from './client';
import type { Driver, DriverFilters, PaginatedResponse, CreateDriverBody } from '../types/api.types';
export type { CreateDriverBody };

export const getDrivers = (_filters?: DriverFilters): Promise<PaginatedResponse<Driver>> =>
  getPage<Driver>('/api/drivers', { page: 1, pageSize: 100 });

export const getDriverById = (id: string) => get<Driver>(`/api/drivers/${id}`);
export const createDriver = (body: CreateDriverBody) => post<Driver>('/api/drivers', body);
export const updateDriver = (id: string, body: Partial<CreateDriverBody>) =>
  put<Driver>(`/api/drivers/${id}`, body);
export const deleteDriver = (id: string) => del<void>(`/api/drivers/${id}`);

export interface DriverCredentials {
  username: string;
  email: string;
  password: string;
  role: string;
}
/** Admin/Staff/Operations: create a Driver login (username = phone, pwd = FirstName#12345). */
export const createDriverCredentials = (driverId: string, body?: { email?: string }) =>
  post<DriverCredentials>(`/api/driver-credentials/${driverId}`, body ?? {});
export const resetDriverPassword = (driverId: string) =>
  post<{ password: string }>(`/api/driver-credentials/${driverId}/reset-password`, {});
