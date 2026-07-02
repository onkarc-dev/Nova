import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Environment } from '@config/environment';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants';
import type { AuthenticatedRequest } from '../interfaces/auth-user.interface';
import { createAccessToken } from '../utils/token.util';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

interface ContextMockOptions {
  handler?: () => void;
  classRef?: new () => unknown;
  request: Request & AuthenticatedRequest;
}

function createContext(options: ContextMockOptions) {
  return {
    getHandler: () => options.handler ?? (() => undefined),
    getClass: () => options.classRef ?? class TestClass {
      readonly name = 'TestClass';
    },
    switchToHttp: () => ({
      getRequest: () => options.request,
    }),
  } as unknown as ExecutionContext;
}

function createRequest(authorization?: string): Request & AuthenticatedRequest {
  return {
    header: (name: string) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
  } as Request & AuthenticatedRequest;
}

function createConfig(): ConfigService<Environment, true> {
  return {
    get: () => 'access-secret-with-at-least-32-characters',
  } as unknown as ConfigService<Environment, true>;
}

describe('JwtAuthGuard', () => {
  it('allows public routes without a token', () => {
    const reflector = new Reflector();
    const handler = () => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
    const guard = new JwtAuthGuard(reflector, createConfig());

    expect(guard.canActivate(createContext({ handler, request: createRequest() }))).toBe(true);
  });

  it('attaches verified access token payload to the request', () => {
    const reflector = new Reflector();
    const token = createAccessToken(
      { sub: 'user_1', email: 'buyer@nova.test', roles: ['customer'] },
      'access-secret-with-at-least-32-characters',
      '15m',
    );
    const request = createRequest(`Bearer ${token}`);
    const guard = new JwtAuthGuard(reflector, createConfig());

    expect(guard.canActivate(createContext({ request }))).toBe(true);
    expect(request.user).toEqual({ id: 'user_1', email: 'buyer@nova.test', roles: ['customer'] });
  });

  it('rejects missing bearer tokens', () => {
    const guard = new JwtAuthGuard(new Reflector(), createConfig());

    expect(() => guard.canActivate(createContext({ request: createRequest() }))).toThrow(UnauthorizedException);
  });
});

describe('RolesGuard', () => {
  it('allows users with a required role', () => {
    const reflector = new Reflector();
    const handler = () => undefined;
    Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
    const request = createRequest();
    request.user = { id: 'user_1', email: 'admin@nova.test', roles: ['admin'] };
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ handler, request }))).toBe(true);
  });

  it('rejects users without a required role', () => {
    const reflector = new Reflector();
    const handler = () => undefined;
    Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
    const request = createRequest();
    request.user = { id: 'user_1', email: 'buyer@nova.test', roles: ['customer'] };
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext({ handler, request }))).toThrow(ForbiddenException);
  });
});
