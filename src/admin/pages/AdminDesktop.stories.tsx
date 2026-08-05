import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { buildDemoSiteExplorerTree } from '../bricks/FileExplorerWindow';
import type { AdminApiClient, AdminApiHost, AdminApiSite } from '../api';
import { AdminDesktop } from './AdminDesktop';

const SAMPLE_SITES = [
  { id: 1, name: 'Example Site', slug: 'example', enabled: true },
  { id: 2, name: 'Docs', slug: 'docs', enabled: true },
];

const SAMPLE_API_SITES: AdminApiSite[] = [
  { id: 1, name: 'Example Site', slug: 'example', enabled: true, hostCount: 2 },
  { id: 2, name: 'Docs', slug: 'docs', enabled: true, hostCount: 1 },
];

const SAMPLE_API_HOSTS: AdminApiHost[] = [
  {
    id: 10,
    host: 'admin.example.test',
    siteId: 1,
    siteSlug: 'example',
    siteName: 'Example Site',
    surface: 'admin',
    status: 'active',
    active: true,
  },
  {
    id: 11,
    host: 'www.example.test',
    siteId: 1,
    siteSlug: 'example',
    siteName: 'Example Site',
    surface: 'site',
    status: 'verified',
    active: true,
  },
];

function createMockAdminApi(
  initialSites: AdminApiSite[],
  initialHosts: AdminApiHost[] = [],
): AdminApiClient {
  let siteRows = [...initialSites];
  let hostRows = [...initialHosts];
  return {
    listSites: async () => ({ ok: true, status: 200, data: [...siteRows] }),
    createSite: async (body) => {
      const created: AdminApiSite = {
        id: Math.max(0, ...siteRows.map((row) => row.id)) + 1,
        name: body.name,
        slug: body.slug,
        enabled: body.enabled ?? true,
        hostCount: 0,
      };
      siteRows = [...siteRows, created];
      return { ok: true, status: 201, data: created };
    },
    listHosts: async () => ({ ok: true, status: 200, data: [...hostRows] }),
    createHost: async (body) => {
      const site =
        body.siteId != null
          ? siteRows.find((row) => row.id === body.siteId)
          : undefined;
      const created: AdminApiHost = {
        id: Math.max(0, ...hostRows.map((row) => row.id)) + 1,
        host: body.host,
        siteId: site?.id ?? null,
        siteSlug: site?.slug ?? null,
        siteName: site?.name ?? null,
        surface: body.surface ?? 'site',
        status: 'pending',
        active: body.active ?? true,
      };
      hostRows = [...hostRows, created];
      if (site) {
        siteRows = siteRows.map((row) =>
          row.id === site.id ? { ...row, hostCount: row.hostCount + 1 } : row,
        );
      }
      return { ok: true, status: 201, data: created };
    },
    updateHost: async (id, body) => {
      const existing = hostRows.find((row) => row.id === id);
      if (!existing) {
        return {
          ok: false,
          status: 404,
          error: { code: 'not_found', message: 'Host not found.' },
        };
      }
      const site =
        body.siteId === undefined
          ? undefined
          : body.siteId == null
            ? null
            : siteRows.find((row) => row.id === body.siteId);
      const updated: AdminApiHost = {
        ...existing,
        host: body.host ?? existing.host,
        surface: body.surface ?? existing.surface,
        active: body.active ?? existing.active,
        siteId: site === undefined ? existing.siteId : site?.id ?? null,
        siteSlug: site === undefined ? existing.siteSlug : site?.slug ?? null,
        siteName: site === undefined ? existing.siteName : site?.name ?? null,
        status:
          site === null && existing.status === 'active'
            ? 'verified'
            : site && existing.status === 'verified'
              ? 'active'
              : existing.status,
      };
      hostRows = hostRows.map((row) => (row.id === id ? updated : row));
      return { ok: true, status: 200, data: updated };
    },
    unassignHost: async (id) => {
      const existing = hostRows.find((row) => row.id === id);
      if (!existing) {
        return {
          ok: false,
          status: 404,
          error: { code: 'not_found', message: 'Host not found.' },
        };
      }
      const updated: AdminApiHost = {
        ...existing,
        siteId: null,
        siteSlug: null,
        siteName: null,
        status: existing.status === 'active' ? 'verified' : existing.status,
      };
      hostRows = hostRows.map((row) => (row.id === id ? updated : row));
      return { ok: true, status: 200, data: updated };
    },
    verifyHost: async (id) => {
      const existing = hostRows.find((row) => row.id === id);
      if (!existing) {
        return {
          ok: false,
          status: 404,
          error: { code: 'not_found', message: 'Host not found.' },
        };
      }
      if (existing.status !== 'pending') {
        return {
          ok: false,
          status: 422,
          error: {
            code: 'not_pending',
            message: 'Only pending hosts can be verified.',
          },
        };
      }
      const updated: AdminApiHost = { ...existing, status: 'verified' };
      hostRows = hostRows.map((row) => (row.id === id ? updated : row));
      return { ok: true, status: 200, data: updated };
    },
  };
}
function stylePx(element: HTMLElement, prop: 'left' | 'top' | 'width' | 'height'): number {
  return Number.parseFloat(element.style[prop] || '0');
}

