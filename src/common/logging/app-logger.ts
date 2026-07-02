import pino from 'pino';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'password',
  '*.password',
  'passwordHash',
  '*.passwordHash',
  'accessToken',
  'refreshToken',
  '*.accessToken',
  '*.refreshToken',
  'token',
  '*.token',
  'params',
];

export const appLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'nova-api',
    environment: process.env.NODE_ENV ?? 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
});
