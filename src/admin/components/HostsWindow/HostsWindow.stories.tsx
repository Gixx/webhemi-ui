import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { HostsWindow, type HostsWindowHost } from './HostsWindow';
import type { HostFormSiteOption } from './HostFormDialog';

const SAMPLE_SITES: HostFormSiteOption[] = [
  { id: 1, name: 'Main site', slug: 'main' },
  { id: 2, name: 'Blog', slug: 'blog' },
];

const SAMPLE_HOSTS: HostsWindowHost[] = [
  {
    id: 10,
    host: 'admin.example.test',
    siteId: 1,
    siteSlug: 'main',
    siteName: 'Main site',
    surface: 'admin',
    status: 'active',
    active: true,
  },
  {
    id: 11,
    host: 'www.example.test',
    siteId: 1,
    siteSlug: 'main',
    siteName: 'Main site',
    surface: 'site',
    status: 'verified',
    active: true,
  },
  {
    id: 12,
    host: 'blog.example.test',
    siteId: 2,
    siteSlug: 'blog',
    siteName: 'Blog',
    surface: 'site',
    status: 'pending',
    active: true,
  },
];

const meta = {
  title: 'Admin/Components/HostsWindow',
  component: HostsWindow,
  parameters: {
    layout: 'centered',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Hosts list with New/Edit opening a hostname + site + surface form dialog.',
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
    canEdit: true,
    hosts: SAMPLE_HOSTS,
    sites: SAMPLE_SITES,
    tableMinHeight: 180,
  },
} satisfies Meta<typeof HostsWindow>;

export default meta;
type Story = StoryObj<typeof HostsWindow>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { hosts: [] },
};

export const Loading: Story = {
  args: { hosts: [], loading: true },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    hosts: SAMPLE_HOSTS,
    error: 'Could not load hosts. Try again.',
  },
};

export const ReadOnly: Story = {
  args: { canEdit: false, onSave: undefined, onDelete: undefined },
};

export const NewHostDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await expect(canvas.getByText('New Host', { selector: '.title-bar-text' })).toBeVisible();
    await expect(canvas.getByLabelText(/^host:$/i)).toBeVisible();
    await expect(canvas.getByLabelText(/^site:$/i)).toBeVisible();
  },
};

export const CreateValidation: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    const hostInput = canvas.getByLabelText(/^host:$/i);
    await userEvent.clear(hostInput);
    await userEvent.click(canvas.getByRole('button', { name: /^ok$/i }));
    await expect(canvas.getByText('Error', { selector: '.title-bar-text' })).toBeVisible();
    await expect(canvas.getByText('Hostname is required.')).toBeInTheDocument();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const CreateSubmit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await userEvent.type(canvas.getByLabelText(/^host:$/i), 'docs.example.test');
    await userEvent.selectOptions(canvas.getByLabelText(/^site:$/i), '2');
    await userEvent.click(canvas.getByRole('button', { name: /^ok$/i }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'new',
        host: 'docs.example.test',
        siteId: 2,
        surface: 'site',
        active: true,
      }),
    );
  },
};
