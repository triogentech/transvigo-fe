import { gGet, gPost, gPatch, gDel } from './client';
import type { PlatformAdminPublic, PlatformRole } from '../../types/god.types';

export interface CreateAdminBody {
  email: string;
  username: string;
  fullName: string;
  role: PlatformRole;
  password: string;
}

export interface UpdateAdminBody {
  fullName?: string;
  role?: PlatformRole;
  isActive?: boolean;
}

export function getAdmins(): Promise<PlatformAdminPublic[]> {
  return gGet<{ data: PlatformAdminPublic[] }>('/platform/admins').then((r) => r.data);
}

export function createAdmin(body: CreateAdminBody): Promise<PlatformAdminPublic> {
  return gPost<PlatformAdminPublic>('/platform/admins', body);
}

export function updateAdmin(adminId: string, body: UpdateAdminBody): Promise<PlatformAdminPublic> {
  return gPatch<PlatformAdminPublic>(`/platform/admins/${adminId}`, body);
}

export function deleteAdmin(adminId: string): Promise<void> {
  return gDel(`/platform/admins/${adminId}`);
}
