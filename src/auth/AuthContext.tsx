import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest } from '../api/auth';
import { AUTH_EXPIRED_EVENT, clearAccessToken, getTokenRoles, isTokenExpired, readAccessToken, ACCESS_TOKEN_KEY } from './session';

interface AuthContextValue {
  token: string | null;
  roles: string[];
  canWrite: boolean;
  canDelete: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const saved = readAccessToken();
    if (saved && !isTokenExpired(saved)) return saved;
    clearAccessToken();
    return null;
  });

  useEffect(() => {
    const expireSession = () => setToken(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = getTokenRoles(token);
    return {
      token,
      roles,
      canWrite: roles.includes('ADMIN') || roles.includes('OPERATOR'),
      canDelete: roles.includes('ADMIN'),
      login: async (username, password) => {
        const response = await loginRequest({ username, password });
        window.sessionStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
      },
      logout: () => {
        clearAccessToken();
        setToken(null);
      },
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
