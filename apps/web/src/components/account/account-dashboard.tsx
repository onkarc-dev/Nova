'use client';

import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

export function AccountDashboard() {
  const { user, profile, logout, refreshSession } = useAuth();

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-md border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black">
              {profile?.firstName ?? user?.firstName} {profile?.lastName ?? user?.lastName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Nova customer account</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email ?? user?.email ?? 'Not available'} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile?.phone ?? user?.phone ?? 'Not added'} />
          <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Status" value={profile?.status ?? user?.status ?? 'Unknown'} />
          <InfoRow icon={<UserRound className="h-4 w-4" />} label="Roles" value={user?.roles.join(', ') || 'customer'} />
        </div>
      </section>
      <aside className="rounded-md border border-border bg-background p-4">
        <h2 className="font-black">Session</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Nova is using access and refresh tokens returned by the backend. Cookie-backed sessions should replace browser token storage later.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refreshSession()}>
            Refresh session
          </Button>
          <Button type="button" variant="secondary" onClick={() => void logout()}>
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 truncate text-sm font-black">{value}</p>
    </div>
  );
}
