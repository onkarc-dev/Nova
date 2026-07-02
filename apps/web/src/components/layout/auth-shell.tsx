import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export function AuthShell({ title, mode }: { title: string; mode: 'login' | 'signup' }) {
  const isLogin = mode === 'login';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Nova account</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{title}</h1>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            Account screens are ready for API-backed auth, token storage, validation feedback, and session refresh.
          </p>
        </section>
        <form className="rounded-md border border-border bg-white p-6 shadow-sm">
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus" placeholder="you@example.com" />
          </label>
          {!isLogin && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                First name
                <input className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus" placeholder="Aarav" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Last name
                <input className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus" placeholder="Sharma" />
              </label>
            </div>
          )}
          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Password
            <input className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus" type="password" placeholder="••••••••" />
          </label>
          <button className="mt-6 h-11 w-full rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground" type="button">
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? 'New to Nova?' : 'Already have an account?'}{' '}
            <Link className="font-bold text-primary" href={isLogin ? '/signup' : '/login'}>
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
