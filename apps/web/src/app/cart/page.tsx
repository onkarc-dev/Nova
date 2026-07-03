import { CartPage } from '@/components/commerce/cart-page';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export default function CartRoute() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-normal text-accent">Nova buyer cart</p>
        <h1 className="mt-2 text-3xl font-black">Cart</h1>
        <div className="mt-6">
          <CartPage />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
