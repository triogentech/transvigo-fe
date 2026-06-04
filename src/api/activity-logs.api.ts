import { getPage } from './client';
import type { ActivityLog, ActivityLogFilters, PaginatedResponse } from '../types/api.types';

export const getActivityLogs = (_filters?: ActivityLogFilters): Promise<PaginatedResponse<ActivityLog>> =>
  getPage<ActivityLog>('/api/activity-logs', { page: 1, pageSize: 100 });
