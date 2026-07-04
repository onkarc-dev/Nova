import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { ListAdminProductsDto } from './dto/admin-product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListAdminProductsDto) {
    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.sellerId) where.store = { sellerId: query.sellerId };
    return this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.includeProduct(),
    });
  }

  approve(productId: string) {
    return this.updateStatus(productId, ProductStatus.ACTIVE);
  }

  reject(productId: string) {
    return this.updateStatus(productId, ProductStatus.DRAFT);
  }

  async updateStatus(productId: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found.');
    return this.prisma.product.update({ where: { id: product.id }, data: { status }, include: this.includeProduct() });
  }

  private includeProduct() {
    return {
      category: true,
      brand: true,
      store: { include: { seller: true } },
      variants: true,
      images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
    } satisfies Prisma.ProductInclude;
  }
}
