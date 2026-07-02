import type { ErrorCode } from '@common/enums/error-code.enum';

export interface ApiMetadata {
  requestId: string;
  timestamp: string;
  path?: string;
  version?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  metadata: ApiMetadata;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
  metadata: ApiMetadata;
}
