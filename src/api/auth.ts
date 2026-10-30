import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  return client.post('/auth/login', body) as Promise<TokenResponse>;
}
