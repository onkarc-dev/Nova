import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthShell } from '@/components/layout/auth-shell';

export default function SignupPage() {
  return (
    <AuthShell title="Create your Nova account." mode="signup">
      <Suspense fallback={<p className="text-sm font-semibold text-muted-foreground">Loading signup...</p>}>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
