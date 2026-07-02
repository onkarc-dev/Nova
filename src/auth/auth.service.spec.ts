import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma, TokenStatus, UserStatus, type User } from '@prisma/client';
import type { Environment } from '@config/environment';
import type { PrismaService } from '@database/prisma.service';
import { AuthService } from './auth.service';
import { hashPassword } from './utils/password.util';
import { hashRefreshToken } from './utils/token.util';

type UserWithRoles = User & {
  roles: { role: { name: string } }[];
};

interface PrismaMock {
  runInTransaction: jest.Mock<Promise<UserWithRoles>, [(tx: Prisma.TransactionClient) => Promise<UserWithRoles>]>;
  user: {
    findUnique: jest.Mock<Promise<UserWithRoles | null>, [unknown]>;
  };
  refreshToken: {
    create: jest.Mock<Promise<unknown>, [unknown]>;
    findUnique: jest.Mock<Promise<(RefreshTokenRecord & { user: UserWithRoles }) | null>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
    updateMany: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  status: TokenStatus;
  expiresAt: Date;
}

function createUser(overrides?: Partial<UserWithRoles>): UserWithRoles {
  return {
    id: 'user_1',
    email: 'buyer@nova.test',
    phone: null,
    passwordHash: 'hash',
    firstName: 'Buyer',
    lastName: 'One',
    avatarUrl: null,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    roles: [{ role: { name: 'customer' } }],
    ...overrides,
  };
}

function createConfig(): ConfigService<Environment, true> {
  return {
    get: (key: keyof Environment) => {
      const values: Pick<Environment, 'JWT_ACCESS_SECRET' | 'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN'> = {
        JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };
      return values[key as keyof typeof values];
    },
  } as ConfigService<Environment, true>;
}

function createPrismaMock(): PrismaMock {
  return {
    runInTransaction: jest.fn<Promise<UserWithRoles>, [(tx: Prisma.TransactionClient) => Promise<UserWithRoles>]>(),
    user: {
      findUnique: jest.fn<Promise<UserWithRoles | null>, [unknown]>(),
    },
    refreshToken: {
      create: jest.fn<Promise<unknown>, [unknown]>(() => Promise.resolve({ id: 'refresh_1' })),
      findUnique: jest.fn<Promise<(RefreshTokenRecord & { user: UserWithRoles }) | null>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(() => Promise.resolve({ id: 'refresh_1' })),
      updateMany: jest.fn<Promise<unknown>, [unknown]>(() => Promise.resolve({ count: 1 })),
    },
  };
}

describe('AuthService', () => {
  it('registers a customer user and issues tokens', async () => {
    const prisma = createPrismaMock();
    const user = createUser();
    prisma.runInTransaction.mockImplementation(() => Promise.resolve(user));
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    const result = await service.register({
      email: 'BUYER@nova.test',
      firstName: 'Buyer',
      lastName: 'One',
      password: 'strong-password',
    });

    expect(result.user).toMatchObject({ id: 'user_1', email: 'buyer@nova.test', roles: ['customer'] });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('maps duplicate registration to conflict', async () => {
    const prisma = createPrismaMock();
    prisma.runInTransaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    await expect(
      service.register({
        email: 'buyer@nova.test',
        firstName: 'Buyer',
        lastName: 'One',
        password: 'strong-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in active users with valid passwords', async () => {
    const passwordHash = await hashPassword('strong-password');
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(createUser({ passwordHash }));
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    const result = await service.login({ email: 'buyer@nova.test', password: 'strong-password' });

    expect(result.user.email).toBe('buyer@nova.test');
    expect(result.user.roles).toEqual(['customer']);
  });

  it('rejects invalid login credentials', async () => {
    const passwordHash = await hashPassword('strong-password');
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(createUser({ passwordHash }));
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    await expect(service.login({ email: 'buyer@nova.test', password: 'wrong-password' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates valid refresh tokens', async () => {
    const refreshToken = 'refresh-token-value';
    const prisma = createPrismaMock();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh_1',
      tokenHash: hashRefreshToken(refreshToken),
      status: TokenStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 60_000),
      user: createUser(),
    });
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    const result = await service.refresh(refreshToken);

    expect(result.user.id).toBe('user_1');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh_1' },
      data: { status: TokenStatus.REVOKED, revokedAt: expect.any(Date) as Date },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('revokes refresh tokens on logout', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma as unknown as PrismaService, createConfig());

    await expect(service.logout('refresh-token-value')).resolves.toEqual({ revoked: true });

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashRefreshToken('refresh-token-value'), status: TokenStatus.ACTIVE },
      data: { status: TokenStatus.REVOKED, revokedAt: expect.any(Date) as Date },
    });
  });
});
