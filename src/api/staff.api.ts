import { getPage, get, post, put, del } from './client';
import type { Staff, PaginationParams, PaginatedResponse, CreateStaffBody } from '../types/api.types';
export type { CreateStaffBody };

export const getStaff = (_params?: PaginationParams): Promise<PaginatedResponse<Staff>> =>
  getPage<Staff>('/api/staff', { page: 1, pageSize: 100 });

export const getStaffById = (id: string) => get<Staff>(`/api/staff/${id}`);
export const createStaff = (body: CreateStaffBody) => post<Staff>('/api/staff', body);
export const updateStaff = (id: string, body: Partial<CreateStaffBody>) =>
  put<Staff>(`/api/staff/${id}`, body);
export const deleteStaff = (id: string) => del<void>(`/api/staff/${id}`);
