import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLayout } from '../components/AdminLayout/AdminLayout';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { SiteListView } from './SiteListView';
import { SiteHostListView } from './SiteHostListView';
import { UserListView } from './UserListView';
import { RoleListView } from './RoleListView';
import { Alert } from '../../shared/components/Alert/Alert';

const navItems = [
  { id: 'dash', label: 'Dashboard', href: '#', icon: 'dashboard' as const, active: true },
  { id: 'sites', label: 'Sites', href: '#', icon: 'sites' as const },
  { id: 'hosts', label: 'Hosts', href: '#', icon: 'hosts' as const },
  { id: 'users', label: 'Users', href: '#', icon: 'users' as const },
  { id: 'roles', label: 'Roles', href: '#', icon: 'roles' as const },
];

const meta = {
  title: 'Admin/Views',
  parameters: { globals: { theme: 'admin' } },
} satisfies Meta;

export default meta;

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
    <AdminLayout
      navItems={navItems.map((i) => ({ ...i, active: i.id === 'sites' }))}
      userLabel="admin@webhemi.local"
    >
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
    <AdminLayout
      navItems={navItems.map((i) => ({ ...i, active: i.id === 'hosts' }))}
      userLabel="admin@webhemi.local"
    >
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
    <AdminLayout
      navItems={navItems.map((i) => ({ ...i, active: i.id === 'users' }))}
      userLabel="admin@webhemi.local"
    >
      <UserListView users={[{ id: 1, email: 'admin@webhemi.local', roles: ['ROLE_ADMIN'] }]} />
    </AdminLayout>
  ),
};

export const Roles: StoryObj = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AdminLayout
      navItems={navItems.map((i) => ({ ...i, active: i.id === 'roles' }))}
      userLabel="admin@webhemi.local"
    >
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
