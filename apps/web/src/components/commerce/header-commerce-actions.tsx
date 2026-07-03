'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Heart, ShoppingCart, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';

export function HeaderCommerceActions() {
  const { status } = useAuth();
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    if (status !== 'authenticated') {
      setCartCount(0);
      return;
    }

    let cancelled = false;
    apiClient.cart
      .get()
      .then((cart) => {
        if (!cancelled) setCartCount(cart.summary.itemCount);
      })
      .catch(() => {
        if (!cancelled) setCartCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <nav className="ml-auto flex items-center gap-1">
      <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
        <Link href="/account/wishlist">
          <Heart className="h-5 w-5" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Cart">
        <Link href="/cart" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-black text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Notifications">
        <Link href="/account/notifications">
          <Bell className="h-5 w-5" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Account">
        <Link href="/account">
          <UserRound className="h-5 w-5" />
        </Link>
      </Button>
    </nav>
  );
}
