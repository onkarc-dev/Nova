'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, ShoppingCart } from 'lucide-react';
import { NovaApiError } from '@nova/api-client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';

export function AddToCartButton({ variantId, disabled }: { variantId?: string; disabled?: boolean }) {
  const { status } = useAuth();
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  if (status !== 'authenticated') {
    return (
      <Button asChild>
        <Link href="/login?next=/cart">
          <ShoppingCart className="h-4 w-4" />
          Sign in to add
        </Link>
      </Button>
    );
  }

  async function addToCart() {
    if (!variantId || disabled) return;
    setPending(true);
    setMessage(null);
    try {
      await apiClient.cart.addItem(variantId, 1);
      setMessage('Added to cart');
    } catch (error) {
      setMessage(error instanceof NovaApiError ? error.message : 'Could not add item to cart.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={addToCart} disabled={disabled || !variantId || pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        Add to cart
      </Button>
      {message ? <span className="text-sm font-semibold text-muted-foreground">{message}</span> : null}
    </div>
  );
}
