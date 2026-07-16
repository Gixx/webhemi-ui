import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLayout } from '../AdminLayout/AdminLayout';
import { LoginForm } from '../LoginForm/LoginForm';
import { SiteListView } from './SiteListView';
import { SiteHostListView } from './SiteHostListView';
import { UserListView } from './UserListView';
import { RoleListView } from './RoleListView';
import { Alert } from '../Alert/Alert';
import { Badge } from '../Badge/Badge';
import { FormField } from '../FormField/FormField';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Checkbox } from '../Checkbox/Checkbox';
import { Icon } from '../Icon/Icon';
import { Modal } from '../Modal/Modal';
import { Pagination } from '../Pagination/Pagination';
import { Button } from '../Button/Button';
import { useState } from 'react';

const navItems = [
  { id: 'dash', label: 'Dashboard', href: '#', icon: 'dashboard' as const, active: true },
  { id: 'sites', label: 'Sites', href: '#', icon: 'sites' as const },
  { id: 'hosts', label: 'Hosts', href: '#', icon: 'hosts' as const },
  { id: 'users', label: 'Users', href: '#', icon: 'users' as const },
  { id: 'roles', label: 'Roles', href: '#', icon: 'roles' as const },
];

const meta = {
  title: 'Brand/Introduction',
} satisfies Meta;

export default meta;

export const Tokens: StoryObj = {
  render: () => (
    <div className="wh-ui space-y-4 p-4">
      <h1 className="font-[family-name:var(--wh-font-display)] text-4xl">WebHemi UI</h1>
      <p className="max-w-xl text-[var(--wh-color-muted)]">
        Design system for the dual-engine CMS. Teal accent on cool slate canvas — not purple
        gradients, not cream serif broadsheet.
      </p>
      <div className="flex flex-wrap gap-3">
        {[
          ['Ink', 'var(--wh-color-ink)'],
          ['Canvas', 'var(--wh-color-canvas)'],
          ['Accent', 'var(--wh-color-accent)'],
          ['Hot', 'var(--wh-color-accent-hot)'],
        ].map(([label, color]) => (
          <div key={label} className="w-28">
            <div className="h-16 rounded-[var(--wh-radius-md)] border" style={{ background: color }} />
            <p className="mt-1 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AdminShell: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout navItems={navItems} userLabel="admin@webhemi.local" topBarTitle="Dashboard">
      <Alert tone="info" title="Multi-tenant ready">
        Hosts map to admin, site, and api surfaces.
      </Alert>
    </AdminLayout>
  ),
};

export const Login: StoryObj = {
  render: () => <LoginForm />,
};

export const LoginError: StoryObj = {
  render: () => <LoginForm error="Invalid credentials." />,
};

export const Sites: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout navItems={navItems.map((i) => ({ ...i, active: i.id === 'sites' }))} userLabel="admin@webhemi.local">
      <SiteListView
        sites={[
          { id: 1, slug: 'main', name: 'Main site', enabled: true, hostCount: 2 },
          { id: 2, slug: 'docs', name: 'Docs', enabled: false, hostCount: 1 },
        ]}
      />
    </AdminLayout>
  ),
};

export const Hosts: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout navItems={navItems.map((i) => ({ ...i, active: i.id === 'hosts' }))} userLabel="admin@webhemi.local">
      <SiteHostListView
        hosts={[
          {
            id: 1,
            host: 'admin.webhemi.local',
            siteName: 'Main',
            surface: 'admin',
            status: 'active',
            active: true,
          },
          {
            id: 2,
            host: 'www.webhemi.local',
            siteName: 'Main',
            surface: 'site',
            status: 'pending',
            active: true,
          },
        ]}
      />
    </AdminLayout>
  ),
};

export const Users: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout navItems={navItems.map((i) => ({ ...i, active: i.id === 'users' }))} userLabel="admin@webhemi.local">
      <UserListView
        users={[{ id: 1, email: 'admin@webhemi.local', roles: ['ROLE_ADMIN'] }]}
      />
    </AdminLayout>
  ),
};

export const Roles: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout navItems={navItems.map((i) => ({ ...i, active: i.id === 'roles' }))} userLabel="admin@webhemi.local">
      <RoleListView
        roles={[
          {
            id: 1,
            name: 'Editor',
            permissions: ['site.list', 'site.edit', 'host.verify'],
          },
        ]}
      />
    </AdminLayout>
  ),
};

export const Molecules: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="wh-ui space-y-6 p-4">
        <div className="flex gap-2">
          <Badge tone="success">verified</Badge>
          <Badge tone="warning">pending</Badge>
          <Icon name="sites" className="text-xl text-[var(--wh-color-accent)]" />
        </div>
        <FormField label="Hostname" htmlFor="host" required hint="Hostname only, no scheme.">
          <Input id="host" placeholder="www.example.com" />
        </FormField>
        <FormField label="Surface" htmlFor="surface">
          <Select id="surface" defaultValue="site">
            <option value="admin">admin</option>
            <option value="site">site</option>
            <option value="api">api</option>
          </Select>
        </FormField>
        <Checkbox label="Active" defaultChecked />
        <Pagination page={2} pageCount={5} onPageChange={() => undefined} />
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          title="Confirm"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Confirm</Button>
            </>
          }
        >
          Verify ownership for this host?
        </Modal>
      </div>
    );
  },
};
