import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gGet, gPost, GOD_KEYS } from '../api/god/client';
import type { PlatformAdminPublic, PlatformLoginResponse } from '../types/god.types';

interface PlatformAuthValue {
  admin: PlatformAdminPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isSupportAdmin: boolean;
  isBillingAdmin: boolean;
  login: (body: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<PlatformAuthValue | null>(null);
export function usePlatformAuth(): PlatformAuthValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlatformAuth must be used within <PlatformAuthProvider>');
  return c;
}

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdminPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session: if a god token exists, fetch /platform/auth/me.
  useEffect(() => {
    const token = localStorage.getItem(GOD_KEYS.access);
    if (!token) { setIsLoading(false); return; }
    gGet<PlatformAdminPublic>('/platform/auth/me')
      .then(setAdmin)
      .catch(() => { /* interceptor handles refresh/logout */ })
      .finally(() => setIsLoading(false));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(GOD_KEYS.access);
    localStorage.removeItem(GOD_KEYS.refresh);
    setAdmin(null);
  }, []);

  const login = useCallback(async (body: { email: string; password: string }) => {
    const res = await gPost<PlatformLoginResponse>('/platform/auth/login', body);
    localStorage.setItem(GOD_KEYS.access, res.accessToken);
    localStorage.setItem(GOD_KEYS.refresh, res.refreshToken);
    setAdmin(res.admin);
    navigate('/god', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    void gPost('/platform/auth/logout').catch(() => undefined);
    clearSession();
    navigate('/god/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    const onLogout = () => { clearSession(); navigate('/god/login', { replace: true }); };
    window.addEventListener('platform:logout', onLogout);
    return () => window.removeEventListener('platform:logout', onLogout);
  }, [clearSession, navigate]);

  const role = admin?.role;
  return (
    <Ctx.Provider value={{
      admin,
      isAuthenticated: !!admin,
      isLoading,
      isSuperAdmin: role === 'SUPER_ADMIN',
      isSupportAdmin: role === 'SUPPORT_ADMIN' || role === 'SUPER_ADMIN',
      isBillingAdmin: role === 'BILLING_ADMIN' || role === 'SUPER_ADMIN',
      login,
      logout,
    }}>
      {children}
    </Ctx.Provider>
  );
}
