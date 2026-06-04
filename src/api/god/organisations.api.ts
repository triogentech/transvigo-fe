import { gGet, gGetPage, gPost, gPatch, gDel } from './client';
import type { OrgWithStats, OrgDetail, OrgStats, OrgUserRow, CreateOrgBody, CreateOrgResult } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

export interface OrgListParams {
  search?: string;
  plan?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export function getOrganisations(params?: OrgListParams): Promise<PaginatedResponse<OrgWithStats>> {
  return gGetPage<OrgWithStats>('/platform/organisations', params);
}

export function getOrganisation(orgId: string): Promise<OrgDetail> {
  return gGet<OrgDetail>(`/platform/organisations/${orgId}`);
}

export function createOrganisation(body: CreateOrgBody): Promise<CreateOrgResult> {
  return gPost<CreateOrgResult>('/platform/organisations', body);
}

export function updateOrganisation(orgId: string, body: Partial<CreateOrgBody>): Promise<OrgWithStats> {
  return gPatch<OrgWithStats>(`/platform/organisations/${orgId}`, body);
}

export function suspendOrganisation(orgId: string, reason: string): Promise<void> {
  return gPost(`/platform/organisations/${orgId}/suspend`, { reason });
}

export function reactivateOrganisation(orgId: string): Promise<void> {
  return gPost(`/platform/organisations/${orgId}/reactivate`);
}

export function deleteOrganisation(orgId: string, confirmSlug: string): Promise<void> {
  return gDel(`/platform/organisations/${orgId}`, { confirmSlug });
}

export function getOrgStats(orgId: string): Promise<OrgStats> {
  return gGet<OrgStats>(`/platform/organisations/${orgId}/stats`);
}

export function getOrgUsers(orgId: string, params?: object): Promise<PaginatedResponse<OrgUserRow>> {
  return gGetPage<OrgUserRow>(`/platform/organisations/${orgId}/users`, params);
}

export function getOrgActivity(orgId: string, params?: object): Promise<PaginatedResponse<Record<string, unknown>>> {
  return gGetPage<Record<string, unknown>>(`/platform/organisations/${orgId}/activity`, params);
}

/**
 * NOTE: There is no dedicated slug-availability endpoint on the backend.
 * This fetches up to 100 orgs matching the slug as a search term and checks
 * for an exact slug match in the results.
 */
export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const res = await getOrganisations({ search: slug, pageSize: 100 });
  return !res.data.some((o) => o.slug === slug);
}
