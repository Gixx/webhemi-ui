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
  isExplorerLocation,
  type ExplorerItem,
  type ExplorerView,
} from './types';

type StoryArgs = WindowBrickShellArgs & {
  view: ExplorerView;
  width: number;
  paneHeight: number;
  onLevelUp: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onOpen: (item: ExplorerItem) => void;
};

function ExplorerDemo(args: StoryArgs) {
  const [view, setView] = useState<ExplorerView>(args.view);
  /** Which folder/root drives the content listing. */
  const [locationId, setLocationId] = useState<string>(EXPLORER_FIXTURE_SITE.id);
  /** Highlighted item in the content pane (independent of location). */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const location = useMemo(
    () => findExplorerItem(EXPLORER_FIXTURE_TREE, locationId),
    [locationId],
  );
  const selected = useMemo(
    () => findExplorerItem(EXPLORER_FIXTURE_TREE, selectedId),
    [selectedId],
  );
  const items = useMemo(() => explorerContentItems(location), [location]);
  const hiddenCount = items.filter((item) => item.hidden).length;
  const statusItem = selected ?? location;

  return (
    <FileExplorerWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      title={args.title}
      titleIcon={args.titleIcon === 'none' ? undefined : args.titleIcon}
      width={args.width}
      paneHeight={args.paneHeight}
      tree={EXPLORER_FIXTURE_TREE}
      items={items}
      view={view}
      onViewChange={setView}
      selectedId={selectedId}
      onTreeSelect={(item) => {
        if (item.disabled || !isExplorerLocation(item)) {
          return;
        }
        setLocationId(item.id);
        setSelectedId(null);
      }}
      onSelect={(item) => {
        setSelectedId(item.id);
      }}
      onOpen={(item) => {
        if (isExplorerLocation(item)) {
          setLocationId(item.id);
          setSelectedId(null);
        }
        args.onOpen(item);
      }}
      onLevelUp={args.onLevelUp}
      onCut={args.onCut}
      onCopy={args.onCopy}
      onPaste={args.onPaste}
      onUndo={args.onUndo}
      onDelete={args.onDelete}
      onProperties={args.onProperties}
      statusBar={
        <StatusBar>
          <StatusBarField>
            {items.length} object(s)
            {hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
          </StatusBarField>
          <StatusBarField className="description">{statusItem?.typeLabel ?? ''}</StatusBarField>
          <StatusBarField />
        </StatusBar>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const location = useMemo(() => findExplorerItem(tree, locationId), [tree, locationId]);
  const items = useMemo(() => explorerContentItems(location), [location]);

  return (
    <FileExplorerWindow
      title={title}
      titleIcon="site"
      tree={tree}
      items={items}
      view={view}
      onViewChange={setView}
      selectedId={selectedId}
      onTreeSelect={(item) => {
        if (item.disabled || !isExplorerLocation(item)) return;
        setLocationId(item.id);
        setSelectedId(null);
      }}
      onSelect={(item) => setSelectedId(item.id)}
      onOpen={(item) => {
        if (isExplorerLocation(item)) {
          setLocationId(item.id);
          setSelectedId(null);
        }
      }}
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
          'Site-management explorer: nav tree, media library, recycle bin, settings. Title uses the site name; title-bar icon is the site glyph (favicon later). Tree navigates location; content single-click selects, double-click opens. Keep `locationId` (listing) separate from `selectedId` (highlight).',
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
    onLevelUp: fn(),
    onCut: fn(),
    onCopy: fn(),
    onPaste: fn(),
    onUndo: fn(),
    onDelete: fn(),
    onProperties: fn(),
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
