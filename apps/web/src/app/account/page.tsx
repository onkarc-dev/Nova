import { AccountDashboard } from '@/components/account/account-dashboard';
import { AccountShell } from '@/components/layout/account-shell';

export default function AccountPage() {
  return (
    <AccountShell title="Account overview" description="Profile and session details are loaded from the authenticated Nova backend APIs.">
      <AccountDashboard />
    </AccountShell>
  );
}
