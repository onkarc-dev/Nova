import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
}

interface JwtClaims extends AccessTokenPayload {
  iat: number;
  exp: number;
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return Number(value);

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  if (unit === 'h') return amount * 60 * 60;
  return amount * 24 * 60 * 60;
}

function isJwtClaims(value: unknown): value is JwtClaims {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.exp === 'number' &&
    typeof candidate.iat === 'number' &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === 'string')
  );
}

export function createAccessToken(payload: AccessTokenPayload, secret: string, expiresIn: string): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    ...payload,
    iat: now,
    exp: now + parseDurationSeconds(expiresIn),
  };
  const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
  const body = base64UrlJson(claims);
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned, secret)}`;
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) throw new Error('Invalid access token.');

  const unsigned = `${header}.${body}`;
  const expectedSignature = sign(unsigned, secret);
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid access token signature.');
  }

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown;
  if (!isJwtClaims(parsed)) throw new Error('Invalid access token payload.');

  if (parsed.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Access token expired.');
  }

  return { sub: parsed.sub, email: parsed.email, roles: parsed.roles };
}

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiry(expiresIn: string): Date {
  return new Date(Date.now() + parseDurationSeconds(expiresIn) * 1000);
}
