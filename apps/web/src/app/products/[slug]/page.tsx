import Link from 'next/link';
import { Store, Truck } from 'lucide-react';
import type { ProductDto } from '@nova/types';
import { Button } from '@/components/ui/button';
import { CatalogError } from '@/components/catalog/catalog-state';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { formatPrice, loadProduct, productImage } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productState = await loadProduct(slug);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {productState.status === 'ready' ? <ProductDetail product={productState.data} /> : null}
        {productState.status === 'empty' ? null : null}
        {productState.status === 'error' ? <CatalogError message={productState.message} /> : null}
      </main>
      <SiteFooter />
    </>
  );
}

function ProductDetail({ product }: { product: ProductDto }) {
  const image = productImage(product);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <div
          className="aspect-square bg-muted bg-cover bg-center"
          style={image.url ? { backgroundImage: `url(${image.url})` } : undefined}
          aria-label={image.alt}
        >
          {!image.url ? <div className="grid h-full place-items-center text-lg font-black text-muted-foreground">Nova</div> : null}
        </div>
      </div>
      <section className="rounded-md border border-border bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-normal text-accent">{product.category?.name ?? 'Nova marketplace'}</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">{product.name}</h1>
        <p className="mt-3 text-3xl font-black text-primary">{formatPrice(product)}</p>
        <p className="mt-4 leading-7 text-muted-foreground">{product.description}</p>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <span className="flex items-center gap-2 rounded-md bg-background p-3 font-semibold">
            <Store className="h-4 w-4 text-primary" /> {product.store?.name ?? 'Nova seller'}
          </span>
          <span className="flex items-center gap-2 rounded-md bg-background p-3 font-semibold">
            <Truck className="h-4 w-4 text-primary" /> Delivery details coming soon
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled>Purchasing unavailable in Phase F2</Button>
          <Button asChild variant="outline">
            <Link href="/products">Back to products</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
