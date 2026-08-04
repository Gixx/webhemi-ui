import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { SitesWindow, type SitesWindowSite } from './SitesWindow';
import type { SiteFormHostOption } from './SiteFormDialog';

const SAMPLE_SITES: SitesWindowSite[] = [
  { id: 1, name: 'Main site', slug: 'main', enabled: true, hostCount: 2 },
  { id: 2, name: 'Blog', slug: 'blog', enabled: true, hostCount: 1 },
  { id: 3, name: 'Archive', slug: 'archive', enabled: false, hostCount: 0 },
];

const SAMPLE_HOSTS: SiteFormHostOption[] = [
  { id: 10, host: 'admin.example.test', siteId: 1, siteName: 'Main site', status: 'active' },
  { id: 11, host: 'www.example.test', siteId: 1, siteName: 'Main site', status: 'pending' },
  { id: 12, host: 'blog.example.test', siteId: 2, siteName: 'Blog', status: 'active' },
  { id: 13, host: 'unused.example.test', siteId: null, status: 'verified' },
];

const meta = {
  title: 'Admin/Components/SitesWindow',
  component: SitesWindow,
  parameters: {
    layout: 'centered',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Sites list with New/Edit opening a General + Hosts tabbed form. Hosts tab lists hosts assigned to the site (Name / Status) with Add… and Remove (unassign).',
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
    onUnassignHost: fn(),
    canEdit: true,
    sites: SAMPLE_SITES,
    hosts: SAMPLE_HOSTS,
    tableMinHeight: 180,
  },
} satisfies Meta<typeof SitesWindow>;

export default meta;
type Story = StoryObj<typeof SitesWindow>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { sites: [] },
};

export const Loading: Story = {
  args: { sites: [], loading: true },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    sites: SAMPLE_SITES,
    error: 'Could not load sites. Try again.',
  },
};

export const ReadOnly: Story = {
  args: { canEdit: false, onSave: undefined, onDelete: undefined },
};

export const NewSiteDialog: Story = {
  args: { sites: SAMPLE_SITES, hosts: SAMPLE_HOSTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await expect(canvas.getByText('New Site', { selector: '.title-bar-text' })).toBeVisible();
    await userEvent.click(canvas.getByRole('tab', { name: /hosts/i }));
    await expect(canvas.getByText(/no hosts until this site is saved/i)).toBeVisible();
    await expect(canvas.getByRole('button', { name: /add/i })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: /^remove$/i })).toBeDisabled();
  },
};

export const EditSiteHostsTab: Story = {
  args: { sites: SAMPLE_SITES, hosts: SAMPLE_HOSTS },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /main site/i }));
    await userEvent.click(canvas.getByRole('button', { name: /^edit$/i }));
    await userEvent.click(canvas.getByRole('tab', { name: /hosts/i }));

    const table = canvas.getByRole('table', { name: 'Assigned hosts' });
    await expect(within(table).getByText('admin.example.test')).toBeVisible();
    await expect(within(table).getByText('www.example.test')).toBeVisible();
    await expect(within(table).queryByText('blog.example.test')).toBeNull();
    await expect(within(table).getByText('active')).toBeVisible();
    await expect(within(table).getByText('pending')).toBeVisible();

    await expect(canvas.getByRole('button', { name: /^remove$/i })).toBeDisabled();
    await userEvent.click(within(table).getByText('admin.example.test'));
    await expect(canvas.getByRole('button', { name: /^remove$/i })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: /^remove$/i }));
    await expect(args.onUnassignHost).toHaveBeenCalledWith(10);
  },
};

export const DoubleClickOpensEdit: Story = {
  args: { sites: SAMPLE_SITES, hosts: SAMPLE_HOSTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('row', { name: /blog/i }));
    await expect(
      canvas.getByText('Blog Properties', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await expect(canvas.getByLabelText(/name/i)).toHaveValue('Blog');
    await expect(canvas.getByLabelText(/slug/i)).toHaveValue('blog');
  },
};

export const CreateValidation: Story = {
  args: { sites: SAMPLE_SITES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await userEvent.click(canvas.getByRole('button', { name: /^ok$/i }));
    await expect(canvas.getByText('Error', { selector: '.title-bar-text' })).toBeVisible();
    await expect(canvas.getByText('Name is required.')).toBeInTheDocument();
    await expect(canvas.getByText('Slug is required.')).toBeInTheDocument();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

export const CreateSubmit: Story = {
  args: { sites: SAMPLE_SITES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^new$/i }));
    await userEvent.type(canvas.getByLabelText(/name/i), 'Docs');
    await userEvent.type(canvas.getByLabelText(/slug/i), 'docs');
    await userEvent.click(canvas.getByRole('button', { name: /^ok$/i }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'new',
        name: 'Docs',
        slug: 'docs',
        enabled: true,
      }),
    );
  },
};
