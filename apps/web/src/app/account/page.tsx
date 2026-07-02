import { AccountShell } from '@/components/layout/account-shell';

export default function AccountPage() {
  return (
    <AccountShell title="Account overview" description="Profile, default address, and loyalty surfaces will connect here after auth integration.">
      <div className="grid gap-4 sm:grid-cols-3">
        {['Profile', 'Addresses', 'Seller access'].map((item) => (
          <div key={item} className="rounded-md border border-border bg-background p-4">
            <h2 className="font-black">{item}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ready for authenticated account data.</p>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
