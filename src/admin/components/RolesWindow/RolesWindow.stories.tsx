import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within, waitFor } from 'storybook/test';
import { RolesWindow, type RolesWindowRole } from './RolesWindow';
import type { RoleFormPermissionOption } from './RoleFormDialog';

const SAMPLE_PERMISSIONS: RoleFormPermissionOption[] = [
  { id: 1, name: 'content.edit', label: 'Edit content' },
  { id: 2, name: 'content.publish', label: 'Publish content' },
];

const SAMPLE_ROLES: RolesWindowRole[] = [
  {
    id: 1,
    name: 'ROLE_ADMIN',
    label: 'Administrator',
    description: 'Full platform access.',
    protected: true,
    permissionIds: [],
    permissionCount: 0,
  },
  {
    id: 2,
    name: 'ROLE_SITE_ADMIN',
    label: 'Site Administrator',
    description: 'Administer assigned sites.',
    protected: true,
    permissionIds: [],
    permissionCount: 0,
  },
  {
    id: 3,
    name: 'ROLE_AUTHOR',
    label: 'Author',
    description: 'Edit and publish content.',
    protected: false,
    permissionIds: [1],
    permissionCount: 1,
  },
];

const meta = {
  title: 'Admin/Components/RolesWindow',
  component: RolesWindow,
  parameters: {
    layout: 'centered',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Roles list with New/Edit opening General + Permissions tabs. Permissions tab uses an assigned table with Assign dropdown and Remove (like Sites → Hosts). Admin and Site Admin are protected.',
      },
    },
  },
  args: {
    onClose: fn(),
    onCancel: fn(),
    onMinimize: fn(),
    onMaximize: fn(),
    onActivate: fn(),
    onSave: fn(),
    onDelete: fn(),
    onAddPermission: fn(),
    onAlertClose: fn(),
    canEdit: true,
    roles: SAMPLE_ROLES,
    permissions: SAMPLE_PERMISSIONS,
    tableMinHeight: 180,
  },
} satisfies Meta<typeof RolesWindow>;

export default meta;
type Story = StoryObj<typeof RolesWindow>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { roles: [] },
};

export const Loading: Story = {
  args: { roles: [], loading: true },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    roles: SAMPLE_ROLES,
    error: 'Could not load roles. Try again.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvasElement.querySelector('.message-dialog')).not.toBeNull();
    });
    await expect(canvas.getByText('Error', { selector: '.title-bar-text' })).toBeVisible();
  },
};

export const ProtectedDeleteDisabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await canvas.findByRole('table', { name: 'Roles' });
    await userEvent.click(within(table).getByText('ROLE_ADMIN'));
    await expect(canvas.getByRole('button', { name: /^edit$/i })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: /^delete$/i })).toBeDisabled();
  },
};

export const OpenNew: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await waitFor(() => {
      expect(canvasElement.querySelector('.role-form-dialog')).not.toBeNull();
    });
    const dialog = canvasElement.querySelector('.role-form-dialog') as HTMLElement;
    await expect(
      within(dialog).getByText('New Role', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await userEvent.click(within(dialog).getByRole('tab', { name: /^permissions$/i }));
    await expect(within(dialog).getByText('No permissions assigned.')).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: /^assign$/i })).toBeDisabled();
  },
};

export const AssignPermissionInForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(within(canvas.getByRole('table', { name: 'Roles' })).getByText('ROLE_AUTHOR'));
    await userEvent.click(canvas.getByRole('button', { name: /^edit$/i }));
    await waitFor(() => {
      expect(canvasElement.querySelector('.role-form-dialog')).not.toBeNull();
    });
    const dialog = canvasElement.querySelector('.role-form-dialog') as HTMLElement;
    await userEvent.click(within(dialog).getByRole('tab', { name: /^permissions$/i }));
    const table = await within(dialog).findByRole('table', {
      name: 'Assigned permissions',
    });
    await expect(within(table).getByText('content.edit')).toBeVisible();

    await userEvent.selectOptions(within(dialog).getByLabelText(/^assign:$/i), '2');
    await userEvent.click(within(dialog).getByRole('button', { name: /^assign$/i }));
    await expect(within(table).getByText('content.publish')).toBeVisible();
  },
};
