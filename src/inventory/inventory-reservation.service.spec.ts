import { ConflictException } from '@nestjs/common';
import { CartStatus, ProductStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import { InventoryReservationService } from './inventory-reservation.service';

interface TxMock {
  cart: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  };
  inventory: {
    findMany: jest.Mock<Promise<{ id?: string; onHand: number; reserved: number; safetyStock: number }[]>, [unknown]>;
    updateMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
  };
}

interface PrismaMock {
  runInTransaction: jest.Mock<Promise<unknown>, [(tx: TxMock) => Promise<unknown>]>;
}

const user = {
  id: 'user_1',
  email: 'buyer@nova.test',
  roles: ['customer'],
};

function createTx(): TxMock {
  return {
    cart: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
    },
    inventory: {
      findMany: jest.fn<Promise<{ id?: string; onHand: number; reserved: number; safetyStock: number }[]>, [unknown]>(),
      updateMany: jest.fn<Promise<{ count: number }>, [unknown]>(),
    },
  };
}

function createService() {
  const tx = createTx();
  const prisma: PrismaMock = {
    runInTransaction: jest.fn<Promise<unknown>, [(tx: TxMock) => Promise<unknown>]>((callback) => callback(tx)),
  };

  return {
    tx,
    service: new InventoryReservationService(prisma as unknown as PrismaService),
  };
}

function createCart(quantity = 2) {
  return {
    id: 'cart_1',
    userId: 'user_1',
    status: CartStatus.ACTIVE,
    items: [
      {
        id: 'cart_item_1',
        variantId: 'variant_1',
        quantity,
        variant: {
          isActive: true,
          product: {
            storeId: 'store_1',
            status: ProductStatus.ACTIVE,
          },
        },
      },
    ],
  };
}

describe('InventoryReservationService', () => {
  it('validates an owned cart when inventory is available', async () => {
    const { service, tx } = createService();
    tx.cart.findFirst.mockResolvedValue(createCart());
    tx.inventory.findMany.mockResolvedValue([{ onHand: 5, reserved: 1, safetyStock: 0 }]);

    const result = await service.validateBuyerCart(user, 'cart_1');

    expect(result).toEqual({
      cartId: 'cart_1',
      valid: true,
      items: [{ variantId: 'variant_1', requestedQuantity: 2, availableQuantity: 4 }],
    });
  });

  it('rejects validation when inventory would oversell', async () => {
    const { service, tx } = createService();
    tx.cart.findFirst.mockResolvedValue(createCart(4));
    tx.inventory.findMany.mockResolvedValue([{ onHand: 3, reserved: 0, safetyStock: 0 }]);

    await expect(service.validateBuyerCart(user, 'cart_1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('reserves stock without allowing negative availability', async () => {
    const { service, tx } = createService();
    tx.inventory.findMany.mockResolvedValue([{ id: 'inventory_1', onHand: 3, reserved: 1, safetyStock: 0 }]);
    tx.inventory.updateMany.mockResolvedValue({ count: 1 });

    await service.reserveOrderItems(tx as never, [{ variantId: 'variant_1', storeId: 'store_1', quantity: 2 }]);

    expect(tx.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: 'inventory_1', reserved: { lte: 1 } },
      data: { reserved: { increment: 2 } },
    });
  });

  it('rejects reservation when a concurrent reservation wins first', async () => {
    const { service, tx } = createService();
    tx.inventory.findMany.mockResolvedValue([{ id: 'inventory_1', onHand: 3, reserved: 1, safetyStock: 0 }]);
    tx.inventory.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.reserveOrderItems(tx as never, [{ variantId: 'variant_1', storeId: 'store_1', quantity: 2 }]),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
