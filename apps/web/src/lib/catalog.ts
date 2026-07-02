import { createApiClient, NovaApiError } from '@nova/api-client';
import type { BrandDto, CategoryDto, ListProductsQuery, PaginatedResult, ProductDto } from '@nova/types';

const catalogClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
});

export type CatalogLoadState<T> =
  | { status: 'ready'; data: T }
  | { status: 'empty'; data: T }
  | { status: 'error'; message: string };

export async function loadProducts(query: ListProductsQuery = {}): Promise<CatalogLoadState<PaginatedResult<ProductDto>>> {
  try {
    const data = await catalogClient.catalog.listProducts({ limit: 12, ...query }, { cache: 'no-store' });
    return data.items.length ? { status: 'ready', data } : { status: 'empty', data };
  } catch (error) {
    return toCatalogError(error);
  }
}

export async function loadProduct(slug: string): Promise<CatalogLoadState<ProductDto>> {
  try {
    const data = await catalogClient.catalog.getProductBySlug(slug, { cache: 'no-store' });
    return { status: 'ready', data };
  } catch (error) {
    return toCatalogError(error);
  }
}

export async function loadCategories(): Promise<CatalogLoadState<PaginatedResult<CategoryDto>>> {
  try {
    const data = await catalogClient.catalog.listCategories({ limit: 24 }, { cache: 'no-store' });
    return data.items.length ? { status: 'ready', data } : { status: 'empty', data };
  } catch (error) {
    return toCatalogError(error);
  }
}

export async function loadBrands(): Promise<CatalogLoadState<PaginatedResult<BrandDto>>> {
  try {
    const data = await catalogClient.catalog.listBrands({ limit: 12 }, { cache: 'no-store' });
    return data.items.length ? { status: 'ready', data } : { status: 'empty', data };
  } catch (error) {
    return toCatalogError(error);
  }
}

export function formatPrice(product: ProductDto): string {
  const variant = product.variants?.[0];
  if (!variant) return 'Price pending';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: variant.currency ?? 'INR',
    maximumFractionDigits: 0,
  }).format(variant.priceCents / 100);
}

export function productImage(product: ProductDto): { url: string | null; alt: string } {
  const image = product.images?.[0];
  return {
    url: image?.url ?? null,
    alt: image?.altText ?? image?.alt ?? product.name,
  };
}

function toCatalogError<T>(error: unknown): CatalogLoadState<T> {
  if (error instanceof NovaApiError) {
    return { status: 'error', message: error.message };
  }

  return { status: 'error', message: 'The catalog could not be loaded right now.' };
}
