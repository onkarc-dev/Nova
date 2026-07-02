import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const examplePath = resolve(process.cwd(), '.env.example');

if (existsSync(envPath)) {
  process.exit(0);
}

if (!existsSync(examplePath)) {
  console.error('Missing .env and .env.example. Create .env with the required Nova runtime variables.');
  process.exit(1);
}

copyFileSync(examplePath, envPath);
console.warn('Created .env from .env.example for local development. Review secrets before production use.');
