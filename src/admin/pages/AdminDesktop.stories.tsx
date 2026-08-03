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
          'Admin desktop shell: drag, resize, maximize, taskbar, Start menu, and localStorage persistence.',
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
    logoutHref: '/logout',
    // Isolation for interaction tests (product default key is enabled in app).
    persistenceKey: false as const,
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

export const StartMenuControlPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menuButton = canvas.getByRole('button', { name: 'Menu' });

    await expect(canvasElement.querySelector('#start-menu')).toHaveAttribute('hidden');
    await userEvent.click(menuButton);
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(canvasElement.querySelector('#start-menu')).not.toHaveAttribute('hidden');

    await expect(canvas.getByRole('menuitem', { name: 'Uploads' })).toBeDisabled();
    await expect(canvas.getByRole('menuitem', { name: 'Logout' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('menuitem', { name: 'Control Panel' }));
    await expect(canvasElement.querySelector('#start-menu')).toHaveAttribute('hidden');
    await expect(
      canvas.getByText('Control Panel', { selector: '.title-bar-text' }),
    ).toBeVisible();
  },
};

export const MaximizeRestore: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));

    const host = canvasElement.querySelector('#control-panel') as HTMLElement;
    await expect(host).not.toHaveClass('is-maximized');
    await expect(host.querySelectorAll('.window-resize-handle')).toHaveLength(5);

    await userEvent.click(canvas.getByRole('button', { name: 'Maximize' }));
    await expect(host).toHaveClass('is-maximized');
    await expect(host.querySelectorAll('.window-resize-handle')).toHaveLength(0);
    await expect(canvas.getByRole('button', { name: 'Restore' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Restore' }));
    await expect(host).not.toHaveClass('is-maximized');
    await expect(host.querySelectorAll('.window-resize-handle')).toHaveLength(5);
  },
};

export const ResizeHandle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));

    const host = canvasElement.querySelector('#control-panel') as HTMLElement;
    const handle = host.querySelector('.window-resize-handle[data-edge="se"]') as HTMLElement;
    const startWidth = host.offsetWidth;
    const startHeight = host.offsetHeight;

    fireEvent.pointerDown(handle, {
      button: 0,
      clientX: startWidth,
      clientY: startHeight,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(window, {
      clientX: startWidth + 80,
      clientY: startHeight + 60,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(window, {
      clientX: startWidth + 80,
      clientY: startHeight + 60,
      pointerId: 1,
      pointerType: 'mouse',
    });

    await expect(host.offsetWidth).toBeGreaterThan(startWidth);
    await expect(host.offsetHeight).toBeGreaterThan(startHeight);
  },
};

const PERSISTENCE_STORY_KEY = 'webhemi.admin.desktop.windows.storybook';

export const Persistence: Story = {
  args: {
    persistenceKey: PERSISTENCE_STORY_KEY,
  },
  play: async ({ canvasElement }) => {
    localStorage.removeItem(PERSISTENCE_STORY_KEY);
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));

    const host = canvasElement.querySelector('#control-panel') as HTMLElement;
    const titleBar = host.querySelector('.title-bar') as HTMLElement;
    const startLeft = host.offsetLeft;

    fireEvent.pointerDown(titleBar, {
      button: 0,
      clientX: 120,
      clientY: 40,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(window, {
      clientX: 220,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(window, {
      clientX: 220,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
    });

    await expect(host.offsetLeft).toBeGreaterThan(startLeft);

    await new Promise((resolve) => {
      window.setTimeout(resolve, 250);
    });

    const raw = localStorage.getItem(PERSISTENCE_STORY_KEY);
    await expect(raw).toBeTruthy();
    const data = JSON.parse(raw!) as {
      entries: Record<string, { left: number; closed: boolean }>;
    };
    await expect(data.entries['control-panel']).toBeTruthy();
    await expect(data.entries['control-panel'].closed).toBe(false);
    await expect(data.entries['control-panel'].left).toBe(host.offsetLeft);

    localStorage.removeItem(PERSISTENCE_STORY_KEY);
  },
};
