import { AccountShell } from '@/components/layout/account-shell';

export default function OrdersPage() {
  return (
    <AccountShell title="Orders" description="Order history, shipment status, invoices, returns, and support entry points will live here.">
      <div className="rounded-md border border-dashed border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground">
        No orders are connected yet.
      </div>
    </AccountShell>
  );
}
