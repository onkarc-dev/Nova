import type { ProductStatus } from '@prisma/client';
import type { SearchProductsDto } from './dto/search-products.dto';

export interface ProductSearchResult<TProduct = unknown> {
  items: TProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductSearchDocument {
  productId: string;
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  brandId: string | null;
  brandName: string | null;
  brandSlug: string | null;
  sellerId: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAutocompleteSuggestion {
  value: string;
  type: 'product' | 'category' | 'brand' | 'store';
  score: number;
}

export interface SearchProvider {
  readonly name: string;
  searchProducts(query: SearchProductsDto): Promise<ProductSearchResult>;
  autocompleteProducts(query: string, limit: number): Promise<ProductAutocompleteSuggestion[]>;
  indexProduct(productId: string): Promise<void>;
  removeProduct(productId: string): Promise<void>;
  reindexProducts(): Promise<number>;
}

export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER');
