import { getPage, get, post, put, del } from './client';
import type { TollLog, PaginationParams, PaginatedResponse, CreateTollLogBody } from '../types/api.types';
export type { CreateTollLogBody };

export type TollLogParams = PaginationParams & {
  tripId?: string;
  vehicleId?: string;
};

export const getTollLogs = (_params?: TollLogParams): Promise<PaginatedResponse<TollLog>> =>
  getPage<TollLog>('/api/toll-logs', { page: 1, pageSize: 100 });

export const getTollLogById = (id: string) => get<TollLog>(`/api/toll-logs/${id}`);
export const createTollLog = (body: CreateTollLogBody) => post<TollLog>('/api/toll-logs', body);
export const updateTollLog = (id: string, body: Partial<CreateTollLogBody>) =>
  put<TollLog>(`/api/toll-logs/${id}`, body);
export const deleteTollLog = (id: string) => del<void>(`/api/toll-logs/${id}`);
