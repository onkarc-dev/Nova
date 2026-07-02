import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
  verifyAccessToken,
} from './token.util';

describe('token utilities', () => {
  const secret = 'test-secret-with-at-least-32-characters';

  it('creates and verifies an HS256 access token', () => {
    const token = createAccessToken(
      { sub: 'user_1', email: 'buyer@nova.test', roles: ['customer'] },
      secret,
      '15m',
    );

    expect(verifyAccessToken(token, secret)).toEqual({
      sub: 'user_1',
      email: 'buyer@nova.test',
      roles: ['customer'],
    });
  });

  it('rejects tokens signed with another secret', () => {
    const token = createAccessToken(
      { sub: 'user_1', email: 'buyer@nova.test', roles: ['customer'] },
      secret,
      '15m',
    );

    expect(() => verifyAccessToken(token, 'another-secret-with-at-least-32-characters')).toThrow(
      'Invalid access token signature.',
    );
  });

  it('creates opaque refresh tokens and stable hashes', () => {
    const refreshToken = createRefreshToken();

    expect(refreshToken.length).toBeGreaterThanOrEqual(32);
    expect(hashRefreshToken(refreshToken)).toBe(hashRefreshToken(refreshToken));
    expect(hashRefreshToken(refreshToken)).not.toBe(refreshToken);
  });

  it('converts refresh token expiry windows to future dates', () => {
    const expiresAt = getRefreshTokenExpiry('30d');

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
