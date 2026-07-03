import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthShell } from '@/components/layout/auth-shell';

export default function LoginPage() {
  return (
    <AuthShell title="Sign in to continue shopping." mode="login">
      <Suspense fallback={<p className="text-sm font-semibold text-muted-foreground">Loading sign in...</p>}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
