import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { Request } from 'express';
import { buildMetadata, successResponse } from '@common/utils/response-builder';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    return next.handle().pipe(
      map((data: unknown) =>
        successResponse(data, buildMetadata(request.requestId ?? 'unknown', request.originalUrl, '1')),
      ),
    );
  }
}
