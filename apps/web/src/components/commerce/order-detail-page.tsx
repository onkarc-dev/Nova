'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { OrderDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/catalog';

export function OrderDetailPageContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = React.useState<OrderDto | null>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    apiClient.orders
      .get(orderId)
      .then((nextOrder) => {
        if (!cancelled) {
          setOrder(nextOrder);
          setStatus('ready');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(error instanceof NovaApiError ? error.message : 'Order could not be loaded.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === 'loading') return <State title="Loading order" icon={<Loader2 className="h-7 w-7 animate-spin text-primary" />} />;
  if (status === 'error') return <State title="Order unavailable" description={message ?? undefined} />;
  if (!order) return null;

  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-border bg-background p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-accent">{order.status}</p>
            <h2 className="mt-1 text-2xl font-black">{order.orderNumber}</h2>
          </div>
          <p className="text-2xl font-black">{formatCents(order.totalCents, order.currency)}</p>
        </div>
      </section>
      <section className="rounded-md border border-border bg-background p-5">
        <h3 className="text-xl font-black">Items</h3>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between gap-3 rounded-md border border-border bg-white p-4">
              <div>
                <p className="font-black">{item.nameSnapshot}</p>
                <p className="text-sm font-semibold text-muted-foreground">{item.storeNameSnapshot}</p>
              </div>
              <p className="font-black">
                {item.quantity} x {formatCents(item.unitPriceCents, order.currency)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <Button asChild variant="outline">
        <Link href="/account/orders">Back to orders</Link>
      </Button>
    </div>
  );
}

function State({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-8 text-center">
      {icon ? <div className="mx-auto mb-3 grid place-items-center">{icon}</div> : null}
      <h2 className="text-xl font-black">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
