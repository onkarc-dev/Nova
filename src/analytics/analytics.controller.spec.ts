import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/auth/constants';
import { AdminAnalyticsController, SellerAnalyticsController } from './analytics.controller';

describe('Analytics controllers authorization metadata', () => {
  const reflector = new Reflector();

  it('restricts admin analytics routes to the admin role only', () => {
    const roles = reflector.get<string[]>(ROLES_KEY, AdminAnalyticsController);
    expect(roles).toEqual(['admin']);
    expect(roles).not.toContain('customer');
    expect(roles).not.toContain('seller');
  });

  it('restricts seller analytics routes to the seller role only', () => {
    const roles = reflector.get<string[]>(ROLES_KEY, SellerAnalyticsController);
    expect(roles).toEqual(['seller']);
    expect(roles).not.toContain('customer');
    expect(roles).not.toContain('admin');
  });
});
