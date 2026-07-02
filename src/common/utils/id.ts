import { nanoid } from 'nanoid';

export function createPublicId(prefix: string): string {
  return `${prefix}_${nanoid(16)}`;
}
