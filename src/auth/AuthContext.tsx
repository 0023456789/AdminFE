import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { changePassword as changePasswordRequest, login as loginRequest } from '../api/auth';
import {
  AUTH_EXPIRED_EVENT,
  clearAccessToken,
  getTokenRoles,
  getTokenUsername,
  isPasswordChangeRequired,
  isTokenExpired,
  readAccessToken,
  ACCESS_TOKEN_KEY,
} from './session';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  roles: string[];
  canWrite: boolean;
  canDelete: boolean;
  /** Phải đổi mật khẩu ban đầu trước khi dùng các trang khác (ADM-07). */
  passwordChangeRequired: boolean;
  login: (username: string, password: string) => Promise<{ passwordChangeRequired: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
    const passwordChangeRequired = isPasswordChangeRequired(token);
    // Token bắt đổi mật khẩu không được backend cấp role nào, nên FE cũng không mở quyền ghi/xoá.
    const roles = passwordChangeRequired ? [] : getTokenRoles(token);
    const storeToken = (accessToken: string) => {
      window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      setToken(accessToken);
    };
    return {
      token,
      username: getTokenUsername(token),
      roles,
      canWrite: roles.includes('ADMIN') || roles.includes('OPERATOR'),
      canDelete: roles.includes('ADMIN'),
      passwordChangeRequired,
      login: async (username, password) => {
        const response = await loginRequest({ username, password });
        storeToken(response.accessToken);
        return { passwordChangeRequired: response.passwordChangeRequired === true };
      },
      changePassword: async (currentPassword, newPassword) => {
        const response = await changePasswordRequest({ currentPassword, newPassword });
        storeToken(response.accessToken);
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
