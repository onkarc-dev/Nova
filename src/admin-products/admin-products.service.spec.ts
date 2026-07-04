import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import { AdminProductsService } from './admin-products.service';

describe('AdminProductsService', () => {
  function createService() {
    const prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    return { prisma, service: new AdminProductsService(prisma as unknown as PrismaService) };
  }

  it('approves a product by marking it active', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValue({ id: 'product_1' });
    prisma.product.update.mockResolvedValue({ id: 'product_1', status: ProductStatus.ACTIVE });

    await expect(service.approve('product_1')).resolves.toEqual({ id: 'product_1', status: ProductStatus.ACTIVE });

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'product_1' }, data: { status: ProductStatus.ACTIVE } }),
    );
  });

  it('rejects a missing product with not found', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.reject('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

