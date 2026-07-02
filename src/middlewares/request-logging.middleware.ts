import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { appLogger } from '@common/logging/app-logger';

type RequestWithContext = Request & {
  requestId?: string;
  user?: { id?: string; sub?: string };
};

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const userId = request.user?.id ?? request.user?.sub;

      appLogger.info(
        {
          requestId: request.requestId,
          userId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          userAgent: request.header('user-agent'),
          ip: request.ip,
        },
        'request completed',
      );
    });

    next();
  }
}
