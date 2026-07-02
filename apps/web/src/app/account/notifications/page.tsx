import { AccountShell } from '@/components/layout/account-shell';

export default function NotificationsPage() {
  return (
    <AccountShell title="Notifications" description="Order, seller, support, and promotion notifications will be listed here after notification APIs exist.">
      <div className="rounded-md border border-dashed border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground">
        No notifications yet.
      </div>
    </AccountShell>
  );
}
