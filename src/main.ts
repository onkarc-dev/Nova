import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { ApiResponseInterceptor } from '@common/interceptors/api-response.interceptor';
import type { Environment } from '@config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Environment, true>);
  const logger = new Logger('Bootstrap');
  const apiPrefix = config.get('API_PREFIX', { infer: true });
  const apiVersion = config.get('API_VERSION', { infer: true });
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  const trustProxy = config.get('TRUST_PROXY', { infer: true });

  if (trustProxy) {
    const httpInstance = app.getHttpAdapter().getInstance() as { set(name: string, value: number): void };
    httpInstance.set('trust proxy', 1);
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({ origin: corsOrigins, credentials: true, methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'] });
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiVersion });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`Nova API listening on port ${String(port)}`);
}

void bootstrap();
