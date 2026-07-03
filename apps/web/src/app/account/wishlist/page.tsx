import { AccountShell } from '@/components/layout/account-shell';
import { WishlistPageContent } from '@/components/commerce/wishlist-page';

export default function WishlistPage() {
  return (
    <AccountShell title="Wishlist" description="Save products from the Nova marketplace and return to them from your account.">
      <WishlistPageContent />
    </AccountShell>
  );
}
