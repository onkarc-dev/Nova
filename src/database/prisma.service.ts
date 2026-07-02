import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
    this.$on('query', (event: Prisma.QueryEvent) => {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug({ query: event.query, duration: event.duration, params: event.params });
      }
    });
    this.$on('error', (event: Prisma.LogEvent) => {
      this.logger.error(event);
    });
    this.$on('warn', (event: Prisma.LogEvent) => {
      this.logger.warn(event);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async healthCheck(): Promise<boolean> {
    await this.$queryRaw`SELECT 1`;
    return true;
  }

  runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(callback, { maxWait: 5_000, timeout: 10_000 });
  }
}
