import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { config } from '../config';
import * as authApi from '../api/auth.api';
import type { AccessTokenPayload, AuthUser, LoginRequest } from '../types/api.types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  logout: () => void;
  changePassword: (body: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

const { access, refresh, orgSlug, ...rest } = config.tokenKeys as Record<string, string>;
void rest;
const USER_KEY = 'rrc_user';

function decode(token: string): AccessTokenPayload | null {
  try { return jwtDecode<AccessTokenPayload>(token); } catch { return null; }
}

/** Rebuilds AuthUser from the access token (orgId/roleId/roleName/id) plus the
 *  stored profile blob (email/username). Returns null if no/expired token. */
function userFromStorage(): AuthUser | null {
  const token = localStorage.getItem(access);
  if (!token) return null;
  const payload = decode(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) return null;
  let profile: { email?: string; username?: string; mustChangePwd?: boolean; orgName?: string } = {};
  try { profile = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}'); } catch { /* ignore */ }
  return {
    id: payload.sub,
    orgId: payload.orgId,
    orgName: profile.orgName ?? '',
    roleId: payload.roleId,
    roleName: payload.roleName,
    email: profile.email ?? '',
    username: profile.username ?? '',
    mustChangePwd: profile.mustChangePwd ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initial session restore.
  useEffect(() => {
    setUser(userFromStorage());
    setIsLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(access);
    localStorage.removeItem(refresh);
    localStorage.removeItem(orgSlug);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    void authApi.logout().catch(() => undefined); // best-effort
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await authApi.login(body);
    localStorage.setItem(access, res.accessToken);
    localStorage.setItem(refresh, res.refreshToken);
    localStorage.setItem(orgSlug, res.orgSlug ?? body.orgSlug ?? '');
    localStorage.setItem(USER_KEY, JSON.stringify({
      email: res.user.email, username: res.user.username, mustChangePwd: false,
      orgName: res.orgName,
    }));
    const restored = userFromStorage();
    setUser(restored);
    navigate('/', { replace: true });
  }, [navigate]);

  const changePassword = useCallback(async (body: { currentPassword: string; newPassword: string }) => {
    await authApi.changePassword(body);
    const profile = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}');
    localStorage.setItem(USER_KEY, JSON.stringify({ ...profile, mustChangePwd: false }));
    setUser((u) => (u ? { ...u, mustChangePwd: false } : u));
    navigate('/', { replace: true });
  }, [navigate]);

  // Axios interceptor → logout on hard 401 / refresh failure.
  useEffect(() => {
    const onLogout = () => { clearSession(); navigate('/login', { replace: true }); };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [clearSession, navigate]);

  // Axios interceptor → server says password change required.
  useEffect(() => {
    const onMustChange = () => {
      const profile = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}');
      localStorage.setItem(USER_KEY, JSON.stringify({ ...profile, mustChangePwd: true }));
      setUser((u) => (u ? { ...u, mustChangePwd: true } : u));
    };
    window.addEventListener('auth:mustChangePwd', onMustChange);
    return () => window.removeEventListener('auth:mustChangePwd', onMustChange);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, changePassword }}>
      {children}
    </AuthCtx.Provider>
  );
}
