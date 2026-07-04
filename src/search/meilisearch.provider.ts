import { Injectable } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { SearchProductsDto } from './dto/search-products.dto';
import { mapProductToSearchDocument, searchProductInclude, shouldIndexProduct, type SearchableProduct } from './search-document.mapper';
import { normalizeSearchText } from './database-search.provider';
import type { ProductAutocompleteSuggestion, ProductSearchDocument, ProductSearchResult, SearchProvider } from './search-provider.interface';

interface MeilisearchConfig {
  host: string;
  apiKey: string;
  indexName: string;
}

interface MeilisearchSearchHit {
  productId?: string;
  name?: string;
  categoryName?: string | null;
  brandName?: string | null;
  storeName?: string | null;
}

interface MeilisearchSearchResponse {
  hits?: MeilisearchSearchHit[];
  estimatedTotalHits?: number;
  totalHits?: number;
}

@Injectable()
export class MeilisearchProvider implements SearchProvider {
  readonly name = 'meilisearch';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: MeilisearchConfig,
  ) {}

  async searchProducts(query: SearchProductsDto): Promise<ProductSearchResult<SearchableProduct>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const response = await this.request<MeilisearchSearchResponse>(`indexes/${encodeURIComponent(this.config.indexName)}/search`, {
      method: 'POST',
      body: JSON.stringify({
        q: query.q ?? '',
        offset: (page - 1) * limit,
        limit,
        filter: this.toFilters(query),
        sort: this.toSort(query.sort),
      }),
    });
    const ids = (response.hits ?? []).map((hit) => hit.productId).filter((id): id is string => Boolean(id));
    const items = ids.length ? await this.findProductsByIds(ids) : [];
    const total = response.estimatedTotalHits ?? response.totalHits ?? items.length;
    return {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async autocompleteProducts(query: string, limit: number): Promise<ProductAutocompleteSuggestion[]> {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];
    const response = await this.request<MeilisearchSearchResponse>(`indexes/${encodeURIComponent(this.config.indexName)}/search`, {
      method: 'POST',
      body: JSON.stringify({
        q: query,
        limit: Math.max(limit * 3, limit),
        attributesToSearchOn: ['name', 'categoryName', 'brandName', 'storeName'],
        attributesToRetrieve: ['name', 'categoryName', 'brandName', 'storeName'],
        filter: ['status = ACTIVE'],
      }),
    });
    const suggestions = new Map<string, ProductAutocompleteSuggestion>();
    for (const hit of response.hits ?? []) {
      this.addSuggestion(suggestions, hit.name, 'product', normalizedQuery);
      this.addSuggestion(suggestions, hit.categoryName, 'category', normalizedQuery);
      this.addSuggestion(suggestions, hit.brandName, 'brand', normalizedQuery);
      this.addSuggestion(suggestions, hit.storeName, 'store', normalizedQuery);
    }
    return [...suggestions.values()]
      .sort((left, right) => right.score - left.score || left.value.localeCompare(right.value))
      .slice(0, limit);
  }

  async indexProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: searchProductInclude });
    if (!product || !shouldIndexProduct(product)) {
      await this.removeProduct(productId);
      return;
    }
    await this.indexDocuments([mapProductToSearchDocument(product)]);
  }

  async removeProduct(productId: string): Promise<void> {
    await this.request(`indexes/${encodeURIComponent(this.config.indexName)}/documents/${encodeURIComponent(productId)}`, { method: 'DELETE' });
  }

  async reindexProducts(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, store: { isVerified: true } },
      include: searchProductInclude,
    });
    await this.indexDocuments(products.map((product) => mapProductToSearchDocument(product)));
    return products.length;
  }

  private async findProductsByIds(ids: string[]): Promise<SearchableProduct[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, status: ProductStatus.ACTIVE, store: { isVerified: true } },
      include: searchProductInclude,
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids.map((id) => byId.get(id)).filter((product): product is SearchableProduct => Boolean(product));
  }

  private async indexDocuments(documents: ProductSearchDocument[]): Promise<void> {
    if (!documents.length) return;
    await this.request(`indexes/${encodeURIComponent(this.config.indexName)}/documents?primaryKey=productId`, {
      method: 'PUT',
      body: JSON.stringify(documents),
    });
  }

  private toFilters(query: SearchProductsDto): string[] {
    const filters = ['status = ACTIVE'];
    if (query.category) filters.push(`categorySlug = ${JSON.stringify(query.category)}`);
    if (query.brand) filters.push(`brandSlug = ${JSON.stringify(query.brand)}`);
    if (query.seller) filters.push(`(sellerId = ${JSON.stringify(query.seller)} OR storeSlug = ${JSON.stringify(query.seller)})`);
    if (query.minPriceCents !== undefined) filters.push(`minPriceCents >= ${String(query.minPriceCents)}`);
    if (query.maxPriceCents !== undefined) filters.push(`minPriceCents <= ${String(query.maxPriceCents)}`);
    return filters;
  }

  private toSort(sort: SearchProductsDto['sort']): string[] | undefined {
    if (sort === 'newest') return ['createdAt:desc'];
    if (sort === 'price_asc') return ['minPriceCents:asc'];
    if (sort === 'price_desc') return ['minPriceCents:desc'];
    if (sort === 'name_asc') return ['name:asc'];
    return undefined;
  }

  private addSuggestion(
    suggestions: Map<string, ProductAutocompleteSuggestion>,
    value: string | null | undefined,
    type: ProductAutocompleteSuggestion['type'],
    normalizedQuery: string,
  ): void {
    if (!value) return;
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue.includes(normalizedQuery)) return;
    const score = normalizedValue.startsWith(normalizedQuery) ? 100 : 50;
    const existing = suggestions.get(normalizedValue);
    if (!existing || score > existing.score) {
      suggestions.set(normalizedValue, { value, type, score });
    }
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    const response = await fetch(`${this.config.host.replace(/\/$/, '')}/${path}`, {
      ...init,
      headers,
    });
    if (!response.ok) {
      throw new Error(`Meilisearch request failed with HTTP ${String(response.status)}.`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

export function getMeilisearchConfig(): MeilisearchConfig | null {
  const host = process.env.MEILISEARCH_HOST?.trim();
  const apiKey = process.env.MEILISEARCH_API_KEY?.trim();
  const configuredIndexName = process.env.MEILISEARCH_INDEX_PRODUCTS?.trim();
  const indexName = configuredIndexName && configuredIndexName.length > 0 ? configuredIndexName : 'products';
  if (!host || !apiKey) return null;
  return { host, apiKey, indexName };
}
