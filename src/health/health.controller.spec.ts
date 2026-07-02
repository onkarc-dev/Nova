import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('delegates health checks to HealthService', async () => {
    const health = {
      health: jest.fn(() => ({ status: 'up' as const, checkedAt: '2026-07-02T00:00:00.000Z' })),
      ready: jest.fn(() => Promise.resolve({
        status: 'ready' as const,
        database: { status: 'up' as const, checkedAt: '2026-07-02T00:00:00.000Z' },
        redis: { status: 'up' as const, checkedAt: '2026-07-02T00:00:00.000Z' },
      })),
      version: jest.fn(() => ({ name: 'nova-commerce', version: '0.2.0', environment: 'test' })),
      database: jest.fn(() => Promise.resolve({ status: 'up' as const, checkedAt: '2026-07-02T00:00:00.000Z' })),
      redis: jest.fn(() => Promise.resolve({ status: 'up' as const, checkedAt: '2026-07-02T00:00:00.000Z' })),
    } satisfies Pick<HealthService, 'health' | 'ready' | 'version' | 'database' | 'redis'>;

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: health }],
    })
      .overrideProvider(HealthService)
      .useValue(health)
      .compile();

    const controller = moduleRef.get(HealthController);

    try {
      expect(controller.healthCheck()).toEqual({ status: 'up', checkedAt: '2026-07-02T00:00:00.000Z' });
      await expect(controller.readiness()).resolves.toMatchObject({ status: 'ready' });
      expect(controller.version()).toEqual({ name: 'nova-commerce', version: '0.2.0', environment: 'test' });
      await expect(controller.database()).resolves.toMatchObject({ status: 'up' });
      await expect(controller.redis()).resolves.toMatchObject({ status: 'up' });
    } finally {
      await moduleRef.close();
    }
  });
});
