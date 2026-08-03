import { useMemo, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { StatusBar, StatusBarField } from '../../chrome';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from '../_lib/windowBrickStory';
import {
  EXPLORER_FIXTURE_SITE,
  EXPLORER_FIXTURE_TREE,
} from './FileExplorerWindow.data';
import { FileExplorerWindow } from './FileExplorerWindow';
import {
  explorerContentItems,
  findExplorerItem,
  findExplorerParent,
  isExplorerLocation,
  type ExplorerItem,
  type ExplorerView,
} from './types';

type StoryArgs = WindowBrickShellArgs & {
  view: ExplorerView;
  width: number;
  paneHeight: number;
  treeWidth: number;
  treePaneResizable: boolean;
  minTreeWidth: number;
  maxTreeWidth: number;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onClose: () => void;
  onAbout: () => void;
  onOpen: (item: ExplorerItem) => void;
};

function ExplorerDemo(args: StoryArgs) {
  const [view, setView] = useState<ExplorerView>(args.view);
  /** Which folder/root drives the content listing. */
  const [locationId, setLocationId] = useState<string>(EXPLORER_FIXTURE_SITE.id);
  /** Highlighted item in the content pane (independent of location). */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusBarVisible, setStatusBarVisible] = useState(true);

  const location = useMemo(
    () => findExplorerItem(EXPLORER_FIXTURE_TREE, locationId),
    [locationId],
  );
  const selected = useMemo(() => {
    const id = selectedIds[selectedIds.length - 1];
    return findExplorerItem(EXPLORER_FIXTURE_TREE, id);
  }, [selectedIds]);
  const items = useMemo(() => explorerContentItems(location), [location]);
  const parent = useMemo(
    () => findExplorerParent(EXPLORER_FIXTURE_TREE, locationId),
    [locationId],
  );
  const hiddenCount = items.filter((item) => item.hidden).length;
  const statusItem = selected ?? location;

  const goToLocation = (item: ExplorerItem) => {
    if (item.disabled || !isExplorerLocation(item)) {
      return;
    }
    setLocationId(item.id);
    setSelectedIds([]);
  };

  return (
    <FileExplorerWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      title={args.title}
      titleIcon={args.titleIcon === 'none' ? undefined : args.titleIcon}
      width={args.width}
      paneHeight={args.paneHeight}
      treeWidth={args.treeWidth}
      treePaneResizable={args.treePaneResizable}
      minTreeWidth={args.minTreeWidth}
      maxTreeWidth={args.maxTreeWidth}
      tree={EXPLORER_FIXTURE_TREE}
      items={items}
      view={view}
      onViewChange={setView}
      locationId={locationId}
      selectedIds={selectedIds}
      onTreeSelect={goToLocation}
      onSelect={(item) => {
        setSelectedIds([item.id]);
      }}
      onOpen={(item) => {
        goToLocation(item);
        args.onOpen(item);
      }}
      onLevelUp={() => {
        if (!parent) {
          return;
        }
        setLocationId(parent.id);
        setSelectedIds([]);
      }}
      levelUpDisabled={!parent}
      onCut={args.onCut}
      onCopy={args.onCopy}
      onPaste={args.onPaste}
      onUndo={args.onUndo}
      onDelete={args.onDelete}
      onProperties={args.onProperties}
      onClose={args.onClose}
      onAbout={args.onAbout}
      statusBarVisible={statusBarVisible}
      onStatusBarToggle={() => setStatusBarVisible((value) => !value)}
      statusBar={
        statusBarVisible ? (
          <StatusBar>
            <StatusBarField>
              {items.length} object(s)
              {hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
            </StatusBarField>
            <StatusBarField className="description">{statusItem?.typeLabel ?? ''}</StatusBarField>
            <StatusBarField />
          </StatusBar>
        ) : undefined
      }
    />
  );
}

/** Docs “Show code” — copy-pasteable usage (not the story wrapper). */
const DOCS_SOURCE = `import { useMemo, useState } from 'react';
import {
  FileExplorerWindow,
  explorerContentItems,
  findExplorerItem,
  findExplorerParent,
  isExplorerLocation,
  type ExplorerItem,
  type ExplorerView,
} from '@webhemi/ui';

function SiteExplorer({
  title,
  tree,
}: {
  title: string;
  tree: ExplorerItem[];
}) {
  const [view, setView] = useState<ExplorerView>('large-icons');
  const [locationId, setLocationId] = useState(tree[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const location = useMemo(() => findExplorerItem(tree, locationId), [tree, locationId]);
  const parent = useMemo(() => findExplorerParent(tree, locationId), [tree, locationId]);
  const items = useMemo(() => explorerContentItems(location), [location]);

  const goToLocation = (item: ExplorerItem) => {
    if (item.disabled || !isExplorerLocation(item)) return;
    setLocationId(item.id);
    setSelectedIds([]);
  };

  return (
    <FileExplorerWindow
      title={title}
      titleIcon="site"
      tree={tree}
      items={items}
      view={view}
      onViewChange={setView}
      locationId={locationId}
      selectedIds={selectedIds}
      onTreeSelect={goToLocation}
      onSelect={(item) => setSelectedIds([item.id])}
      onOpen={goToLocation}
      onLevelUp={() => {
        if (!parent) return;
        setLocationId(parent.id);
        setSelectedIds([]);
      }}
      levelUpDisabled={!parent}
      onClose={() => {}}
      paneHeight={360}
      width={640}
    />
  );
}`;

const meta = {
  title: 'Admin/Bricks/FileExplorerWindow',
  // Docs primary component (story render still uses ExplorerDemo for stateful fixtures).
  component: FileExplorerWindow as unknown as ComponentType<StoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Site-management explorer: File/Edit/View/Help menubar, toolbar, nav tree, media library, recycle bin, settings. Tree navigates location; content click selects (Ctrl/Cmd toggle, Shift range). Keep `locationId` separate from `selectedIds`.',
      },
      source: {
        language: 'tsx',
        code: DOCS_SOURCE,
      },
    },
  },
  args: {
    ...windowBrickShellArgs,
    title: EXPLORER_FIXTURE_SITE.name,
    titleIcon: EXPLORER_FIXTURE_SITE.titleIcon,
    titleBarControls: ['Minimize', 'Maximize', 'Close'],
    resizable: true,
    view: 'large-icons',
    width: 640,
    paneHeight: 360,
    treeWidth: 200,
    treePaneResizable: true,
    minTreeWidth: 120,
    maxTreeWidth: 480,
    onCut: fn(),
    onCopy: fn(),
    onPaste: fn(),
    onUndo: fn(),
    onDelete: fn(),
    onProperties: fn(),
    onClose: fn(),
    onAbout: fn(),
    onOpen: fn(),
  },
  argTypes: {
    ...windowBrickShellArgTypes,
    view: {
      control: 'inline-radio',
      options: ['large-icons', 'list', 'details'],
    },
    width: { control: { type: 'number', min: 400, max: 1200, step: 10 } },
    paneHeight: { control: { type: 'number', min: 200, max: 800, step: 10 } },
    treeWidth: { control: { type: 'number', min: 80, max: 600, step: 8 } },
    treePaneResizable: { control: 'boolean' },
    minTreeWidth: { control: { type: 'number', min: 80, max: 400, step: 8 } },
    maxTreeWidth: { control: { type: 'number', min: 200, max: 800, step: 8 } },
  },
  render: (args) => <ExplorerDemo key={args.view} {...args} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LargeIcons: Story = {
  args: { view: 'large-icons' },
};

