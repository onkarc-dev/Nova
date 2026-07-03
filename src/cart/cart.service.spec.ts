import { NotFoundException } from '@nestjs/common';
import { CartStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CartService } from './cart.service';

interface PrismaMock {
  cart: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
  };
  variant: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  };
  cartItem: {
    upsert: jest.Mock<Promise<unknown>, [unknown]>;
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
    delete: jest.Mock<Promise<unknown>, [unknown]>;
    deleteMany: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

const authUser: AuthUser = {
  id: 'user_1',
  email: 'buyer@nova.test',
  roles: ['customer'],
};

function createCart(items: unknown[] = []) {
  return {
    id: 'cart_1',
    userId: 'user_1',
    sessionId: null,
    status: CartStatus.ACTIVE,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    items,
  };
}

function createCartItem(overrides?: Record<string, unknown>) {
  return {
    id: 'cart_item_1',
    cartId: 'cart_1',
    variantId: 'variant_1',
    quantity: 2,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    variant: {
      id: 'variant_1',
      sku: 'NOVA-SKU-1',
      name: 'Default',
      priceCents: 49900,
      compareAtCents: null,
      currency: 'INR',
      isActive: true,
      product: {
        id: 'product_1',
        name: 'Nova product',
        slug: 'nova-product',
        images: [],
        category: null,
        brand: null,
        store: { id: 'store_1', name: 'Nova Store', slug: 'nova-store' },
      },
    },
    ...overrides,
  };
}

function createPrismaMock(): PrismaMock {
  return {
    cart: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
    },
    variant: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
    },
    cartItem: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(),
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      deleteMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
}

describe('CartService', () => {
  it('returns an active cart with a buyer summary', async () => {
    const prisma = createPrismaMock();
    prisma.cart.findFirst.mockResolvedValue(createCart([createCartItem()]));
    const service = new CartService(prisma as unknown as PrismaService);

    const result = await service.getCart(authUser);

    expect(result.summary).toEqual({ itemCount: 2, subtotalCents: 99800, currency: 'INR' });
    expect(prisma.cart.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user_1', status: CartStatus.ACTIVE },
      include: expect.any(Object) as unknown,
    });
  });

  it('adds a purchasable variant to the current buyer cart', async () => {
    const prisma = createPrismaMock();
    prisma.cart.findFirst.mockResolvedValue(createCart());
    prisma.variant.findFirst.mockResolvedValue({ id: 'variant_1' });
    prisma.cartItem.upsert.mockResolvedValue(createCartItem({ quantity: 1 }));
    const service = new CartService(prisma as unknown as PrismaService);

    await service.addItem(authUser, { variantId: 'variant_1', quantity: 1 });

    expect(prisma.variant.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'variant_1',
        isActive: true,
        product: { status: 'ACTIVE', store: { isVerified: true } },
      },
      select: { id: true },
    });
    expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
      where: { cartId_variantId: { cartId: 'cart_1', variantId: 'variant_1' } },
      create: { cartId: 'cart_1', variantId: 'variant_1', quantity: 1 },
      update: { quantity: { increment: 1 } },
    });
  });

  it('prevents updates to cart items outside the buyer cart', async () => {
    const prisma = createPrismaMock();
    prisma.cart.findFirst.mockResolvedValue(createCart());
    prisma.cartItem.findFirst.mockResolvedValue(null);
    const service = new CartService(prisma as unknown as PrismaService);

    await expect(service.updateItem(authUser, 'cart_item_other', { quantity: 3 })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.cartItem.update).not.toHaveBeenCalled();
  });
});
