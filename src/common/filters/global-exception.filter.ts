import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ErrorCode } from '@common/enums/error-code.enum';
import { buildMetadata, errorResponse } from '@common/utils/response-builder';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const response = ctx.getResponse<Response>();
    const status = this.getStatus(exception);
    const code = this.getCode(exception, status);
    const message = this.getMessage(exception, status);

    if (status >= 500) {
      this.logger.error({ exception, requestId: request.requestId, path: request.originalUrl }, message);
    } else {
      this.logger.warn({ exception, requestId: request.requestId, path: request.originalUrl }, message);
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
      if (typeof response === 'object' && 'message' in response) {
        const { message } = response;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
      return exception.message;
    }
    if (exception instanceof Error && status < 500) return exception.message;
    return status >= 500 ? 'An unexpected error occurred.' : 'Request failed.';
  }
}
