import { gGet } from './client';
import type { OrgBilling, OrgWithStats, PlatformAdminPublic } from '../../types/god.types';

export interface GodDashboardPage {
  stats: {
    totalOrgs: number; activeOrgs: number; suspendedOrgs: number;
    totalUsers: number; totalVehicles: number;
    tripsThisMonth: number; tripsLastMonth: number; tripsGrowthPct: number;
    platformAdminCount: number;
  };
  planDistribution: Array<{ plan: string; count: number }>;
  orgGrowth: Array<{ month: string; newOrgs: number }>;
  mostActiveOrgs: Array<{ id: string; name: string; slug: string; plan: string; tripsThisMonth: number; lastActivityAt: string | null }>;
  recentOnboardings: Array<{ id: string; name: string; slug: string; plan: string; adminEmail: string | null; createdAt: string }>;
  recentPlatformActions: Array<{ id: string; action: string; targetType: string; platformAdmin: { fullName: string; role: string }; createdAt: string }>;
  activeImpersonations: Array<{ sessionId: string; targetOrg: { name: string }; targetUser: { username: string } | null; platformAdmin: { fullName: string }; startedAt: string; expiresAt: string }>;
}
export const getGodDashboardPage = () => gGet<GodDashboardPage>('/platform/pages/dashboard');

export interface GodOrgsPage {
  organisations: Array<OrgWithStats & {
    tripsThisMonth: number;
    adminUser: { id: string; email: string; username: string } | null;
  }>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: { total: number; active: number; suspended: number; byPlan: { starter: number; pro: number; enterprise: number } };
}
export const getGodOrgsPage = (params?: Record<string, unknown>) =>
  gGet<GodOrgsPage>('/platform/pages/organisations', params);

export interface GodOrgDetailPage {
  organisation: OrgWithStats & { billing: OrgBilling | null; suspendedBy: PlatformAdminPublic | null };
  stats: Record<string, unknown>;
  users: Array<{ id: string; email: string; username: string; isActive: boolean; lastLoginAt: string | null; role: { id: string; name: string } | null }>;
  recentTrips: Array<Record<string, unknown>>;
  activityTimeline: Array<{ date: string; count: number }>;
  recentOrgActivity: Array<{ id: string; action: string; collection: string; recordId: string; note: string; createdAt: string; performedByUser: { username: string } | null }>;
  recentPlatformActions: Array<{ id: string; action: string; createdAt: string; platformAdmin: { fullName: string; role: string } }>;
  activeImpersonations: Array<{ sessionId: string; platformAdmin: { fullName: string }; targetUser: { username: string } | null; startedAt: string; expiresAt: string }>;
  onboardingRequest: Record<string, unknown> | null;
}
export const getGodOrgDetailPage = (orgId: string) =>
  gGet<GodOrgDetailPage>(`/platform/pages/org-detail/${orgId}`);

export const getGodOrgDetailTab = (orgId: string, tab: string, params?: Record<string, unknown>) =>
  gGet<{ data: unknown[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(`/platform/pages/org-detail/${orgId}/tab/${tab}`, params);
