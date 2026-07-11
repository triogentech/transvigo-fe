import { getPage, get, post, put, del } from './client';
import type {
  SparePart,
  CreateSparePartBody,
  StockAdjustmentBody,
  SpareIssueSlip,
  CreateIssueSlipBody,
  PaginatedResponse,
} from '../types/api.types';

export type { CreateSparePartBody, CreateIssueSlipBody };

export const getSpareParts = (): Promise<PaginatedResponse<SparePart>> =>
  getPage<SparePart>('/api/spare-parts', { page: 1, pageSize: 100 });

// Detail — includes `usages` (the issue-slip line items that drew this part).
export const getSparePart = (id: string) => get<SparePart>(`/api/spare-parts/${id}`);

export const createSparePart = (body: CreateSparePartBody) =>
  post<SparePart>('/api/spare-parts', body);

export const updateSparePart = (id: string, body: Partial<CreateSparePartBody> & { isActive?: boolean }) =>
  put<SparePart>(`/api/spare-parts/${id}`, body);

export const deleteSparePart = (id: string) => del<void>(`/api/spare-parts/${id}`);

export const adjustStock = (id: string, body: StockAdjustmentBody) =>
  post<SparePart>(`/api/spare-parts/${id}/stock-adjustment`, body);

// ── Spare-part issue slips (free-text line items) ──
export const getIssueSlips = (): Promise<PaginatedResponse<SpareIssueSlip>> =>
  getPage<SpareIssueSlip>('/api/spare-issue-slips', { page: 1, pageSize: 100 });

export const createIssueSlip = (body: CreateIssueSlipBody) =>
  post<SpareIssueSlip>('/api/spare-issue-slips', body);
