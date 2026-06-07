import { getPage, get, post, put } from './client';
import type {
  SupplierInvoice,
  CreateInvoiceBody,
  InvoiceStatus,
  PaginatedResponse,
} from '../types/api.types';

export type { CreateInvoiceBody };

export const getInvoices = (): Promise<PaginatedResponse<SupplierInvoice>> =>
  getPage<SupplierInvoice>('/api/invoices', { page: 1, pageSize: 100 });

export const getInvoiceById = (id: string) => get<SupplierInvoice>(`/api/invoices/${id}`);

export const createInvoice = (body: CreateInvoiceBody) =>
  post<SupplierInvoice>('/api/invoices', body);

export const updateInvoice = (id: string, body: Partial<CreateInvoiceBody>) =>
  put<SupplierInvoice>(`/api/invoices/${id}`, body);

export const recordPayment = (id: string, status: InvoiceStatus, paidAmount?: number) =>
  put<SupplierInvoice>(`/api/invoices/${id}/payment`, { status, paidAmount });
