import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { buildDemoSiteExplorerTree } from '../bricks/FileExplorerWindow';
import { AdminDesktop } from './AdminDesktop';

const SAMPLE_SITES = [
  { id: 1, name: 'Example Site', slug: 'example', enabled: true },
  { id: 2, name: 'Docs', slug: 'docs', enabled: true },
];

/** Docs: fixed-height teal canvas; Canvas keeps fullscreen body desktop. */
const withDocsDesktopFrame: Decorator = (Story, context) => {
  if (context.viewMode !== 'docs') {
    return <Story />;
  }
  return (
    <div className="sb-admin-desktop-docs">
      <Story />
    </div>
  );
};

const meta = {
  title: 'Admin/Components/AdminDesktop',
  component: AdminDesktop,
  decorators: [withDocsDesktopFrame],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { value: 'desktop' },
    docs: {
      description: {
        component:
          'Admin desktop surface: site icons + Control Panel, shell windows with drag/active title-bars, and a taskbar (minimize / restore).',
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

export const ActiveInactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Example Site' }));

    const controlPanel = canvasElement.querySelector('#control-panel') as HTMLElement;
    const siteWindow = canvasElement.querySelector('#site-1') as HTMLElement;
    await expect(controlPanel).toBeTruthy();
    await expect(siteWindow).toBeTruthy();
    await expect(controlPanel).toHaveAttribute('data-shell-window', 'control-panel');
    await expect(siteWindow).toHaveAttribute('data-shell-window', 'site-1');

    const siteTitleBar = siteWindow.querySelector('.title-bar') as HTMLElement;
    const cpTitleBar = controlPanel.querySelector('.title-bar') as HTMLElement;
    await expect(siteTitleBar).not.toHaveClass('inactive');
    await expect(cpTitleBar).toHaveClass('inactive');

    await userEvent.click(cpTitleBar);
    await expect(cpTitleBar).not.toHaveClass('inactive');
    await expect(siteTitleBar).toHaveClass('inactive');
  },
};

export const TitleBarDrag: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));

    const host = canvasElement.querySelector('#control-panel') as HTMLElement;
    const titleBar = host.querySelector('.title-bar') as HTMLElement;
    const startLeft = host.offsetLeft;
    const startTop = host.offsetTop;

    fireEvent.pointerDown(titleBar, {
      button: 0,
      clientX: 120,
      clientY: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(window, {
      clientX: 220,
      clientY: 120,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(window, {
      clientX: 220,
      clientY: 120,
      pointerId: 1,
      pointerType: 'mouse',
    });

    await expect(host.offsetLeft).toBeGreaterThan(startLeft);
    await expect(host.offsetTop).toBeGreaterThan(startTop);
  },
};

export const TaskbarMinimize: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));

    const host = canvasElement.querySelector('#control-panel') as HTMLElement;
    const task = canvas.getByRole('button', { name: 'Control Panel', pressed: true });
    await expect(host).not.toHaveClass('is-minimized');
    await expect(task).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Minimize' }));
    await expect(host).toHaveClass('is-minimized');
    await expect(task).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(task);
    await expect(host).not.toHaveClass('is-minimized');
    await expect(task).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(task);
    await expect(host).toHaveClass('is-minimized');
  },
};
