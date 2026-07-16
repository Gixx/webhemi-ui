import { AdminLayout } from '../AdminLayout/AdminLayout';
import { Button } from '../Button/Button';
import { FormField } from '../FormField/FormField';
import { Input } from '../Input/Input';
import { SiteListView, type SiteRow } from '../views/SiteListView';
import { FlashList, type FlashMap } from '../FlashList/FlashList';
import type { NavItem } from '../Sidebar/Sidebar';

export type SitesPageProps = {
  userLabel?: string;
  navItems?: NavItem[];
  sites?: SiteRow[];
  canEdit?: boolean;
  createAction?: string;
  flashes?: FlashMap;
};

export function SitesPage({
  userLabel,
  navItems,
  sites,
  canEdit,
  createAction,
  flashes,
}: SitesPageProps) {
  return (
    <AdminLayout navItems={navItems || []} userLabel={userLabel} topBarTitle="Sites">
      <FlashList flashes={flashes} />
      <SiteListView sites={sites || []} createHref="#create-site" />
      {canEdit ? (
        <form id="create-site" action={createAction} method="post" style={{ marginTop: '2rem' }}>
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" required />
          </FormField>
          <FormField label="Slug" htmlFor="slug" required hint="Lowercase identifier">
            <Input id="slug" name="slug" required />
          </FormField>
          <Button type="submit">Create site</Button>
        </form>
      ) : null}
    </AdminLayout>
  );
}
