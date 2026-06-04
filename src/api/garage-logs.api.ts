import { getPage, get, post, put, del } from './client';
import type { GarageLog, PaginationParams, PaginatedResponse, CreateGarageLogBody } from '../types/api.types';
export type { CreateGarageLogBody };

export type GarageLogParams = PaginationParams & {
  vehicleId?: string;
  garageId?: string;
};

export const getGarageLogs = (_params?: GarageLogParams): Promise<PaginatedResponse<GarageLog>> =>
  getPage<GarageLog>('/api/garage-logs', { page: 1, pageSize: 100 });

export const getGarageLogById = (id: string) => get<GarageLog>(`/api/garage-logs/${id}`);
export const createGarageLog = (body: CreateGarageLogBody) => post<GarageLog>('/api/garage-logs', body);
export const updateGarageLog = (id: string, body: Partial<CreateGarageLogBody>) =>
  put<GarageLog>(`/api/garage-logs/${id}`, body);

export const uploadInvoice = (id: string, file: File): Promise<{ invoiceUrl: string }> => {
  const form = new FormData();
  form.append('file', file);
  return post<{ invoiceUrl: string }>('/api/garage-logs/' + id + '/invoice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteGarageLog = (id: string) => del<void>(`/api/garage-logs/${id}`);
