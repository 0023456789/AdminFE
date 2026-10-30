export const ACCESS_TOKEN_KEY = 'adminsky.accessToken';
export const AUTH_EXPIRED_EVENT = 'adminsky:auth-expired';

export function readAccessToken(): string | null {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getTokenRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = token.split('.')[1];
    if (!payload) return [];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(window.atob(normalized)) as { roles?: unknown };
    return Array.isArray(claims.roles)
      ? claims.roles.filter((role): role is string => typeof role === 'string')
      : [];
  } catch {
    return [];
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(window.atob(normalized)) as { exp?: unknown };
    return typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
