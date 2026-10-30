export const ACCESS_TOKEN_KEY = 'adminsky.accessToken';
export const AUTH_EXPIRED_EVENT = 'adminsky:auth-expired';

export function readAccessToken(): string | null {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

function readClaims(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(window.atob(normalized)) as unknown;
    return claims && typeof claims === 'object' ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function getTokenRoles(token: string | null): string[] {
  const roles = readClaims(token)?.roles;
  return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [];
}

export function getTokenUsername(token: string | null): string | null {
  const subject = readClaims(token)?.sub;
  return typeof subject === 'string' ? subject : null;
}

/** Token của tài khoản còn phải đổi mật khẩu ban đầu: backend chỉ cho gọi /auth/change-password (ADM-07). */
export function isPasswordChangeRequired(token: string | null): boolean {
  return readClaims(token)?.pwd_change_required === true;
}

export function isTokenExpired(token: string): boolean {
  const exp = readClaims(token)?.exp;
  return typeof exp !== 'number' || exp * 1000 <= Date.now();
}
