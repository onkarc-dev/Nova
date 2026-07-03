import { OrderDetailPageContent } from '@/components/commerce/order-detail-page';
import { AccountShell } from '@/components/layout/account-shell';

export default async function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AccountShell title="Order detail" description="View item-level order information from Nova.">
      <OrderDetailPageContent orderId={id} />
    </AccountShell>
  );
}
