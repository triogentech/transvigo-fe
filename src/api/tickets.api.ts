import { getPage, get, post, put } from './client';
import type { CreateTicketBody, PaginatedResponse, Ticket, TicketMessage, TicketStatus } from '../types/api.types';

/** Fetch up to 100 tickets; the page filters/paginates client-side. */
export const getTickets = (): Promise<PaginatedResponse<Ticket>> =>
  getPage<Ticket>('/api/tickets', { page: 1, pageSize: 100 });

export const getTicket = (id: string) => get<Ticket>(`/api/tickets/${id}`);

export const createTicket = (body: CreateTicketBody) => post<Ticket>('/api/tickets', body);

export const changeTicketStatus = (id: string, status: TicketStatus, note?: string) =>
  put<{ ticket: Ticket }>(`/api/tickets/${id}/status`, { status, note });

export const getTicketMessages = (id: string) => get<TicketMessage[]>(`/api/tickets/${id}/messages`);

/** The office's first message acknowledges an open ticket. */
export const postTicketMessage = (id: string, body: string) =>
  post<{ message: TicketMessage; acknowledgedNow: boolean; ticket: Ticket }>(`/api/tickets/${id}/messages`, { body });

/** Resolve from wherever the ticket is; the optional note is shown to the driver as the last message. */
export const resolveTicket = (id: string, note?: string) => put<Ticket>(`/api/tickets/${id}/resolve`, { note: note || undefined });

export const assignTicket = (id: string, assignedTo: string) =>
  put<{ ticket: Ticket }>(`/api/tickets/${id}/assign`, { assignedTo });
