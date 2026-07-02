import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  appUrl: process.env.APP_URL,
  apiUrl: process.env.API_URL,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((origin) => origin.trim()),
  trustProxy: process.env.TRUST_PROXY === 'true',
  logLevel: process.env.LOG_LEVEL ?? 'info',
}));
