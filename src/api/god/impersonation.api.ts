import { gGet, gPost } from './client';
import type { ImpersonationSessionRow, StartImpersonationResponse } from '../../types/god.types';

export function startImpersonation(
  orgId: string,
  body: { targetUserId?: string; reason: string },
): Promise<StartImpersonationResponse> {
  return gPost<StartImpersonationResponse>(`/platform/organisations/${orgId}/impersonate`, body);
}

export function endImpersonation(sessionId: string): Promise<void> {
  return gPost(`/platform/impersonation/${sessionId}/end`);
}

export function getActiveImpersonations(): Promise<ImpersonationSessionRow[]> {
  return gGet<{ data: ImpersonationSessionRow[] }>('/platform/impersonation/active').then((r) => r.data);
}
