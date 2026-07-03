'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import type { WishlistDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatPrice, productImage } from '@/lib/catalog';

export function WishlistPageContent() {
  const [wishlist, setWishlist] = React.useState<WishlistDto | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = React.useState<string | null>(null);

  const loadWishlist = React.useCallback(async () => {
    setStatus('loading');
    setMessage(null);
    try {
      setWishlist(await apiClient.wishlist.get());
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof NovaApiError ? error.message : 'Wishlist could not be loaded.');
    }
  }, []);

  React.useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  async function removeItem(productId: string) {
    setWishlist(await apiClient.wishlist.removeItem(productId));
  }

  return (
    <>
      {status === 'loading' ? <State title="Loading wishlist" icon={<Loader2 className="h-7 w-7 animate-spin text-primary" />} /> : null}
      {status === 'error' ? <State title="Wishlist unavailable" description={message ?? undefined} action={<Button onClick={loadWishlist}>Try again</Button>} /> : null}
      {status === 'ready' && wishlist?.items.length === 0 ? (
        <State
          title="Your wishlist is empty"
          description="Save products while browsing Nova and they will appear here."
          icon={<Heart className="h-8 w-8 text-primary" />}
          action={
            <Button asChild>
              <Link href="/products">Explore products</Link>
            </Button>
          }
        />
      ) : null}
      {status === 'ready' && wishlist && wishlist.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlist.items.map((item) => {
            const image = productImage(item.product);
            const variant = item.product.variants?.find((entry) => entry.isActive !== false) ?? item.product.variants?.[0];
            return (
              <article key={item.productId} className="overflow-hidden rounded-md border border-border bg-background">
                <Link href={`/products/${item.product.slug}`} className="block aspect-[4/3] bg-muted bg-cover bg-center" style={image.url ? { backgroundImage: `url(${image.url})` } : undefined} />
                <div className="p-4">
                  <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-lg font-black hover:text-primary">
                    {item.product.name}
                  </Link>
                  <p className="mt-2 font-black">{formatPrice(item.product)}</p>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" size="sm" disabled={!variant} onClick={() => variant && void apiClient.cart.addItem(variant.id, 1)}>
                      <ShoppingCart className="h-4 w-4" />
                      Add
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void removeItem(item.productId)}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function State({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-8 text-center">
      {icon ? <div className="mx-auto mb-3 grid place-items-center">{icon}</div> : null}
      <h2 className="text-xl font-black">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
