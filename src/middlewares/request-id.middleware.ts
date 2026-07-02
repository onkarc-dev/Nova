import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createPublicId } from '@common/utils/id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request & { requestId?: string }, response: Response, next: NextFunction): void {
    const incoming = request.header('x-request-id');
    const requestId = incoming && incoming.length <= 128 ? incoming : createPublicId('req');
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
