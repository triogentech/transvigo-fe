import { gGet } from './client';
import type { PlatformStats } from '../../types/god.types';

export function getPlatformStats(): Promise<PlatformStats> {
  return gGet<PlatformStats>('/platform/stats');
}
