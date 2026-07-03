'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { CheckoutDraftDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { AuthGate } from '@/components/auth/auth-gate';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/catalog';

export function CheckoutPage() {
  const [draft, setDraft] = React.useState<CheckoutDraftDto | null>(null);
  const [selectedAddressId, setSelectedAddressId] = React.useState('');
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    apiClient.checkout
      .get()
      .then((nextDraft) => {
        if (cancelled) return;
        setDraft(nextDraft);
        setSelectedAddressId(nextDraft.addresses.find((address) => address.isDefault)?.id ?? nextDraft.addresses[0]?.id ?? '');
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof NovaApiError ? error.message : 'Checkout could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function validateCheckout() {
    if (!selectedAddressId) return;
    setMessage(null);
    try {
      await apiClient.checkout.validate({ shippingAddressId: selectedAddressId });
      setMessage('Cart and address are valid. Payment integration remains pending.');
    } catch (error) {
      setMessage(error instanceof NovaApiError ? error.message : 'Checkout validation failed.');
    }
  }

  return (
    <AuthGate>
      {status === 'loading' ? <CheckoutState title="Loading checkout" icon={<Loader2 className="h-7 w-7 animate-spin text-primary" />} /> : null}
      {status === 'error' ? <CheckoutState title="Checkout unavailable" description={message ?? undefined} /> : null}
      {status === 'ready' && draft ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-md border border-border bg-white p-5">
            <h2 className="text-xl font-black">Delivery address</h2>
            {draft.addresses.length ? (
              <div className="mt-4 grid gap-3">
                {draft.addresses.map((address) => (
                  <label key={address.id} className="flex gap-3 rounded-md border border-border p-4">
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <span>
                      <span className="block font-black">{address.fullName}</span>
                      <span className="block text-sm leading-6 text-muted-foreground">
                        {address.line1}, {address.city}, {address.state} {address.postalCode}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border p-6 text-sm font-semibold text-muted-foreground">
                Add an address from your account before checkout validation.
              </div>
            )}
            <div className="mt-6 rounded-md bg-muted p-4">
              <div className="flex items-center gap-2 font-black">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Payment integration pending
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Nova validates cart and address readiness in this phase. Payment capture and order placement are reserved for a later phase.
              </p>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-accent">{message}</p> : null}
          </section>
          <aside className="h-fit rounded-md border border-border bg-white p-5">
            <h2 className="text-xl font-black">Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-bold">{draft.summary.itemCount}</span>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-black">{formatCents(draft.summary.subtotalCents, draft.summary.currency)}</span>
            </div>
            <Button type="button" className="mt-5 w-full" disabled={!selectedAddressId || draft.cart.items.length === 0} onClick={() => void validateCheckout()}>
              Validate checkout
            </Button>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/cart">Back to cart</Link>
            </Button>
          </aside>
        </div>
      ) : null}
    </AuthGate>
  );
}

function CheckoutState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-8 text-center">
      {icon ? <div className="mx-auto mb-3 grid place-items-center">{icon}</div> : null}
      <h2 className="text-xl font-black">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
