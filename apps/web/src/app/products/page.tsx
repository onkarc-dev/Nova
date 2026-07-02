import type { ListProductsQuery } from '@nova/types';
import { CatalogEmpty, CatalogError } from '@/components/catalog/catalog-state';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { ProductGrid } from '@/components/catalog/product-grid';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { loadProducts } from '@/lib/catalog';

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = toProductQuery(params);
  const products = await loadProducts(query);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Nova catalog</p>
          <h1 className="mt-2 text-4xl font-black">Shop products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse active products from verified Nova stores. Search and category filters use the backend catalog API.
          </p>
        </div>
        <CatalogToolbar search={query.search} categorySlug={query.categorySlug} />
        <div className="mt-6">
          {products.status === 'ready' ? <ProductGrid products={products.data.items} /> : null}
          {products.status === 'empty' ? (
            <CatalogEmpty title="No products match this search" description="Try a different keyword or category." />
          ) : null}
          {products.status === 'error' ? <CatalogError message={products.message} /> : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function toProductQuery(params: SearchParams | undefined): ListProductsQuery {
  return {
    search: single(params?.search),
    categorySlug: single(params?.categorySlug),
    brandSlug: single(params?.brandSlug),
    storeSlug: single(params?.storeSlug),
    sort: toSort(single(params?.sort)),
    page: toNumber(single(params?.page)),
  };
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSort(value: string | undefined): ListProductsQuery['sort'] {
  if (value === 'name_asc') return value;
  return 'newest';
}
