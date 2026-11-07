import { gGet, gPut } from './client';

export interface AppVersionPolicy {
  id: string;
  app: 'driver';
  platform: 'android';
  latestVersion: string;
  latestVersionCode: number;
  minimumSupportedVersion: string;
  minimumSupportedVersionCode: number;
  enforceMinimum: boolean;
  updateMessage: string | null;
  releaseNotes: string[];
  storeUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  updatedByEmail: string | null;
  updatedAt: string;
}

export type AppVersionPolicyInput = Omit<AppVersionPolicy, 'id' | 'updatedByEmail' | 'updatedAt'>;

export function getAppVersionPolicies(): Promise<AppVersionPolicy[]> {
  return gGet<{ data: AppVersionPolicy[] }>('/platform/app-config/versions').then((r) => r.data);
}

export function saveAppVersionPolicy(body: AppVersionPolicyInput): Promise<AppVersionPolicy> {
  return gPut<AppVersionPolicy>('/platform/app-config/version', body);
}
