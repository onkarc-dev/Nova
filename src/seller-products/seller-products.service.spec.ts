import { BadRequestException } from '@nestjs/common';
import { ProductStatus, SellerStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { SearchService } from '@/search/search.service';
import { SellerProductsService } from './seller-products.service';

type VariantTestRecord = {
  id: string;
  sku: string;
};

type VariantMock = {
  findMany: jest.Mock<Promise<VariantTestRecord[]>, []>;
  update: jest.Mock<Promise<Record<string, never>>, [unknown]>;
  create: jest.Mock<Promise<Record<string, never>>, [unknown]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
  deleteMany: jest.Mock;
};

type ProductMock = {
  update: jest.Mock<Promise<Record<string, never>>, [unknown]>;
  findUnique: jest.Mock<Promise<{ id: string }>, [unknown]>;
};

type ProductImageMock = {
  deleteMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
  createMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
};

type TransactionMock = {
  product: ProductMock;
  variant: VariantMock;
  productImage: ProductImageMock;
};

describe('SellerProductsService safe variant updates', () => {
  const user = { id: 'user_1', email: 'seller@example.com', roles: ['SELLER'] } as never;

  function createService(existingVariants: VariantTestRecord[] = [{ id: 'variant_1', sku: 'SKU-1' }]) {
    const searchService = {
      scheduleProductIndex: jest.fn(),
      scheduleProductRemoval: jest.fn(),
    };
    const tx: TransactionMock = {
      product: {
        update: jest.fn<Promise<Record<string, never>>, [unknown]>().mockResolvedValue({}),
        findUnique: jest.fn<Promise<{ id: string }>, [unknown]>().mockResolvedValue({ id: 'product_1' }),
      },
      variant: {
        findMany: jest.fn<Promise<VariantTestRecord[]>, []>().mockResolvedValue(existingVariants),
        update: jest.fn<Promise<Record<string, never>>, [unknown]>().mockResolvedValue({}),
        create: jest.fn<Promise<Record<string, never>>, [unknown]>().mockResolvedValue({}),
        updateMany: jest.fn<Promise<{ count: number }>, [unknown]>().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn(),
      },
      productImage: {
        deleteMany: jest.fn<Promise<{ count: number }>, [unknown]>().mockResolvedValue({ count: 0 }),
        createMany: jest.fn<Promise<{ count: number }>, [unknown]>().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      store: {
        findFirst: jest.fn().mockResolvedValue({ id: 'store_1', isVerified: true, seller: { id: 'seller_1', status: SellerStatus.APPROVED } }),
      },
      product: {
        create: jest.fn().mockResolvedValue({ id: 'product_1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'product_1' }),
      },
      runInTransaction: jest.fn((callback: (transaction: TransactionMock) => Promise<unknown>) => callback(tx)),
    };
    return { prisma, searchService, service: new SellerProductsService(prisma as unknown as PrismaService, searchService as unknown as SearchService), tx };
  }

  it('schedules product indexing after seller product creation', async () => {
    const { service, searchService } = createService();

    await service.create(user, {
      storeId: 'store_1',
      categoryId: 'category_1',
      name: 'Cotton Kurta',
      description: 'Soft cotton kurta',
      status: ProductStatus.ACTIVE,
      variants: [{ sku: 'SKU-1', name: 'Small', priceCents: 999 }],
    });

    expect(searchService.scheduleProductIndex).toHaveBeenCalledWith('product_1');
  });

  it('updates an existing variant by stable id without deleting it', async () => {
    const { service, tx } = createService();

    await service.update(user, 'product_1', {
      variants: [{ id: 'variant_1', sku: 'SKU-1A', name: 'Large', priceCents: 1299, attributes: { size: 'L' } }],
    });

    expect(tx.variant.update).toHaveBeenCalledWith({
      where: { id: 'variant_1' },
      data: expect.objectContaining({ sku: 'SKU-1A', name: 'Large', priceCents: 1299, isActive: true }),
    });
    expect(tx.variant.deleteMany).not.toHaveBeenCalled();
  });

  it('schedules product indexing after seller product updates', async () => {
    const { service, searchService } = createService();

    await service.update(user, 'product_1', {
      variants: [{ id: 'variant_1', sku: 'SKU-1A', name: 'Large', priceCents: 1299, attributes: { size: 'L' } }],
    });

    expect(searchService.scheduleProductIndex).toHaveBeenCalledWith('product_1');
  });

  it('adds a new variant when no existing id or SKU matches', async () => {
    const { service, tx } = createService();

    await service.update(user, 'product_1', {
      variants: [
        { id: 'variant_1', sku: 'SKU-1', name: 'Small', priceCents: 999 },
        { sku: 'SKU-2', name: 'Medium', priceCents: 1099 },
      ],
    });

    expect(tx.variant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ productId: 'product_1', sku: 'SKU-2', name: 'Medium', priceCents: 1099 }),
    });
  });

  it('blocks duplicate SKU conflicts in an update payload', async () => {
    const { service, tx } = createService();

    await expect(
      service.update(user, 'product_1', {
        variants: [
          { id: 'variant_1', sku: 'SKU-1', name: 'Small', priceCents: 999 },
          { sku: 'SKU-1', name: 'Duplicate', priceCents: 1099 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.variant.update).not.toHaveBeenCalled();
    expect(tx.variant.create).not.toHaveBeenCalled();
  });

  it('deactivates omitted cart/order-linked variants instead of hard deleting them', async () => {
    const { service, tx } = createService([
      { id: 'variant_1', sku: 'SKU-1' },
      { id: 'variant_2', sku: 'SKU-2' },
    ]);

    await service.update(user, 'product_1', {
      variants: [{ id: 'variant_1', sku: 'SKU-1', name: 'Small', priceCents: 999 }],
    });

    expect(tx.variant.updateMany).toHaveBeenCalledWith({
      where: { productId: 'product_1', id: { in: ['variant_2'] } },
      data: { isActive: false },
    });
    expect(tx.variant.deleteMany).not.toHaveBeenCalled();
  });
});
