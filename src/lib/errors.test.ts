import { describe, it, expect } from 'vitest';
import { parseFieldPath, isApiError, getErrorMessage } from './errors';
import { ApiError } from '../api/ApiError';

describe('error utilities', () => {
  it('parses simple field path', () => {
    expect(parseFieldPath('code')).toEqual(['code']);
    expect(parseFieldPath('name')).toEqual(['name']);
  });

  it('parses nested array field path', () => {
    expect(parseFieldPath('bonuses[0].amount')).toEqual(['bonuses', 0, 'amount']);
    expect(parseFieldPath('appQuotas[2].quotaMb')).toEqual(['appQuotas', 2, 'quotaMb']);
  });

  it('correctly identifies ApiError instances', () => {
    const apiError = new ApiError({
      httpStatus: 400,
      code: 1101,
      message: 'Plan not found',
    });
    const regularError = new Error('Regular error');

    expect(isApiError(apiError)).toBe(true);
    expect(isApiError(regularError)).toBe(false);
    expect(isApiError('error string')).toBe(false);
  });

  it('extracts error messages accurately', () => {
    const apiError = new ApiError({
      httpStatus: 400,
      code: 1101,
      message: 'Plan not found',
    });
    expect(getErrorMessage(apiError)).toBe('Plan not found');
    expect(getErrorMessage(new Error('Something failed'))).toBe('Something failed');
    expect(getErrorMessage('unknown')).toBe('Có lỗi không mong muốn');
  });
});
