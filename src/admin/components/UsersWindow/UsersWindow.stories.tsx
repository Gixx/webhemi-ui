import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { UsersWindow, type UsersWindowUser } from './UsersWindow';
import type { UserFormRoleOption, UserFormSiteOption } from './UserFormDialog';

const SAMPLE_ROLES: UserFormRoleOption[] = [
  { id: 1, name: 'ROLE_ADMIN', label: 'Administrator' },
  { id: 2, name: 'ROLE_SITE_ADMIN', label: 'Site Administrator' },
  { id: 3, name: 'ROLE_AUTHOR', label: 'Author' },
];

const SAMPLE_SITES: UserFormSiteOption[] = [
  { id: 1, name: 'Example Site' },
  { id: 2, name: 'Docs' },
];

const SAMPLE_USERS: UsersWindowUser[] = [
  {
    id: 1,
    email: 'admin@example.test',
    roleIds: [1],
    roles: [{ id: 1, name: 'ROLE_ADMIN', label: 'Administrator' }],
    siteAssignments: [],
    roleCount: 1,
    siteAssignmentCount: 0,
  },
  {
    id: 2,
    email: 'author@example.test',
    roleIds: [3],
    roles: [{ id: 3, name: 'ROLE_AUTHOR', label: 'Author' }],
    siteAssignments: [
      {
        id: 1,
        siteId: 1,
        siteName: 'Example Site',
        roleId: 2,
        roleName: 'ROLE_SITE_ADMIN',
        roleLabel: 'Site Administrator',
      },
    ],
    roleCount: 1,
    siteAssignmentCount: 1,
  },
];

const meta = {
  title: 'Admin/Components/UsersWindow',
  component: UsersWindow,
  parameters: {
    layout: 'centered',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Win9x User Settings layout: User List tab, single-column list, New User / Delete, Set Password and Change Settings fieldset.',
      },
    },
  },
  args: {
    onClose: fn(),
    onCancel: fn(),
    onMinimize: fn(),
    onActivate: fn(),
    onSave: fn(),
    onDelete: fn(),
    onSetPassword: fn(),
    onAddRole: fn(),
    onAlertClose: fn(),
    currentUserId: 1,
    capabilities: {
      listUsers: true,
      viewUser: true,
      createUser: true,
      editUser: true,
      deleteUser: true,
    },
    users: SAMPLE_USERS,
    roles: SAMPLE_ROLES,
    sites: SAMPLE_SITES,
    preferSelectedId: 2,
    tableMinHeight: 140,
  },
} satisfies Meta<typeof UsersWindow>;

export default meta;
type Story = StoryObj<typeof UsersWindow>;

export const Populated: Story = {};

export const SelfOnlyList: Story = {
  name: 'Self-only list',
  args: {
    users: [SAMPLE_USERS[0]],
    preferSelectedId: 1,
    capabilities: {
      listUsers: false,
      viewUser: false,
      createUser: false,
      editUser: false,
      deleteUser: false,
    },
  },
};

export const ViewOnly: Story = {
  name: 'View settings only',
  args: {
    capabilities: {
      listUsers: true,
      viewUser: true,
      createUser: false,
      editUser: false,
      deleteUser: false,
    },
  },
};

export const Empty: Story = {
  args: { users: [], preferSelectedId: null },
};

export const Loading: Story = {
  args: { users: [], loading: true, preferSelectedId: null },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    users: SAMPLE_USERS,
    error: 'Could not load users. Try again.',
  },
};
