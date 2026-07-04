import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { SearchProductsDto } from './dto/search-products.dto';
import { mapProductToSearchDocument, searchProductInclude, type SearchableProduct } from './search-document.mapper';
import type { ProductAutocompleteSuggestion, ProductSearchResult, SearchProvider } from './search-provider.interface';

@Injectable()
export class DatabaseSearchProvider implements SearchProvider {
  readonly name = 'database';

  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(query: SearchProductsDto): Promise<ProductSearchResult<SearchableProduct>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = this.buildWhere(query);
    const products = await this.prisma.product.findMany({
      where,
      include: searchProductInclude,
    });
    const ranked = products.sort((left, right) => this.compareProducts(left, right, query));
    const total = ranked.length;
    const items = ranked.slice((page - 1) * limit, page * limit);
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async autocompleteProducts(query: string, limit: number): Promise<ProductAutocompleteSuggestion[]> {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        store: { isVerified: true },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { brand: { name: { contains: query, mode: 'insensitive' } } },
          { store: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        store: { select: { name: true } },
      },
      take: Math.max(limit * 5, limit),
    });
    const suggestions = new Map<string, ProductAutocompleteSuggestion>();
    for (const product of products) {
      this.addSuggestion(suggestions, product.name, 'product', normalizedQuery);
      this.addSuggestion(suggestions, product.category.name, 'category', normalizedQuery);
      if (product.brand) this.addSuggestion(suggestions, product.brand.name, 'brand', normalizedQuery);
      this.addSuggestion(suggestions, product.store.name, 'store', normalizedQuery);
    }
    return [...suggestions.values()]
      .sort((left, right) => right.score - left.score || left.value.localeCompare(right.value))
      .slice(0, limit);
  }

  indexProduct(productId: string): Promise<void> {
    void productId;
    return Promise.resolve();
  }

  removeProduct(productId: string): Promise<void> {
    void productId;
    return Promise.resolve();
  }

  async reindexProducts(): Promise<number> {
    return this.prisma.product.count({ where: { status: ProductStatus.ACTIVE, store: { isVerified: true } } });
  }

  private buildWhere(query: SearchProductsDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      store: { isVerified: true },
    };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { slug: { contains: query.q, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: query.q, mode: 'insensitive' } } } },
        { category: { name: { contains: query.q, mode: 'insensitive' } } },
        { brand: { name: { contains: query.q, mode: 'insensitive' } } },
        { store: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }
    if (query.category) where.category = { slug: query.category, isActive: true };
    if (query.brand) where.brand = { slug: query.brand, isActive: true };
    if (query.seller) where.store = { isVerified: true, OR: [{ sellerId: query.seller }, { slug: query.seller }] };
    if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
      const price: Prisma.IntFilter<'Variant'> = {};
      if (query.minPriceCents !== undefined) price.gte = query.minPriceCents;
      if (query.maxPriceCents !== undefined) price.lte = query.maxPriceCents;
      where.variants = { some: { isActive: true, priceCents: price } };
    }
    return where;
  }

  private compareProducts(left: SearchableProduct, right: SearchableProduct, query: SearchProductsDto): number {
    if (query.sort === 'name_asc') return left.name.localeCompare(right.name);
    if (query.sort === 'price_asc') return compareNullableNumber(getMinActivePrice(left), getMinActivePrice(right), 'asc') || right.createdAt.getTime() - left.createdAt.getTime();
    if (query.sort === 'price_desc') return compareNullableNumber(getMinActivePrice(left), getMinActivePrice(right), 'desc') || right.createdAt.getTime() - left.createdAt.getTime();
    if (query.sort === 'relevance' || query.q) {
      const queryText = normalizeSearchText(query.q ?? '');
      const relevance = this.scoreProduct(right, queryText) - this.scoreProduct(left, queryText);
      if (relevance !== 0) return relevance;
    }
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  private scoreProduct(product: SearchableProduct, normalizedQuery: string): number {
    if (!normalizedQuery) return 0;
    const doc = mapProductToSearchDocument(product);
    return (
      scoreText(doc.name, normalizedQuery, 60) +
      scoreText(doc.categoryName, normalizedQuery, 30) +
      scoreText(doc.brandName ?? '', normalizedQuery, 20) +
      scoreText(doc.storeName, normalizedQuery, 15) +
      scoreText(doc.description, normalizedQuery, 5)
    );
  }

  private addSuggestion(
    suggestions: Map<string, ProductAutocompleteSuggestion>,
    value: string,
    type: ProductAutocompleteSuggestion['type'],
    normalizedQuery: string,
  ): void {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue.includes(normalizedQuery)) return;
    const score = normalizedValue.startsWith(normalizedQuery) ? 100 : 50;
    const existing = suggestions.get(normalizedValue);
    if (!existing || score > existing.score) {
      suggestions.set(normalizedValue, { value, type, score });
    }
  }
}

function getMinActivePrice(product: SearchableProduct): number | null {
  const prices = product.variants.map((variant) => variant.priceCents);
  return prices.length ? Math.min(...prices) : null;
}

function compareNullableNumber(left: number | null, right: number | null, direction: 'asc' | 'desc'): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === 'asc' ? left - right : right - left;
}

function scoreText(value: string, normalizedQuery: string, weight: number): number {
  const normalizedValue = normalizeSearchText(value);
  if (!normalizedValue) return 0;
  if (normalizedValue === normalizedQuery) return weight * 3;
  if (normalizedValue.startsWith(normalizedQuery)) return weight * 2;
  if (normalizedValue.includes(normalizedQuery)) return weight;
  return 0;
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
