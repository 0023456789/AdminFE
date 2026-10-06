import { describe, it, expect } from 'vitest';
import client from './client';
import { ApiError } from './ApiError';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';

describe('client axios interceptors', () => {
  it('has base URL configured', () => {
    expect(client.defaults.baseURL).toBeDefined();
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('unwraps result when code is 1000', async () => {
    server.use(
      http.get('/api/v1/test-success', () => {
        return HttpResponse.json({ code: 1000, result: { success: true } });
      })
    );

    const response = await client.get('/test-success');
    expect(response).toEqual({ success: true }); // interceptor returns data.result
  });

  it('throws ApiError when code is not 1000', async () => {
    server.use(
      http.get('/api/v1/test-business-error', () => {
        return HttpResponse.json({ code: 1101, message: 'Business rule failed' }, { status: 400 });
      })
    );

    try {
      await client.get('/test-business-error');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.code).toBe(1101);
      expect(apiError.httpStatus).toBe(400);
      expect(apiError.message).toBe('Business rule failed');
    }
  });

  it('throws ApiError with code 9999 on network error', async () => {
    server.use(
      http.get('/api/v1/test-network-error', () => {
        return HttpResponse.error();
      })
    );

    try {
      await client.get('/test-network-error');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.code).toBe(9999);
      expect(apiError.message).toBe('Không kết nối được máy chủ');
    }
  });
});
