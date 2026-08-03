import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { buildDemoSiteExplorerTree } from '../bricks/FileExplorerWindow';
import { AdminDesktop } from './AdminDesktop';

const SAMPLE_SITES = [
  { id: 1, name: 'Example Site', slug: 'example', enabled: true },
  { id: 2, name: 'Docs', slug: 'docs', enabled: true },
];

const meta = {
  title: 'Admin/Components/AdminDesktop',
  component: AdminDesktop,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Admin desktop surface: site icons + Control Panel. Double-click a site opens FileExplorer; Control Panel opens the icon panel.',
      },
      source: {
        language: 'tsx',
        code: `import { AdminDesktop } from '@webhemi/ui';

<AdminDesktop
  sites={[
    { id: 1, name: 'Example Site', slug: 'example', enabled: true },
  ]}
/>`,
      },
    },
  },
  args: {
    sites: SAMPLE_SITES,
    // Rich fixture in Storybook; product PHP path uses empty roots by default.
    explorerTreeForSite: buildDemoSiteExplorerTree,
  },
} satisfies Meta<typeof AdminDesktop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptySites: Story = {
  args: { sites: [] },
};

export const OpenControlPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));
    await expect(canvas.getByText('Control Panel', { selector: '.title-bar-text' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Sites' })).toBeVisible();
  },
};

export const OpenSiteExplorer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Example Site' }));
    await expect(
      canvas.getByText('Example Site', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await expect(canvas.getByRole('menuitem', { name: 'File' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Up one level' })).toBeDisabled();
    const content = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );
    await expect(content.getByText('About')).toBeVisible();
  },
};
