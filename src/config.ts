export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME ?? 'Transvigo',
  tokenKeys: {
    access: 'rrc_access_token',
    refresh: 'rrc_refresh_token',
    orgSlug: 'rrc_org_slug',
  },
} as const;
