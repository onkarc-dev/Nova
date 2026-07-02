import type { ZodSchema } from 'zod';

export function parseWithSchema<T>(schema: ZodSchema<T>, value: unknown): T {
  return schema.parse(value);
}
