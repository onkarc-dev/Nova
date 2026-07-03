import { AccountShell } from '@/components/layout/account-shell';
import { OrdersPageContent } from '@/components/commerce/orders-page';

export default function OrdersPage() {
  return (
    <AccountShell title="Orders" description="Review Nova orders created by the buyer commerce flow.">
      <OrdersPageContent />
    </AccountShell>
  );
}
