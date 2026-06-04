// ── God Mode (platform owner) types — match transvigo-be /platform/* ──
import type { PaginatedResponse } from './api.types';

export type PlatformRole = 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'BILLING_ADMIN';
export type PlanName = 'starter' | 'pro' | 'enterprise';
export type OnboardingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface PlatformAdminPublic {
  id: string; email: string; username: string; fullName: string; role: PlatformRole;
  isActive?: boolean; lastLoginAt?: string | null; mfaEnabled?: boolean; createdAt?: string;
}

export interface PlatformLoginResponse {
  accessToken: string; refreshToken: string; admin: PlatformAdminPublic;
}

export interface OrgBilling {
  id: string; orgId: string; plan: string;
  maxUsers: number; maxVehicles: number; maxTripsPerMonth: number;
  billingEmail?: string | null; billingCycle: string;
  trialEndsAt?: string | null; subscriptionId?: string | null; isTrialing: boolean;
}

export interface OrgWithStats {
  id: string; name: string; slug: string; plan: string; isActive: boolean;
  suspendedAt?: string | null; suspendedReason?: string | null;
  createdAt: string; updatedAt: string;
  billing?: OrgBilling | null;
  _count?: { users: number; vehicles: number; trips: number; drivers: number };
  lastActivityAt?: string | null;
}

export interface OrgUserRow {
  id: string; email: string; username: string; roleId: string; isActive: boolean;
  lastLoginAt?: string | null; role?: { name: string };
}

export interface OrgDetail extends OrgWithStats {
  users?: OrgUserRow[];
  recentTrips?: Array<Record<string, unknown>>;
}

export interface OrgStats {
  totalUsers: number; activeUsers: number;
  totalVehicles: number; vehiclesByStatus: Record<string, number>;
  totalDrivers: number; driversByStatus: Record<string, number>;
  totalTrips: number; tripsByStatus: Record<string, number>;
  tripsThisMonth: number; tripsLastMonth: number;
  revenueMtd: number; totalFuelSpend: number;
  recentTrips: Array<Record<string, unknown>>;
  activityTimeline: Array<{ date: string; count: number }>;
}

export interface PlatformStats {
  totalOrgs: number; activeOrgs: number; suspendedOrgs: number;
  totalUsers: number; totalVehicles: number; totalTrips: number;
  tripsThisMonth: number; tripsLastMonth: number;
  orgGrowth: Array<{ month: string; count: number }>;
  planDistribution: { starter: number; pro: number; enterprise: number };
  mostActiveOrgs: Array<{ orgId: string; name: string; plan: string; tripsMtd: number }>;
  recentOnboardings: Array<{ id: string; name: string; slug: string; plan: string; createdAt: string }>;
}

export interface ImpersonationSessionRow {
  id: string; reason: string; startedAt: string;
  platformAdmin?: { fullName: string; email: string };
  targetOrg?: { name: string; slug: string };
  targetUser?: { id: string; username: string; email: string } | null;
}

export interface StartImpersonationResponse {
  impersonationToken: string; sessionId: string; expiresAt: string;
  targetUser: { id: string; email: string; username: string; roleName: string };
}

export interface ImpersonationMeta {
  sessionId: string; expiresAt: string; reason: string;
  targetUser: { id: string; email: string; username: string; roleName: string };
  targetOrg: { id: string; name: string; slug: string };
}

export interface OnboardingRequest {
  id: string; companyName: string; companyEmail: string;
  contactName: string; contactPhone: string; plan: string; notes?: string | null;
  status: OnboardingStatus; rejectionReason?: string | null;
  orgId?: string | null; processedBy?: string | null; processedAt?: string | null;
  createdAt: string;
}

export interface PlatformAuditEntry {
  id: string; platformAdminId: string; action: string;
  targetType: string; targetId?: string | null;
  payload: Record<string, unknown>; result?: Record<string, unknown> | null;
  ipAddress: string; userAgent: string; createdAt: string;
  platformAdmin?: { id: string; fullName: string; email: string; role: PlatformRole };
}

export interface CreateOrgBody {
  name: string; slug: string; plan: PlanName;
  adminEmail: string; adminUsername: string; adminFullName: string;
  contactPhone?: string; billingEmail?: string;
  maxUsers?: number; maxVehicles?: number; notes?: string; trialDays?: number;
}

export interface CreateOrgResult {
  organisation: OrgWithStats;
  adminUser: { id: string; email: string; username: string };
  tempPassword: string;
}

export type GodPaginated<T> = PaginatedResponse<T>;