/** Realistic pointer drag — works in Vitest browser and Chromatic. */
async function pointerDrag(
  target: Element,
  from: { clientX: number; clientY: number },
  to: { clientX: number; clientY: number },
) {
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target, coords: from },
    { coords: to },
    { keys: '[/MouseLeft]' },
  ]);
}
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

export const OpenSitesWindow: Story = {
  args: {
    sitesApi: createMockAdminApi(SAMPLE_API_SITES, SAMPLE_API_HOSTS),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Sites' }));

    const sitesHost = canvasElement.querySelector('#sites') as HTMLElement;
    await expect(sitesHost).toBeTruthy();
    await expect(sitesHost).toHaveAttribute('data-shell-window', 'sites');
    await expect(
      within(sitesHost).getByText('Sites', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await expect(within(sitesHost).getByRole('button', { name: /^new$/i })).toBeEnabled();

    const table = await within(sitesHost).findByRole('table', { name: 'Sites' });
    await expect(within(table).getByText('Example Site')).toBeVisible();
    await expect(within(table).getByText('Docs')).toBeVisible();
  },
};

export const OpenHostsWindow: Story = {
  args: {
    sitesApi: createMockAdminApi(SAMPLE_API_SITES, SAMPLE_API_HOSTS),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Hosts' }));

    const hostsHost = canvasElement.querySelector('#hosts') as HTMLElement;
    await expect(hostsHost).toBeTruthy();
    await expect(hostsHost).toHaveAttribute('data-shell-window', 'hosts');
    await expect(
      within(hostsHost).getByText('Hosts', { selector: '.title-bar-text' }),
    ).toBeVisible();
    await expect(within(hostsHost).getByRole('button', { name: /^new$/i })).toBeEnabled();

    const table = await within(hostsHost).findByRole('table', { name: 'Hosts' });
    await expect(within(table).getByText('admin.example.test')).toBeVisible();
    await expect(within(table).getByText('www.example.test')).toBeVisible();
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
    const startLeft = stylePx(host, 'left');
    const startTop = stylePx(host, 'top');

    await pointerDrag(titleBar, { clientX: 120, clientY: 40 }, { clientX: 220, clientY: 120 });

    await expect(stylePx(host, 'left')).toBeGreaterThan(startLeft);
    await expect(stylePx(host, 'top')).toBeGreaterThan(startTop);
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
    const startWidth = stylePx(host, 'width') || host.offsetWidth;
    const startHeight = stylePx(host, 'height') || host.offsetHeight;

    await pointerDrag(
      handle,
      { clientX: startWidth, clientY: startHeight },
      { clientX: startWidth + 80, clientY: startHeight + 60 },
    );

    await expect(stylePx(host, 'width') || host.offsetWidth).toBeGreaterThan(startWidth);
    await expect(stylePx(host, 'height') || host.offsetHeight).toBeGreaterThan(startHeight);
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
    const startLeft = stylePx(host, 'left');

    await pointerDrag(titleBar, { clientX: 120, clientY: 40 }, { clientX: 220, clientY: 100 });

    await expect(stylePx(host, 'left')).toBeGreaterThan(startLeft);

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
    await expect(data.entries['control-panel'].left).toBe(stylePx(host, 'left'));

    localStorage.removeItem(PERSISTENCE_STORY_KEY);
  },
};
