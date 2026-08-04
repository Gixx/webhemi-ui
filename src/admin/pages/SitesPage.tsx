import { AdminLayout } from '../components/AdminLayout/AdminLayout';
import { Button } from '../../shared/components/Button/Button';
import { FormField } from '../../shared/components/FormField/FormField';
import { Input } from '../../shared/components/Input/Input';
import { SiteListView, type SiteRow } from '../views/SiteListView';
import { FlashList, type FlashMap } from '../components/FlashList/FlashList';
import type { NavItem } from '../components/Sidebar/Sidebar';

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
        <form
          id="create-site"
          action={createAction}
          method="post"
          noValidate
          style={{ marginTop: '2rem' }}
        >
          <FormField label="Name" htmlFor="name" required>
            <Input id="name" name="name" />
          </FormField>
          <FormField label="Slug" htmlFor="slug" required hint="Lowercase identifier">
            <Input id="slug" name="slug" />
          </FormField>
          <Button type="submit">Create site</Button>
        </form>
      ) : null}
    </AdminLayout>
  );
}
