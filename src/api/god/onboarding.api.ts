import { gGetPage, gPost } from './client';
import type { OnboardingRequest, CreateOrgBody, OnboardingStatus } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

export interface OnboardingListParams {
  status?: OnboardingStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateOnboardingRequestBody {
  companyName: string;
  companyEmail: string;
  contactName: string;
  contactPhone: string;
  plan: string;
  notes?: string;
}

export function getOnboardingRequests(params?: OnboardingListParams): Promise<PaginatedResponse<OnboardingRequest>> {
  return gGetPage<OnboardingRequest>('/platform/onboarding-requests', params);
}

export function approveRequest(requestId: string, body: CreateOrgBody): Promise<void> {
  return gPost(`/platform/onboarding-requests/${requestId}/approve`, body);
}

export function rejectRequest(requestId: string, reason: string): Promise<void> {
  return gPost(`/platform/onboarding-requests/${requestId}/reject`, { reason });
}

export function createRequest(body: CreateOnboardingRequestBody): Promise<OnboardingRequest> {
  return gPost<OnboardingRequest>('/platform/onboarding-requests', body);
}
