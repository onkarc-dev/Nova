import Link from 'next/link';
import { Bell, CreditCard, Heart, LayoutDashboard, Package } from 'lucide-react';
import { AuthGate } from '@/components/auth/auth-gate';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

const navItems = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/payment-methods', label: 'Payments', icon: CreditCard },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
];

export function AccountShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-md border border-border bg-white p-3">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted">
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-h-[460px] rounded-md border border-border bg-white p-6">
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Customer account</p>
          <h1 className="mt-2 text-3xl font-black">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-6">
            <AuthGate>{children}</AuthGate>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
