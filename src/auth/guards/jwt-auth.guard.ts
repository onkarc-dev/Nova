import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Environment } from '@config/environment';
import { IS_PUBLIC_KEY } from '../constants';
import type { AuthenticatedRequest } from '../interfaces/auth-user.interface';
import { verifyAccessToken } from '../utils/token.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    const header = request.header('authorization');
    const token = this.extractBearerToken(header);
    if (!token) throw new UnauthorizedException('Missing bearer token.');

    try {
      const payload = verifyAccessToken(token, this.config.get('JWT_ACCESS_SECRET', { infer: true }));
      request.user = { id: payload.sub, email: payload.email, roles: payload.roles };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token.');
    }
  }

  private extractBearerToken(header: string | undefined): string | null {
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
