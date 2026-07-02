import { AccountShell } from '@/components/layout/account-shell';

export default function WishlistPage() {
  return (
    <AccountShell title="Wishlist" description="Saved products will appear here once wishlist APIs are implemented and connected.">
      <div className="rounded-md border border-dashed border-border bg-background p-8 text-center text-sm font-semibold text-muted-foreground">
        Your wishlist shell is ready for product cards.
      </div>
    </AccountShell>
  );
}
