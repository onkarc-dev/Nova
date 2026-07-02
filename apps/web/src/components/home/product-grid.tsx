import Link from 'next/link';
import type { PaginatedResult, ProductDto } from '@nova/types';
import { Button } from '@/components/ui/button';
import { CatalogEmpty, CatalogError } from '@/components/catalog/catalog-state';
import { ProductGrid as CatalogProductGrid } from '@/components/catalog/product-grid';
import type { CatalogLoadState } from '@/lib/catalog';

export function ProductGrid({ products }: { products: CatalogLoadState<PaginatedResult<ProductDto>> }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Featured products</p>
          <h2 className="mt-2 text-3xl font-black">Fresh finds from Nova sellers.</h2>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">View all</Link>
        </Button>
      </div>
      <div className="mt-6">
        {products.status === 'ready' ? <CatalogProductGrid products={products.data.items} /> : null}
        {products.status === 'empty' ? (
          <CatalogEmpty title="No products are live yet" description="Approved seller products will appear here when the catalog has active inventory." />
        ) : null}
        {products.status === 'error' ? <CatalogError message={products.message} /> : null}
      </div>
    </section>
  );
}
