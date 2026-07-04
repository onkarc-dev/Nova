import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(query: SearchProductsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: query.q, mode: 'insensitive' } } } },
      ];
    }
    if (query.category) where.category = { slug: query.category };
    if (query.brand) where.brand = { slug: query.brand };
    if (query.seller) where.store = { OR: [{ sellerId: query.seller }, { slug: query.seller }] };
    if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
      const price: Prisma.IntFilter<'Variant'> = {};
      if (query.minPriceCents !== undefined) price.gte = query.minPriceCents;
      if (query.maxPriceCents !== undefined) price.lte = query.maxPriceCents;
      where.variants = { some: { priceCents: price } };
    }
    const orderBy = this.toOrderBy(query.sort);
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          brand: true,
          store: true,
          variants: true,
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async reindex() {
    const total = await this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } });
    return { provider: process.env.MEILISEARCH_HOST ? 'meilisearch-configured' : 'database-fallback', indexedProducts: total };
  }

  private toOrderBy(sort: SearchProductsDto['sort']): Prisma.ProductOrderByWithRelationInput[] {
    if (sort === 'name_asc') return [{ name: 'asc' }];
    if (sort === 'price_asc') return [{ variants: { _count: 'asc' } }, { createdAt: 'desc' }];
    if (sort === 'price_desc') return [{ variants: { _count: 'desc' } }, { createdAt: 'desc' }];
    return [{ createdAt: 'desc' }];
  }
}
