import Link from 'next/link';
import { Bell, Heart, Menu, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

const departments = ['Fashion', 'Mobiles', 'Home', 'Beauty', 'Grocery', 'Appliances', 'Sports'];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Button aria-label="Open departments" size="icon" variant="ghost" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex min-w-fit items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-base font-black text-primary-foreground">
            N
          </span>
          <span className="text-xl font-black">Nova</span>
        </Link>
        <form action="/products" className="hidden min-w-0 flex-1 items-center rounded-md border border-border bg-white px-3 shadow-sm md:flex">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            name="search"
            aria-label="Search products"
            className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none"
            placeholder="Search for products, brands, and stores"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link href="/account/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Notifications">
            <Link href="/account/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Account">
            <Link href="/account">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
        </nav>
      </div>
      <div className="border-t border-border bg-white">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 text-sm font-semibold text-muted-foreground sm:px-6">
          {departments.map((department) => (
            <Link key={department} href={`/products?search=${encodeURIComponent(department)}`} className="min-w-fit rounded-md px-3 py-2 hover:bg-muted">
              {department}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
