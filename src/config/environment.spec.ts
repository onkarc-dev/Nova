import { validateEnvironment } from './environment';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4000',
  API_PREFIX: 'api',
  API_VERSION: '1',
  APP_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:4000',
  CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
  TRUST_PROXY: 'true',
  DATABASE_URL: 'postgresql://nova:nova@localhost:5432/nova?schema=public',
  DIRECT_URL: 'postgresql://nova:nova@localhost:5432/nova?schema=public',
  JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-chars',
  JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-chars',
  REDIS_URL: 'redis://localhost:6379',
  EMAIL_FROM: 'no-reply@nova.local',
  LOG_LEVEL: 'info',
};

describe('validateEnvironment', () => {
  it('parses and transforms valid environment variables', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      NODE_ENV: 'test',
      PORT: 4000,
      CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:3001'],
      TRUST_PROXY: true,
      DATABASE_URL: validEnvironment.DATABASE_URL,
      REDIS_URL: validEnvironment.REDIS_URL,
    });
  });

  it('applies defaults for optional values', () => {
    const parsed = validateEnvironment({
      APP_URL: validEnvironment.APP_URL,
      API_URL: validEnvironment.API_URL,
      DATABASE_URL: validEnvironment.DATABASE_URL,
      DIRECT_URL: validEnvironment.DIRECT_URL,
      JWT_ACCESS_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnvironment.JWT_REFRESH_SECRET,
      REDIS_URL: validEnvironment.REDIS_URL,
    });

    expect(parsed).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      API_PREFIX: 'api',
      API_VERSION: '1',
      CORS_ORIGINS: ['http://localhost:3000'],
      TRUST_PROXY: false,
      EMAIL_FROM: 'no-reply@nova.local',
      STORAGE_PROVIDER: 'local',
      LOG_LEVEL: 'info',
    });
  });

  it('throws a useful error for invalid configuration', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        APP_URL: 'not-a-url',
        JWT_ACCESS_SECRET: 'short',
      }),
    ).toThrow(/Invalid environment configuration: APP_URL: Invalid url; JWT_ACCESS_SECRET/);
  });
});
