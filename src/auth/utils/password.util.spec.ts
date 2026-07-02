import { hashPassword, verifyPassword } from './password.util';

describe('password utilities', () => {
  it('hashes and verifies passwords with scrypt', async () => {
    const hash = await hashPassword('strong-password');

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('strong-password');
    await expect(verifyPassword('strong-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('strong-password', 'not-a-real-hash')).resolves.toBe(false);
  });
});
