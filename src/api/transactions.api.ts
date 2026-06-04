import { getPage, get, post, put, del } from './client';
import type { Transaction, TransactionFilters, PaginatedResponse, CreateTransactionBody } from '../types/api.types';
export type { CreateTransactionBody };

export const getTransactions = (_filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> =>
  getPage<Transaction>('/api/transactions', { page: 1, pageSize: 100 });

export const getTransactionById = (id: string) => get<Transaction>(`/api/transactions/${id}`);
export const createTransaction = (body: CreateTransactionBody) => post<Transaction>('/api/transactions', body);
export const updateTransaction = (id: string, body: Partial<CreateTransactionBody>) =>
  put<Transaction>(`/api/transactions/${id}`, body);
export const deleteTransaction = (id: string) => del<void>(`/api/transactions/${id}`);
