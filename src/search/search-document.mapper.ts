import { ProductStatus, type Prisma } from '@prisma/client';
import type { ProductSearchDocument } from './search-provider.interface';

export const searchProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  store: { select: { id: true, sellerId: true, name: true, slug: true, isVerified: true } },
  variants: {
    where: { isActive: true },
    select: { priceCents: true, currency: true },
    orderBy: { priceCents: 'asc' as const },
  },
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: 1,
    select: { url: true },
  },
  ratings: {
    select: { value: true },
  },
} satisfies Prisma.ProductInclude;

export type SearchableProduct = Prisma.ProductGetPayload<{ include: typeof searchProductInclude }>;

export function mapProductToSearchDocument(product: SearchableProduct): ProductSearchDocument {
  const prices = product.variants.map((variant) => variant.priceCents);
  const ratings = product.ratings.map((rating) => rating.value);
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    brandId: product.brandId,
    brandName: product.brand?.name ?? null,
    brandSlug: product.brand?.slug ?? null,
    sellerId: product.store.sellerId,
    storeId: product.storeId,
    storeName: product.store.name,
    storeSlug: product.store.slug,
    minPriceCents: prices.length ? Math.min(...prices) : null,
    maxPriceCents: prices.length ? Math.max(...prices) : null,
    currency: product.variants[0]?.currency ?? null,
    imageUrl: product.images[0]?.url ?? null,
    rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    reviewCount: ratings.length,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function shouldIndexProduct(product: SearchableProduct): boolean {
  return product.status === ProductStatus.ACTIVE && product.store.isVerified;
}
