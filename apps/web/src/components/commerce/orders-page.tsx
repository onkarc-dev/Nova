'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Package } from 'lucide-react';
import type { OrderDto } from '@nova/types';
import { NovaApiError } from '@nova/api-client';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { formatCents } from '@/lib/catalog';

export function OrdersPageContent() {
  const [orders, setOrders] = React.useState<OrderDto[]>([]);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = React.useState<string | null>(null);

  const loadOrders = React.useCallback(async () => {
    setStatus('loading');
    setMessage(null);
    try {
      setOrders(await apiClient.orders.list());
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof NovaApiError ? error.message : 'Orders could not be loaded.');
    }
  }, []);

  React.useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (status === 'loading') return <State title="Loading orders" icon={<Loader2 className="h-7 w-7 animate-spin text-primary" />} />;
  if (status === 'error') return <State title="Orders unavailable" description={message ?? undefined} action={<Button onClick={loadOrders}>Try again</Button>} />;
  if (orders.length === 0) {
    return (
      <State
        title="No orders yet"
        description="Orders will appear here after Nova order placement is implemented in a later phase."
        icon={<Package className="h-8 w-8 text-primary" />}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-background p-4">
          <div>
            <Link href={`/account/orders/${order.id}`} className="font-black hover:text-primary">
              {order.orderNumber}
            </Link>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{order.status}</p>
          </div>
          <div className="text-right">
            <p className="font-black">{formatCents(order.totalCents, order.currency)}</p>
            <p className="text-xs font-semibold text-muted-foreground">{order.items.length} items</p>
          </div>
        </article>
      ))}
    </div>
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
