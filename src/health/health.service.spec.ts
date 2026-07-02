import type { PrismaService } from '@database/prisma.service';
import type { RedisService } from '@/queues/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  function createService(options?: {
    databaseRejects?: boolean;
    redisRejects?: boolean;
  }): HealthService {
    const prisma = {
      healthCheck: jest.fn(() =>
        options?.databaseRejects ? Promise.reject(new Error('database down')) : Promise.resolve(true),
      ),
    } as unknown as PrismaService;

    const redis = {
      healthCheck: jest.fn(() =>
        options?.redisRejects ? Promise.reject(new Error('redis down')) : Promise.resolve(true),
      ),
    } as unknown as RedisService;

    return new HealthService(prisma, redis);
  }

  it('reports process health without external dependencies', () => {
    const service = createService();

    expect(service.health()).toEqual({
      status: 'up',
      checkedAt: expect.any(String) as string,
    });
  });

  it('reports ready when database and redis checks pass', async () => {
    const service = createService();

    await expect(service.ready()).resolves.toMatchObject({
      status: 'ready',
      database: { status: 'up' },
      redis: { status: 'up' },
    });
  });

  it('reports not_ready when a dependency check fails', async () => {
    const service = createService({ redisRejects: true });

    await expect(service.ready()).resolves.toMatchObject({
      status: 'not_ready',
      database: { status: 'up' },
      redis: { status: 'down' },
    });
  });

  it('returns version metadata with defaults', () => {
    const service = createService();

    expect(service.version()).toMatchObject({
      name: 'nova-commerce',
      version: expect.any(String) as string,
      environment: expect.any(String) as string,
    });
  });
});
