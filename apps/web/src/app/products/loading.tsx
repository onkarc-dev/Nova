import { CatalogSkeleton } from '@/components/catalog/catalog-state';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export default function ProductsLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <CatalogSkeleton />
      </main>
      <SiteFooter />
    </>
  );
}
