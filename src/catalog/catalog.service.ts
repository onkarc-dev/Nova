import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, type Brand, type Category, type Product } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { ListAdminCatalogDto, ListCatalogProductsDto } from './dto/catalog-query.dto';

type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ProductListItem = Product & {
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  brand: Pick<Brand, 'id' | 'name' | 'slug' | 'logoUrl'> | null;
  store: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText: string; sortOrder: number; isPrimary: boolean }[];
  variants: { id: string; sku: string; name: string; priceCents: number; compareAtCents: number | null; currency: string; isActive: boolean }[];
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(query: ListAdminCatalogDto): Promise<PaginatedResult<Category>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CategoryWhereInput = {
      ...(query.isActive === undefined ? { isActive: true } : { isActive: query.isActive }),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return this.paginate(items, total, page, limit);
  }

  async listBrands(query: ListAdminCatalogDto): Promise<PaginatedResult<Brand>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.BrandWhereInput = {
      ...(query.isActive === undefined ? { isActive: true } : { isActive: query.isActive }),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return this.paginate(items, total, page, limit);
  }

  async listProducts(query: ListCatalogProductsDto): Promise<PaginatedResult<ProductListItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildPublicProductWhere(query);
    const orderBy = this.getProductOrder(query.sort);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.productListInclude(),
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.paginate(items, total, page, limit);
  }

  async getProductBySlug(slug: string): Promise<ProductListItem> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE, store: { isVerified: true } },
      include: this.productListInclude(),
    });

    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  private async buildPublicProductWhere(query: ListCatalogProductsDto): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      store: { isVerified: true },
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categorySlug) where.category = { slug: query.categorySlug, isActive: true };
    if (query.brandSlug) where.brand = { slug: query.brandSlug, isActive: true };
    if (query.storeSlug) where.store = { slug: query.storeSlug, isVerified: true };

    return where;
  }

  private getProductOrder(sort: ListCatalogProductsDto['sort']): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'name_asc':
        return [{ name: 'asc' }];
      case 'price_asc':
      case 'price_desc':
        return [{ createdAt: 'desc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  private productListInclude() {
    return {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
      store: { select: { id: true, name: true, slug: true } },
      images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 5 },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' as const },
        select: { id: true, sku: true, name: true, priceCents: true, compareAtCents: true, currency: true, isActive: true },
      },
    } satisfies Prisma.ProductInclude;
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
