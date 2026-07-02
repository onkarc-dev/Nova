import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser, AuthenticatedRequest } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & AuthenticatedRequest>();
  return request.user;
});
