import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ErrorCode } from '@common/enums/error-code.enum';
import { appLogger } from '@common/logging/app-logger';
import { buildMetadata, errorResponse } from '@common/utils/response-builder';

type RequestWithContext = Request & {
  requestId?: string;
  user?: { id?: string; sub?: string };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();
    const status = this.getStatus(exception);
    const code = this.getCode(exception, status);
    const message = this.getMessage(exception, status);
    const userId = request.user?.id ?? request.user?.sub;

    const logPayload = {
      requestId: request.requestId,
      userId,
      method: request.method,
      path: request.originalUrl,
      statusCode: status,
      errorCode: code,
      errorName: exception instanceof Error ? exception.name : 'UnknownError',
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error ? { stack: exception.stack } : {}),
    };

    if (status >= 500) {
      appLogger.error(logPayload, message);
    } else {
      appLogger.warn(logPayload, message);
    }

    response
      .status(status)
      .json(errorResponse(code, message, buildMetadata(request.requestId ?? 'unknown', request.originalUrl, '1')));
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof Prisma.PrismaClientKnownRequestError) return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getCode(exception: unknown, status: number): ErrorCode {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) return ErrorCode.DATABASE_ERROR;
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.AUTHENTICATION_ERROR;
      case 403:
        return ErrorCode.AUTHORIZATION_ERROR;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }

  private getMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const { message } = response;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
      return exception.message;
    }
    if (exception instanceof Error && status < 500) return exception.message;
    return status >= 500 ? 'An unexpected error occurred.' : 'Request failed.';
  }
}
