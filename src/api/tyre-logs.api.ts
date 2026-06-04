import { getPage, get, post, put, del } from './client';
import type { TyreLog, PaginationParams, PaginatedResponse, CreateTyreLogBody } from '../types/api.types';
export type { CreateTyreLogBody };

export type TyreLogParams = PaginationParams & {
  vehicleId?: string;
};

export const getTyreLogs = (_params?: TyreLogParams): Promise<PaginatedResponse<TyreLog>> =>
  getPage<TyreLog>('/api/tyre-logs', { page: 1, pageSize: 100 });

export const getTyreLogById = (id: string) => get<TyreLog>(`/api/tyre-logs/${id}`);
export const createTyreLog = (body: CreateTyreLogBody) => post<TyreLog>('/api/tyre-logs', body);
export const updateTyreLog = (id: string, body: Partial<CreateTyreLogBody>) =>
  put<TyreLog>(`/api/tyre-logs/${id}`, body);
export const deleteTyreLog = (id: string) => del<void>(`/api/tyre-logs/${id}`);
