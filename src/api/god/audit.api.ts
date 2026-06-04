import { gGetPage } from './client';
import type { PlatformAuditEntry } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

export interface AuditLogParams {
  action?: string;
  targetType?: string;
  adminId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function getAuditLogs(params?: AuditLogParams): Promise<PaginatedResponse<PlatformAuditEntry>> {
  return gGetPage<PlatformAuditEntry>('/platform/audit-logs', params);
}
