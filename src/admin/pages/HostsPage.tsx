import { AdminLayout } from '../components/AdminLayout/AdminLayout';
import { Button } from '../../shared/components/Button/Button';
import { FormField } from '../../shared/components/FormField/FormField';
import { Input } from '../../shared/components/Input/Input';
import { Select } from '../../shared/components/Select/Select';
import { SiteHostListView, type HostRow } from '../views/SiteHostListView';
import { FlashList, type FlashMap } from '../components/FlashList/FlashList';
import type { NavItem } from '../components/Sidebar/Sidebar';

export type SiteOption = {
  id: number;
  name: string;
};

export type HostsPageProps = {
  userLabel?: string;
  navItems?: NavItem[];
  hosts?: HostRow[];
  sites?: SiteOption[];
  canEdit?: boolean;
  createAction?: string;
  flashes?: FlashMap;
};

export function HostsPage({
  userLabel,
  navItems,
  hosts,
  sites,
  canEdit,
  createAction,
  flashes,
}: HostsPageProps) {
  return (
    <AdminLayout navItems={navItems || []} userLabel={userLabel} topBarTitle="Hosts">
      <FlashList flashes={flashes} />
      <SiteHostListView hosts={hosts || []} createHref="#create-host" />
      {canEdit ? (
        <form id="create-host" action={createAction} method="post" style={{ marginTop: '2rem' }}>
          <FormField label="Hostname" htmlFor="host" required>
            <Input id="host" name="host" placeholder="www.example.com" required />
          </FormField>
          <FormField label="Site" htmlFor="site_id" required>
            <Select id="site_id" name="site_id" required>
              {(sites || []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Surface" htmlFor="surface">
            <Select id="surface" name="surface" defaultValue="site">
              <option value="admin">admin</option>
              <option value="site">site</option>
              <option value="api">api</option>
            </Select>
          </FormField>
          <Button type="submit">Add host</Button>
        </form>
      ) : null}
    </AdminLayout>
  );
}
