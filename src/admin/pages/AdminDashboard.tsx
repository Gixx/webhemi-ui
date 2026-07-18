import { AdminLayout } from '../components/AdminLayout/AdminLayout';
import { Alert } from '../../shared/components/Alert/Alert';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { FlashList, type FlashMap } from '../components/FlashList/FlashList';
import type { NavItem } from '../components/Sidebar/Sidebar';

export type AdminDashboardProps = {
  userLabel?: string;
  navItems?: NavItem[];
  siteCount?: number;
  hostCount?: number;
  flashes?: FlashMap;
};

export function AdminDashboard({
  userLabel,
  navItems,
  siteCount = 0,
  hostCount = 0,
  flashes,
}: AdminDashboardProps) {
  return (
    <AdminLayout navItems={navItems || []} userLabel={userLabel} topBarTitle="Dashboard">
      <FlashList flashes={flashes} />
      <PageHeader
        title="Dashboard"
        description="Multi-tenant control panel powered by @webhemi/ui."
      />
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Alert tone="info" title="Sites">
          {siteCount} configured
        </Alert>
        <Alert tone="info" title="Hosts">
          {hostCount} configured
        </Alert>
      </div>
    </AdminLayout>
  );
}
