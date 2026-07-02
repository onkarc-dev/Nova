import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@config/app.config';
import { databaseConfig } from '@config/database.config';
import { emailConfig } from '@config/email.config';
import { validateEnvironment } from '@config/environment';
import { jwtConfig } from '@config/jwt.config';
import { paymentConfig } from '@config/payment.config';
import { redisConfig } from '@config/redis.config';
import { storageConfig } from '@config/storage.config';
import { DatabaseModule } from '@database/database.module';
import { HealthModule } from '@health/health.module';
import { RequestIdMiddleware } from '@/middlewares/request-id.middleware';
import { RequestLoggingMiddleware } from '@/middlewares/request-logging.middleware';
import { QueueModule } from '@/queues/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, emailConfig, paymentConfig, storageConfig],
    }),
    DatabaseModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, RequestLoggingMiddleware).forRoutes('*');
  }
}