export const List: Story = {
  args: { view: 'list' },
};

export const Details: Story = {
  args: { view: 'details' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'List' }));
    await expect(canvas.getByRole('button', { name: 'List' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }));
    await expect(canvas.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await userEvent.click(canvas.getByText('Media library'));
    await expect(canvas.getByText('hero.jpg')).toBeVisible();
  },
};

export const Navigation: Story = {
  args: { view: 'large-icons' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );
    const up = canvas.getByRole('button', { name: 'Up one level' });

    await expect(up).toBeDisabled();

    await userEvent.dblClick(content.getByText('About'));
    await expect(content.getByText('Team')).toBeVisible();
    await expect(canvas.getByRole('link', { name: /About/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(up).toBeEnabled();

    await userEvent.click(up);
    await expect(content.getByText('About')).toBeVisible();
    await expect(canvas.getByRole('link', { name: /Acme Website/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(up).toBeDisabled();
  },
};

export const MenuBar: Story = {
  args: { view: 'large-icons' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const content = within(
      canvasElement.querySelector('.explorer-content') as HTMLElement,
    );

    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    await expect(canvas.getByRole('menuitem', { name: 'New Folder' })).toBeDisabled();
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toBeDisabled();
    await expect(canvas.getByRole('menuitem', { name: 'Close' })).toBeEnabled();

    await userEvent.click(canvas.getByRole('menuitem', { name: 'Close' }));
    await expect(args.onClose).toHaveBeenCalled();

    await userEvent.click(content.getByText('About'));
    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toBeEnabled();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('menuitem', { name: 'View' }));
    await userEvent.click(canvas.getByRole('menuitemradio', { name: /Details/ }));
    await expect(canvas.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(canvas.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  },
};

export const Splitter: Story = {
  args: { view: 'large-icons' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const splitter = canvas.getByRole('separator', { name: 'Resize tree pane' });
    const tree = canvasElement.querySelector('.explorer-tree') as HTMLElement;

    await expect(splitter).toHaveAttribute('aria-valuenow', '200');
    await expect(tree.style.width).toBe('200px');

    splitter.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(splitter).toHaveAttribute('aria-valuenow', '208');
    await expect(tree.style.width).toBe('208px');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(splitter).toHaveAttribute('aria-valuenow', '192');
    await expect(tree.style.width).toBe('192px');
  },
};

export const SplitterDisabled: Story = {
  args: { view: 'large-icons', treePaneResizable: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('separator', { name: 'Resize tree pane' }),
    ).not.toBeInTheDocument();
  },
};
