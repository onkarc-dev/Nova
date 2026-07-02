import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ErrorCode } from '@common/enums/error-code.enum';
import { buildMetadata, errorResponse } from '@common/utils/response-builder';

const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 120;

type RequestWithContext = Request & { requestId?: string };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly ttlMs = parsePositiveInteger(process.env.RATE_LIMIT_TTL_SECONDS, DEFAULT_TTL_SECONDS) * 1000;
  private readonly maxRequests = parseNonNegativeInteger(process.env.RATE_LIMIT_MAX, DEFAULT_MAX_REQUESTS);

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
