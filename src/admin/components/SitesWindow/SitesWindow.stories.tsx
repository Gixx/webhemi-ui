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
  { id: 10, host: 'admin.example.test', siteId: 1 },
  { id: 11, host: 'www.example.test', siteId: 1 },
  { id: 12, host: 'blog.example.test', siteId: 2 },
  { id: 13, host: 'unused.example.test', siteId: null },
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
          'Sites list with New/Edit opening a General + Hosts tabbed form dialog. Hosts assignment is props-driven until the Hosts API slice.',
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
    await expect(canvas.getByRole('tab', { name: /general/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(canvas.getByRole('tab', { name: /hosts/i }));
    await expect(canvas.getByLabelText(/unused\.example\.test/i)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /add/i })).toBeDisabled();
  },
};

export const EditSiteDialog: Story = {
  args: { sites: SAMPLE_SITES, hosts: SAMPLE_HOSTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /main site/i }));
    await userEvent.click(canvas.getByRole('button', { name: /^edit$/i }));
    await expect(
      canvas.getByText('Main site Properties', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await expect(canvas.getByLabelText(/name/i)).toHaveValue('Main site');
    await expect(canvas.getByLabelText(/slug/i)).toHaveValue('main');
    await userEvent.click(canvas.getByRole('tab', { name: /hosts/i }));
    await expect(canvas.getByLabelText(/^admin\.example\.test$/i)).toBeChecked();
    await expect(canvas.getByLabelText(/^www\.example\.test$/i)).toBeChecked();
    await expect(canvas.getByLabelText(/blog\.example\.test/i)).not.toBeChecked();
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

export const SelectionEnablesEditDelete: Story = {
  args: { sites: SAMPLE_SITES },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole('button', { name: /^edit$/i });
    const del = canvas.getByRole('button', { name: /^delete$/i });
    await expect(edit).toBeDisabled();
    await expect(del).toBeDisabled();

    await userEvent.click(canvas.getByRole('row', { name: /main site/i }));
    await expect(edit).toBeEnabled();
    await expect(del).toBeEnabled();

    await userEvent.click(del);
    await expect(args.onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, slug: 'main' }),
    );
  },
};
