import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
        <div className="flex min-h-[360px] flex-col justify-center rounded-md bg-foreground p-6 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Nova marketplace</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
            Fresh deals, trusted sellers, and faster local commerce.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
            A production storefront foundation for regional discovery, clean account flows, and catalog browsing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button>
              Start shopping <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
              Explore stores
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" /> Local delivery ready
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Verified seller track
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-md border border-border bg-[#f2e6d6] p-6">
            <p className="text-sm font-bold text-muted-foreground">Today&apos;s spotlight</p>
            <h2 className="mt-2 text-2xl font-black">Style, home, and essentials in one cart.</h2>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {['Fashion', 'Home', 'Grocery'].map((label) => (
                <div key={label} className="grid aspect-square place-items-center rounded-md bg-white text-xs font-bold shadow-sm">
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-[#d9eef0] p-6">
            <p className="text-sm font-bold text-muted-foreground">Seller network</p>
            <h2 className="mt-2 text-2xl font-black">Storefronts built for Indian regional commerce.</h2>
          </div>
        </div>
      </div>
    </section>
  );
}
