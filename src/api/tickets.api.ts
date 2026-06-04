import { getPage, get, post, put } from './client';
import type { CreateTicketBody, PaginatedResponse, Ticket, TicketStatus } from '../types/api.types';

/** Fetch up to 100 tickets; the page filters/paginates client-side. */
export const getTickets = (): Promise<PaginatedResponse<Ticket>> =>
  getPage<Ticket>('/api/tickets', { page: 1, pageSize: 100 });

export const getTicket = (id: string) => get<Ticket>(`/api/tickets/${id}`);

export const createTicket = (body: CreateTicketBody) => post<Ticket>('/api/tickets', body);

export const changeTicketStatus = (id: string, status: TicketStatus, note?: string) =>
  put<{ ticket: Ticket }>(`/api/tickets/${id}/status`, { status, note });
