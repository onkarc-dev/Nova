'use client';

import Link from 'next/link';
import { Loader2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, error } = useAuth();

  if (status === 'loading') {
    return (
      <div className="rounded-md border border-border bg-background p-8 text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        <p className="mt-3 text-sm font-semibold text-muted-foreground">Checking your Nova session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-md border border-border bg-background p-8 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 text-xl font-black">Sign in required</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Your account area is protected. Sign in to view profile, address, wishlist, order, and notification surfaces.
        </p>
        {error ? <p className="mt-3 text-sm font-semibold text-accent">{error}</p> : null}
        <Button asChild className="mt-5">
          <Link href="/login?next=/account">Sign in</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
