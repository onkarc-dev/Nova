'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { NovaApiError } from '@nova/api-client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';

export function WishlistButton({ productId, label = 'Save' }: { productId: string; label?: string }) {
  const { status } = useAuth();
  const [saved, setSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function toggleWishlist() {
    if (status !== 'authenticated') return;
    setPending(true);
    setMessage(null);

    try {
      if (saved) {
        await apiClient.wishlist.removeItem(productId);
        setSaved(false);
      } else {
        await apiClient.wishlist.addItem(productId);
        setSaved(true);
      }
    } catch (error) {
      if (error instanceof NovaApiError && error.status === 409) {
        setSaved(true);
        setMessage('Already saved');
      } else {
        setMessage(error instanceof NovaApiError ? error.message : 'Wishlist update failed.');
      }
    } finally {
      setPending(false);
    }
  }

  if (status !== 'authenticated') {
    return (
      <Button asChild variant="secondary" size={label ? 'default' : 'icon'} aria-label="Sign in to save">
        <Link href="/login?next=/account/wishlist">
          <Heart className="h-4 w-4" />
          {label ? <span>{label}</span> : null}
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant={saved ? 'primary' : 'secondary'} size={label ? 'default' : 'icon'} onClick={toggleWishlist} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        {label ? <span>{saved ? 'Saved' : label}</span> : null}
      </Button>
      {message ? <span className="text-xs font-semibold text-muted-foreground">{message}</span> : null}
    </div>
  );
}
