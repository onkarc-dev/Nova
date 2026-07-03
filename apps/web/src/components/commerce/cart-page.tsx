'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartDto, CartItemDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { AuthGate } from '@/components/auth/auth-gate';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatCents, productImage } from '@/lib/catalog';

export function CartPage() {
  const [cart, setCart] = React.useState<CartDto | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = React.useState<string | null>(null);

  const loadCart = React.useCallback(async () => {
    setStatus('loading');
    setMessage(null);
    try {
      setCart(await apiClient.cart.get());
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof NovaApiError ? error.message : 'Cart could not be loaded.');
    }
  }, []);

  React.useEffect(() => {
    void loadCart();
  }, [loadCart]);

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setCart(await apiClient.cart.updateItem(itemId, quantity));
  }

  async function removeItem(itemId: string) {
    setCart(await apiClient.cart.removeItem(itemId));
  }

  return (
    <AuthGate>
      {status === 'loading' ? <CartState icon={<Loader2 className="h-7 w-7 animate-spin text-primary" />} title="Loading cart" /> : null}
      {status === 'error' ? <CartState title="Cart unavailable" description={message ?? undefined} action={<Button onClick={loadCart}>Try again</Button>} /> : null}
      {status === 'ready' && cart?.items.length === 0 ? (
        <CartState
          icon={<ShoppingBag className="h-8 w-8 text-primary" />}
          title="Your cart is empty"
          description="Browse Nova products and add a few favorites when you are ready."
          action={
            <Button asChild>
              <Link href="/products">Shop products</Link>
            </Button>
          }
        />
      ) : null}
      {status === 'ready' && cart && cart.items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3">
            {cart.items.map((item) => (
              <CartLine key={item.id} item={item} onQuantity={updateQuantity} onRemove={removeItem} />
            ))}
          </div>
          <aside className="h-fit rounded-md border border-border bg-white p-5">
            <h2 className="text-xl font-black">Order summary</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-bold">{cart.summary.itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-black">{formatCents(cart.summary.subtotalCents, cart.summary.currency)}</span>
              </div>
              <p className="rounded-md bg-muted p-3 text-xs font-semibold text-muted-foreground">
                Shipping, taxes, and payment are not finalized in this phase.
              </p>
            </div>
            <Button asChild className="mt-5 w-full">
              <Link href="/checkout">Continue to checkout</Link>
            </Button>
          </aside>
        </div>
      ) : null}
    </AuthGate>
  );
}

function CartLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItemDto;
  onQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const product = item.product ?? item.variant.product;
  const image = product ? productImage(product) : { url: null, alt: item.variant.name };
  const [pending, setPending] = React.useState(false);

  async function run(action: () => Promise<void>) {
    setPending(true);
    try {
      await action();
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="grid gap-4 rounded-md border border-border bg-white p-4 sm:grid-cols-[112px_1fr_auto]">
      <div className="aspect-square rounded-md bg-muted bg-cover bg-center" style={image.url ? { backgroundImage: `url(${image.url})` } : undefined} />
      <div>
        <Link href={product ? `/products/${product.slug}` : '/products'} className="text-lg font-black hover:text-primary">
          {product?.name ?? item.variant.name}
        </Link>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{item.variant.name}</p>
        <p className="mt-3 font-black">{formatCents(item.variant.priceCents, item.variant.currency)}</p>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <input
          aria-label="Quantity"
          className="h-10 w-20 rounded-md border border-border px-3 text-sm font-bold"
          min={1}
          type="number"
          value={item.quantity}
          disabled={pending}
          onChange={(event) => void run(() => onQuantity(item.id, Number(event.target.value)))}
        />
        <Button type="button" variant="ghost" size="icon" aria-label="Remove item" disabled={pending} onClick={() => void run(() => onRemove(item.id))}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function CartState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-white p-8 text-center">
      {icon ? <div className="mx-auto mb-3 grid place-items-center">{icon}</div> : null}
      <h2 className="text-xl font-black">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
