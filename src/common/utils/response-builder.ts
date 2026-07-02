import type { ApiErrorDetail, ApiErrorResponse, ApiMetadata, ApiSuccessResponse } from '@common/interfaces/api-response.interface';
import type { ErrorCode } from '@common/enums/error-code.enum';

export function buildMetadata(requestId: string, path?: string, version?: string): ApiMetadata {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    ...(path ? { path } : {}),
    ...(version ? { version } : {}),
  };
}

export function successResponse<T>(data: T, metadata: ApiMetadata): ApiSuccessResponse<T> {
  return { success: true, data, metadata };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  metadata: ApiMetadata,
  details?: ApiErrorDetail[],
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details?.length ? { details } : {}),
    },
    metadata,
  };
}
