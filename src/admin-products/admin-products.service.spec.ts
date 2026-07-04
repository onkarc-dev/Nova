import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { SearchService } from '@/search/search.service';
import { AdminProductsService } from './admin-products.service';

describe('AdminProductsService', () => {
  function createService() {
    const searchService = {
      scheduleProductIndex: jest.fn(),
      scheduleProductRemoval: jest.fn(),
    };
    const prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    return { prisma, searchService, service: new AdminProductsService(prisma as unknown as PrismaService, searchService as unknown as SearchService) };
  }

  it('approves a product by marking it active', async () => {
    const { prisma, searchService, service } = createService();
    prisma.product.findUnique.mockResolvedValue({ id: 'product_1' });
    prisma.product.update.mockResolvedValue({ id: 'product_1', status: ProductStatus.ACTIVE });

    await expect(service.approve('product_1')).resolves.toEqual({ id: 'product_1', status: ProductStatus.ACTIVE });

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'product_1' }, data: { status: ProductStatus.ACTIVE } }),
    );
    expect(searchService.scheduleProductIndex).toHaveBeenCalledWith('product_1');
  });

  it('removes a product from search when admin rejects it', async () => {
    const { prisma, searchService, service } = createService();
    prisma.product.findUnique.mockResolvedValue({ id: 'product_1' });
    prisma.product.update.mockResolvedValue({ id: 'product_1', status: ProductStatus.DRAFT });

    await expect(service.reject('product_1')).resolves.toEqual({ id: 'product_1', status: ProductStatus.DRAFT });

    expect(searchService.scheduleProductRemoval).toHaveBeenCalledWith('product_1');
  });

  it('rejects a missing product with not found', async () => {
    const { prisma, service } = createService();
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.reject('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

