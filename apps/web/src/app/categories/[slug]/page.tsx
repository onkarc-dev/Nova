import { CatalogEmpty, CatalogError } from '@/components/catalog/catalog-state';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { ProductGrid } from '@/components/catalog/product-grid';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { loadProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await loadProducts({ categorySlug: slug, limit: 12 });
  const title = humanizeSlug(slug);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Department</p>
          <h1 className="mt-2 text-4xl font-black">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Products shown here are filtered by category slug through the backend catalog API.
          </p>
        </div>
        <CatalogToolbar categorySlug={slug} />
        <div className="mt-6">
          {products.status === 'ready' ? <ProductGrid products={products.data.items} /> : null}
          {products.status === 'empty' ? (
            <CatalogEmpty title="No products in this category yet" description="This department is ready for seller catalog data." />
          ) : null}
          {products.status === 'error' ? <CatalogError message={products.message} /> : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
