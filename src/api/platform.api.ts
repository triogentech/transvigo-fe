import { get, post } from './client';
import type { Organisation } from '../types/api.types';

export const platformLogin = (body: { email: string; password: string }): Promise<{ accessToken: string }> =>
  post<{ accessToken: string }>('/platform/login', body);

export const onboardOrg = (body: {
  name: string;
  slug: string;
  adminEmail: string;
  plan?: string;
}): Promise<unknown> => post('/platform/orgs', body);

export const listOrgs = (): Promise<Organisation[]> =>
  get<{ data: Organisation[] }>('/platform/orgs').then((r) => r.data);
