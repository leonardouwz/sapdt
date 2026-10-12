export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RANGE_OUT_OF_DATA"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly retryable: boolean;

  constructor(p: { status: number; code: ApiErrorCode; message: string; retryable?: boolean }) {
    super(p.message);
    this.name = "ApiError";
    this.status = p.status;
    this.code = p.code;
    this.retryable = p.retryable ?? (p.code === "NETWORK_ERROR" || p.status >= 500);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
