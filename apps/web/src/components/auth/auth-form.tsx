'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, error, status } = useAuth();
  const [formError, setFormError] = React.useState<string | null>(null);
  const isLogin = mode === 'login';
  const isSubmitting = status === 'loading';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          firstName: String(data.get('firstName') ?? '').trim(),
          lastName: String(data.get('lastName') ?? '').trim(),
          phone: optionalString(data.get('phone')),
        });
      }

      router.push(searchParams.get('next') ?? '/account');
      router.refresh();
    } catch {
      setFormError('Please check your details and try again.');
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input
          name="email"
          className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      {!isLogin && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              First name
              <input
                name="firstName"
                className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus"
                placeholder="Aarav"
                autoComplete="given-name"
                minLength={2}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Last name
              <input
                name="lastName"
                className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus"
                placeholder="Sharma"
                autoComplete="family-name"
                minLength={2}
                required
              />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Phone
            <input
              name="phone"
              className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus"
              placeholder="+919876543210"
              autoComplete="tel"
              pattern="^\\+?[0-9]{10,15}$"
            />
          </label>
        </>
      )}
      <label className="mt-4 grid gap-2 text-sm font-semibold">
        Password
        <input
          name="password"
          className="h-11 rounded-md border border-border px-3 outline-none focus:shadow-focus"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={8}
          required
        />
      </label>
      {(formError || error) && (
        <p className="mt-4 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-semibold text-foreground">
          {error ?? formError}
        </p>
      )}
      <Button className="mt-6 w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait' : isLogin ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim();
  return text ? text : undefined;
}
