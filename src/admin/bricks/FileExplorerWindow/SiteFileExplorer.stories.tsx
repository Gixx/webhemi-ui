import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { buildDemoSiteExplorerTree } from './FileExplorerWindow.data';
import { SiteFileExplorer } from './SiteFileExplorer';

const DEMO_SITE = { id: 1, name: 'Example Site' };
const DEMO_TREE = buildDemoSiteExplorerTree(DEMO_SITE);

const meta = {
  title: 'Admin/Bricks/SiteFileExplorer',
  component: SiteFileExplorer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Stateful site explorer host: navigation, menubar, and local forest edits (Delete → Recycle Bin, Undo).',
      },
    },
  },
  args: {
    title: DEMO_SITE.name,
    titleIcon: 'site' as const,
    tree: DEMO_TREE,
    width: 640,
    paneHeight: 360,
  },
} satisfies Meta<typeof SiteFileExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DeleteToRecycleBin: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );

    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeDisabled();

    await userEvent.click(content.getByText('Contact'));
    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }));
    await expect(content.queryByText('Contact')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await userEvent.click(canvas.getByText('Recycle Bin'));
    const trashContent = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );
    await expect(trashContent.getByText('Contact')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeDisabled();

    await userEvent.click(canvas.getByRole('link', { name: /Example Site/ }));
    const restored = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );
    await expect(restored.getByText('Contact')).toBeVisible();
  },
};
