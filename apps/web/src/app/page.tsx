import { Hero } from '@/components/home/hero';
import { ProductGrid } from '@/components/home/product-grid';
import { CategoryStrip } from '@/components/catalog/category-strip';
import { CatalogError } from '@/components/catalog/catalog-state';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { loadCategories, loadProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, categories] = await Promise.all([loadProducts({ limit: 6 }), loadCategories()]);

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        {categories.status === 'ready' ? <CategoryStrip categories={categories.data.items.slice(0, 8)} /> : null}
        {categories.status === 'error' ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <CatalogError message={categories.message} />
          </section>
        ) : null}
        <ProductGrid products={products} />
      </main>
      <SiteFooter />
    </>
  );
}
