import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RedisService } from '@/queues/redis.service';

export interface ComponentHealth {
  status: 'up' | 'down';
  checkedAt: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  health(): ComponentHealth {
    return { status: 'up', checkedAt: new Date().toISOString() };
  }

  async ready(): Promise<{ status: 'ready' | 'not_ready'; database: ComponentHealth; redis: ComponentHealth }> {
    const [database, redis] = await Promise.all([this.database(), this.redis()]);
    return { status: database.status === 'up' && redis.status === 'up' ? 'ready' : 'not_ready', database, redis };
  }

  version(): { name: string; version: string; environment: string } {
    return { name: 'nova-commerce', version: process.env.npm_package_version ?? '0.2.0', environment: process.env.NODE_ENV ?? 'development' };
  }

  async database(): Promise<ComponentHealth> {
    try {
      await this.prisma.healthCheck();
      return { status: 'up', checkedAt: new Date().toISOString() };
    } catch {
      return { status: 'down', checkedAt: new Date().toISOString() };
    }
  }

  async redis(): Promise<ComponentHealth> {
    try {
      await this.redisService.healthCheck();
      return { status: 'up', checkedAt: new Date().toISOString() };
    } catch {
      return { status: 'down', checkedAt: new Date().toISOString() };
    }
  }
}
