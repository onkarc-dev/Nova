import { AccountShell } from '@/components/layout/account-shell';

export default function PaymentMethodsPage() {
  return (
    <AccountShell title="Payment methods" description="This surface is intentionally a shell only. Real payment providers must be added in a later payments phase.">
      <div className="rounded-md border border-dashed border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground">
        Payment methods are not connected yet.
      </div>
    </AccountShell>
  );
}
