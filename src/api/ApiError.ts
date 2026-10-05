import type { FieldError } from './types';

export class ApiError extends Error {
  public readonly httpStatus: number;
  public readonly code: number;
  public readonly fieldErrors: FieldError[];

  constructor(params: {
    httpStatus: number;
    code: number;
    message: string;
    fieldErrors?: FieldError[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.httpStatus = params.httpStatus;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors ?? [];
  }

  /** Check if this error has a specific business code */
  hasCode(code: number): boolean {
    return this.code === code;
  }

  /** Check if this is a field validation error */
  get isValidationError(): boolean {
    return this.fieldErrors.length > 0;
  }
}
