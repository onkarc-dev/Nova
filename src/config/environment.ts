import { z } from 'zod';

const bool = z.enum(['true', 'false']).transform((value) => value === 'true');
const csv = z.string().transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api'),
  API_VERSION: z.string().default('1'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  CORS_ORIGINS: csv.default('http://localhost:3000'),
  TRUST_PROXY: bool.default('false'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  REDIS_URL: z.string().url(),
  EMAIL_FROM: z.string().email().default('no-reply@nova.local'),
  SMTP_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['s3', 'cloudinary', 'local']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const parsed = environmentSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}
