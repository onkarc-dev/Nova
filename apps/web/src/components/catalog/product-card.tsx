import Link from 'next/link';
import { Store, Tag } from 'lucide-react';
import type { ProductDto } from '@nova/types';
import { WishlistButton } from '@/components/commerce/wishlist-button';
import { formatPrice, productImage } from '@/lib/catalog';

export function ProductCard({ product }: { product: ProductDto }) {
  const image = productImage(product);

  return (
    <article className="overflow-hidden rounded-md border border-border bg-white">
      <div className="relative aspect-[4/3] bg-muted">
        <Link href={`/products/${product.slug}`} className="block h-full">
          {image.url ? (
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${image.url})` }} aria-label={image.alt} />
          ) : (
            <div className="grid h-full place-items-center bg-[#d9eef0] text-sm font-bold text-muted-foreground">
              Nova
            </div>
          )}
        </Link>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} label="" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-normal text-muted-foreground">
          {product.category ? (
            <Link href={`/categories/${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
          ) : (
            <span>Marketplace</span>
          )}
          {product.brand ? <span>· {product.brand.name}</span> : null}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 min-h-14 text-lg font-black hover:text-primary">{product.name}</h3>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-black">{formatPrice(product)}</span>
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate">{product.store?.name ?? 'Nova seller'}</span>
          </span>
        </div>
        {product.variants?.[0]?.compareAtCents ? (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent">
            <Tag className="h-3.5 w-3.5" /> Seller offer available
          </p>
        ) : null}
      </div>
    </article>
  );
}
