'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
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
        <h3 className="text-xl font-black">Order timeline</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {[
            ['PENDING_PAYMENT', 'Pending payment'],
            ['CANCELLED', 'Cancelled'],
            ['PAID', 'Paid'],
            ['SHIPPED', 'Shipped'],
            ['DELIVERED', 'Delivered'],
          ].map(([status, label]) => {
            const active = order.status === status;
            return (
              <div key={status} className="rounded-md border border-border bg-white p-3">
                {active ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                <p className="mt-2 text-sm font-black">{label}</p>
              </div>
            );
          })}
        </div>
        {order.status === 'PENDING_PAYMENT' ? (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm font-semibold text-muted-foreground">
            Payment is pending. Nova has not marked this order paid and no payment success has been simulated.
          </p>
        ) : null}
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
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-5">
          <h3 className="text-xl font-black">Pricing snapshot</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <PriceRow label="Subtotal" value={formatCents(order.subtotalCents, order.currency)} />
            <PriceRow label="Taxes" value={formatCents(order.taxCents, order.currency)} />
            <PriceRow label="Shipping" value={formatCents(order.shippingCents, order.currency)} />
            <PriceRow label="Discounts" value={formatCents(order.discountCents, order.currency)} />
            <PriceRow label="Total" value={formatCents(order.totalCents, order.currency)} strong />
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-5">
          <h3 className="text-xl font-black">Addresses</h3>
          <div className="mt-4 grid gap-4 text-sm">
            <AddressBlock title="Shipping" address={order.shippingAddress} />
            <AddressBlock title="Billing" address={order.billingAddress} />
          </div>
        </div>
      </section>
      {order.payments?.length ? (
        <section className="rounded-md border border-border bg-background p-5">
          <h3 className="text-xl font-black">Payment</h3>
          {order.payments.map((payment) => (
            <div key={payment.id} className="mt-4 rounded-md border border-border bg-white p-4 text-sm">
              <p className="font-black">{payment.status}</p>
              <p className="mt-1 text-muted-foreground">
                {payment.provider} - {formatCents(payment.amountCents, payment.currency)}
              </p>
            </div>
          ))}
        </section>
      ) : null}
      <Button asChild variant="outline">
        <Link href="/account/orders">Back to orders</Link>
      </Button>
    </div>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between border-t border-border pt-3 text-base font-black' : 'flex justify-between'}>
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-black text-foreground' : 'font-bold'}>{value}</span>
    </div>
  );
}

function AddressBlock({ title, address }: { title: string; address: OrderDto['shippingAddress'] }) {
  if (!address) {
    return (
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-muted-foreground">Not attached</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-muted-foreground">
        {address.fullName}, {address.line1}, {address.city}, {address.state} {address.postalCode}
      </p>
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
