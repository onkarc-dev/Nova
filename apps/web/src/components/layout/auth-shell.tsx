import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export function AuthShell({
  title,
  mode,
  children,
}: {
  title: string;
  mode: 'login' | 'signup';
  children: React.ReactNode;
}) {
  const isLogin = mode === 'login';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Nova account</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{title}</h1>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            Sign in to manage your marketplace profile, addresses, wishlist, orders, and notifications as Nova account features come online.
          </p>
        </section>
        <div className="rounded-md border border-border bg-white p-6 shadow-sm">
          {children}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? 'New to Nova?' : 'Already have an account?'}{' '}
            <Link className="font-bold text-primary" href={isLogin ? '/signup' : '/login'}>
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
