import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@common/enums/error-code.enum';
import { buildMetadata, errorResponse } from '@common/utils/response-builder';
import type { Environment } from '@config/environment';

type RequestWithContext = Request & { requestId?: string };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly ttlMs: number;
  private readonly maxRequests: number;

  constructor(config: ConfigService<Environment, true>) {
    this.ttlMs = config.get('RATE_LIMIT_TTL_SECONDS', { infer: true }) * 1000;
    this.maxRequests = config.get('RATE_LIMIT_MAX', { infer: true });
  }

  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    if (this.maxRequests <= 0) {
      next();
      return;
    }

    const now = Date.now();
    const key = this.getClientKey(request);
    const current = this.requests.get(key);

    if (!current || current.resetAt <= now) {
      this.requests.set(key, { count: 1, resetAt: now + this.ttlMs });
      this.pruneExpired(now);
      next();
      return;
    }

    current.count += 1;

    if (current.count <= this.maxRequests) {
      next();
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    response.setHeader('Retry-After', String(retryAfterSeconds));
    response.status(429).json(
      errorResponse(
        ErrorCode.RATE_LIMITED,
        'Too many requests. Please try again later.',
        buildMetadata(request.requestId ?? 'unknown', request.originalUrl, '1'),
      ),
    );
  }

  private getClientKey(request: Request): string {
    const forwardedFor = request.header('x-forwarded-for')?.split(',')[0]?.trim();
    return forwardedFor || request.ip || 'unknown';
  }

  private pruneExpired(now: number): void {
    if (this.requests.size <= this.maxRequests * 10) {
      return;
    }

    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetAt <= now) {
        this.requests.delete(key);
      }
    }
  }
}
