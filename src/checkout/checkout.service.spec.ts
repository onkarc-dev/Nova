import { BadRequestException } from '@nestjs/common';
import { AddressType } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import type { CartService } from '@/cart/cart.service';
import { CheckoutService } from './checkout.service';

interface CartServiceMock {
  getCart: jest.Mock<Promise<unknown>, [AuthUser]>;
}

interface PrismaMock {
  address: {
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

const authUser: AuthUser = {
  id: 'user_1',
  email: 'buyer@nova.test',
  roles: ['customer'],
};

function createCart(items: unknown[] = [{ id: 'cart_item_1' }]) {
  return {
    id: 'cart_1',
    items,
    summary: { itemCount: items.length, subtotalCents: 49900, currency: 'INR' },
  };
}

function createAddress(type: AddressType = AddressType.SHIPPING) {
  return {
    id: 'address_1',
    userId: 'user_1',
    type,
    fullName: 'Buyer One',
    phone: '+919876543210',
    line1: 'Market Road',
    line2: null,
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    countryCode: 'IN',
    isDefault: true,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
  };
}

function createService(cart = createCart()) {
  const cartService: CartServiceMock = {
    getCart: jest.fn<Promise<unknown>, [AuthUser]>(() => Promise.resolve(cart)),
  };
  const prisma: PrismaMock = {
    address: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(() => Promise.resolve([createAddress()])),
      findFirst: jest.fn<Promise<unknown>, [unknown]>(() => Promise.resolve(createAddress(AddressType.BOTH))),
    },
  };

  return {
    cartService,
    prisma,
    service: new CheckoutService(cartService as unknown as CartService, prisma as unknown as PrismaService),
  };
}

describe('CheckoutService', () => {
  it('returns a checkout draft without creating an order or payment', async () => {
    const { service, prisma } = createService();

    const result = await service.getCheckout(authUser);

    expect(result.paymentIntegrationStatus).toBe('PENDING');
    expect(result.summary).toEqual({ itemCount: 1, subtotalCents: 49900, currency: 'INR' });
    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('rejects checkout validation for an empty cart', async () => {
    const { service } = createService(createCart([]));

    await expect(service.validateCheckout(authUser, { shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a billing-only address as a shipping address', async () => {
    const { service, prisma } = createService();
    prisma.address.findFirst.mockResolvedValue(createAddress(AddressType.BILLING));

    await expect(service.validateCheckout(authUser, { shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
