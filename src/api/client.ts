import axios from 'axios';
import { ApiError } from './ApiError';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: unwrap ApiResponse envelope
client.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Successful envelope: { code: 1000, result: ... }
    if (data && data.code === 1000) {
      return data.result;
    }
    // If code !== 1000 but HTTP was 2xx, treat as business error
    if (data && typeof data.code === 'number') {
      throw new ApiError({
        httpStatus: response.status,
        code: data.code,
        message: data.message ?? 'Có lỗi không mong muốn',
        fieldErrors: Array.isArray(data.result) ? data.result : [],
      });
    }
    // Fallback: return raw data
    return data;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const resp = error.response;
      if (resp?.data && typeof resp.data.code === 'number') {
        // Server returned a structured error
        throw new ApiError({
          httpStatus: resp.status ?? 500,
          code: resp.data.code,
          message: resp.data.message ?? 'Có lỗi không mong muốn',
          fieldErrors: Array.isArray(resp.data.result) ? resp.data.result : [],
        });
      }
      // Network error or non-structured response
      if (!resp) {
        throw new ApiError({
          httpStatus: 0,
          code: 9999,
          message: 'Không kết nối được máy chủ',
        });
      }
      throw new ApiError({
        httpStatus: resp.status,
        code: 9999,
        message: 'Có lỗi không mong muốn',
      });
    }
    throw error;
  },
);

export default client;
