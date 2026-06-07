import { getPage, post, put } from './client';
import type {
  SparePart,
  CreateSparePartBody,
  StockAdjustmentBody,
  PaginatedResponse,
} from '../types/api.types';

export type { CreateSparePartBody };

export const getSpareParts = (): Promise<PaginatedResponse<SparePart>> =>
  getPage<SparePart>('/api/spare-parts', { page: 1, pageSize: 100 });

export const createSparePart = (body: CreateSparePartBody) =>
  post<SparePart>('/api/spare-parts', body);

export const updateSparePart = (id: string, body: Partial<CreateSparePartBody>) =>
  put<SparePart>(`/api/spare-parts/${id}`, body);

export const adjustStock = (id: string, body: StockAdjustmentBody) =>
  post<SparePart>(`/api/spare-parts/${id}/stock-adjustment`, body);
