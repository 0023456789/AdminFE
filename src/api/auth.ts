import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  /** true: token chỉ gọi được POST /auth/change-password cho tới khi đổi mật khẩu (ADM-07). */
  passwordChangeRequired: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Mã lỗi nghiệp vụ của API đổi mật khẩu. */
export const AUTH_ERROR = {
  PASSWORD_POLICY_INVALID: 1604,
  CURRENT_PASSWORD_INCORRECT: 1606,
} as const;

export async function login(body: LoginRequest): Promise<TokenResponse> {
  return client.post('/auth/login', body) as Promise<TokenResponse>;
}

export async function changePassword(body: ChangePasswordRequest): Promise<TokenResponse> {
  return client.post('/auth/change-password', body) as Promise<TokenResponse>;
}
