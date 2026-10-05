import { ApiError } from '../api/ApiError';

/**
 * Parse a FieldError.field path into an Ant Design Form name path.
 * Example: 'bonuses[0].amount' -> ['bonuses', 0, 'amount']
 * Example: 'code' -> ['code']
 */
export function parseFieldPath(field: string): (string | number)[] {
  const parts: (string | number)[] = [];
  const regex = /([^[.]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(field)) !== null) {
    if (match[1] !== undefined) {
      parts.push(match[1]);
    } else if (match[2] !== undefined) {
      parts.push(Number(match[2]));
    }
  }
  return parts;
}

/**
 * Check if an error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extract a user-friendly message from any error.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Có lỗi không mong muốn';
}
