import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within, waitFor } from 'storybook/test';
import {
  PermissionsWindow,
  type PermissionsWindowPermission,
} from './PermissionsWindow';

const SAMPLE_PERMISSIONS: PermissionsWindowPermission[] = [
  {
    id: 1,
    name: 'content.edit',
    label: 'Edit content',
    description: 'Allows editing site content.',
  },
  {
    id: 2,
    name: 'content.publish',
    label: 'Publish content',
    description: '',
  },
];

const meta = {
  title: 'Admin/Components/PermissionsWindow',
  component: PermissionsWindow,
  parameters: {
    layout: 'centered',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Permissions list with New/Edit opening a Name / Label / Description form. Catalog may be empty at seed.',
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
    onAlertClose: fn(),
    canEdit: true,
    permissions: SAMPLE_PERMISSIONS,
    tableMinHeight: 180,
  },
} satisfies Meta<typeof PermissionsWindow>;

export default meta;
type Story = StoryObj<typeof PermissionsWindow>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { permissions: [] },
};

export const Loading: Story = {
  args: { permissions: [], loading: true },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    permissions: SAMPLE_PERMISSIONS,
    error: 'Could not load permissions. Try again.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvasElement.querySelector('.message-dialog')).not.toBeNull();
    });
    await expect(canvas.getByText('Error', { selector: '.title-bar-text' })).toBeVisible();
    await expect(
      within(canvasElement.querySelector('.message-dialog') as HTMLElement).getByText(
        'Could not load permissions. Try again.',
      ),
    ).toBeVisible();
  },
};

export const OpenNew: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await waitFor(() => {
      expect(canvasElement.querySelector('.permission-form-dialog')).not.toBeNull();
    });
    await expect(
      within(canvasElement.querySelector('.permission-form-dialog') as HTMLElement).getByText(
        'New Permission',
        { selector: '.title-bar-text' },
      ),
    ).toBeVisible();
  },
};

export const PreferSelectedId: Story = {
  args: {
    preferSelectedId: 2,
  },
  play: async ({ canvasElement }) => {
    const table = await within(canvasElement).findByRole('table', { name: 'Permissions' });
    await waitFor(() => {
      const row = within(table).getByText('content.publish').closest('tr');
      expect(row).toHaveClass('highlighted');
    });
  },
};
