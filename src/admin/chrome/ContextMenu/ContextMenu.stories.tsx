import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ContextMenu } from './ContextMenu';
import type { AdminMenuItem } from '../MenuPopup';

function glyph(kind: string): ReactNode {
  return <span className={`menu-popup-glyph ${kind}`} />;
}

const COMMAND_ITEMS: AdminMenuItem[] = [
  {
    kind: 'item',
    id: 'cut',
    label: 'Cut',
    accessKey: 't',
    icon: glyph('cut'),
    onSelect: fn(),
  },
  {
    kind: 'item',
    id: 'copy',
    label: 'Copy',
    accessKey: 'c',
    icon: glyph('copy'),
    onSelect: fn(),
  },
  {
    kind: 'item',
    id: 'paste',
    label: 'Paste',
    accessKey: 'p',
    icon: glyph('paste'),
    disabled: true,
    onSelect: fn(),
  },
  { kind: 'separator', id: 'sep-1' },
  {
    kind: 'item',
    id: 'delete',
    label: 'Delete',
    accessKey: 'd',
    icon: glyph('delete'),
    onSelect: fn(),
  },
  {
    kind: 'item',
    id: 'rename',
    label: 'Rename',
    accessKey: 'm',
    // no icon — empty gutter cell
    onSelect: fn(),
  },
  { kind: 'separator', id: 'sep-2' },
  {
    kind: 'item',
    id: 'properties',
    label: 'Properties',
    accessKey: 'r',
    icon: glyph('properties'),
    onSelect: fn(),
  },
];

const CHECKABLE_ITEMS: AdminMenuItem[] = [
  {
    kind: 'item',
    id: 'status-bar',
    label: 'Status Bar',
    accessKey: 'S',
    role: 'menuitemcheckbox',
    checked: true,
    onSelect: fn(),
  },
  { kind: 'separator', id: 'sep-view' },
  {
    kind: 'item',
    id: 'large',
    label: 'Large Icons',
    accessKey: 'L',
    role: 'menuitemradio',
    checked: true,
    onSelect: fn(),
  },
  {
    kind: 'item',
    id: 'list',
    label: 'List',
    accessKey: 'i',
    role: 'menuitemradio',
    checked: false,
    onSelect: fn(),
  },
  {
    kind: 'item',
    id: 'details',
    label: 'Details',
    accessKey: 'D',
    role: 'menuitemradio',
    checked: false,
    onSelect: fn(),
  },
];

const DESKTOP_ITEMS: AdminMenuItem[] = [
  { kind: 'item', id: 'arrange', label: 'Arrange Icons', children: [{ kind: 'item', id: 'by-name', label: 'by Name' }] },
  { kind: 'item', id: 'refresh', label: 'Refresh', accessKey: 'e' },
  { kind: 'separator', id: 'sep-d' },
  { kind: 'item', id: 'paste', label: 'Paste', accessKey: 'P', icon: glyph('paste'), disabled: true },
  { kind: 'separator', id: 'sep-d2' },
  { kind: 'item', id: 'properties', label: 'Properties', accessKey: 'r', icon: glyph('properties') },
];

const SITES_ROW_ITEMS: AdminMenuItem[] = [
  { kind: 'item', id: 'open', label: 'Open', accessKey: 'O' },
  { kind: 'item', id: 'edit', label: 'Edit', accessKey: 'E' },
  { kind: 'separator', id: 'sep-s' },
  { kind: 'item', id: 'delete', label: 'Delete', accessKey: 'D', icon: glyph('delete') },
];

const EXPLORER_FILE_ITEMS: AdminMenuItem[] = [
  { kind: 'item', id: 'open', label: 'Open', accessKey: 'O' },
  { kind: 'separator', id: 'sep-f' },
  { kind: 'item', id: 'cut', label: 'Cut', accessKey: 't', icon: glyph('cut') },
  { kind: 'item', id: 'copy', label: 'Copy', accessKey: 'C', icon: glyph('copy') },
  { kind: 'item', id: 'delete', label: 'Delete', accessKey: 'D', icon: glyph('delete') },
  { kind: 'separator', id: 'sep-f2' },
  { kind: 'item', id: 'properties', label: 'Properties', accessKey: 'r', icon: glyph('properties') },
];

function Host({
  children,
  height = 280,
}: {
  children: ReactNode;
  height?: number;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 360,
        height,
        background: 'teal',
        border: '1px solid #000',
      }}
    >
      {children}
    </div>
  );
}

const meta = {
  title: 'Admin/Atoms/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Win98-style context menu. Command items may show optional 16×16 icons (reserved icon column). Checkable-only menus use a checkmark column and **no** icon column. Product `onContextMenu` wiring is a later slice.',
      },
    },
  },
  args: {
    open: true,
    left: 24,
    top: 24,
    items: COMMAND_ITEMS,
    'aria-label': 'Context',
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommandWithIcons: Story = {
  render: (args) => (
    <Host>
      <ContextMenu {...args} />
    </Host>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('menu', { name: 'Context' });
    await expect(menu).toHaveClass('has-icon-gutter');
    await expect(menu).not.toHaveClass('has-check-gutter');
    await expect(within(menu).getByRole('menuitem', { name: 'Cut' })).toBeVisible();
    await expect(within(menu).getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    await expect(within(menu).getByRole('menuitem', { name: 'Paste' })).toBeDisabled();
  },
};

export const CheckableOnly: Story = {
  args: {
    items: CHECKABLE_ITEMS,
    'aria-label': 'View',
  },
  render: (args) => (
    <Host height={220}>
      <ContextMenu {...args} />
    </Host>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole('menu', { name: 'View' });
    await expect(menu).toHaveClass('has-check-gutter');
    await expect(menu).not.toHaveClass('has-icon-gutter');
    const status = within(menu).getByRole('menuitemcheckbox', { name: 'Status Bar' });
    await expect(status).toHaveAttribute('aria-checked', 'true');
    await expect(within(menu).getByRole('menuitemradio', { name: 'Large Icons' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(menu.querySelector('.menu-popup-icon')).toBeNull();
  },
};

export const NoIcons: Story = {
  args: {
    items: [
      { kind: 'item', id: 'a', label: 'New' },
      { kind: 'item', id: 'b', label: 'Open' },
      { kind: 'separator', id: 's' },
      { kind: 'item', id: 'c', label: 'Close', disabled: true },
    ],
    'aria-label': 'Plain',
  },
  render: (args) => (
    <Host height={160}>
      <ContextMenu {...args} />
    </Host>
  ),
  play: async ({ canvasElement }) => {
    const menu = within(canvasElement).getByRole('menu', { name: 'Plain' });
    await expect(menu).not.toHaveClass('has-icon-gutter');
    await expect(menu).not.toHaveClass('has-check-gutter');
  },
};

export const FixtureDesktop: Story = {
  args: {
    items: DESKTOP_ITEMS,
    'aria-label': 'Desktop',
  },
  render: (args) => (
    <Host>
      <ContextMenu {...args} />
    </Host>
  ),
};

export const FixtureSitesRow: Story = {
  args: {
    items: SITES_ROW_ITEMS,
    'aria-label': 'Site',
  },
  render: (args) => (
    <Host height={180}>
      <ContextMenu {...args} />
    </Host>
  ),
};

export const FixtureExplorerFile: Story = {
  args: {
    items: EXPLORER_FILE_ITEMS,
    'aria-label': 'File',
  },
  render: (args) => (
    <Host>
      <ContextMenu {...args} />
    </Host>
  ),
};

export const OpenOnRightClick: Story = {
  render: function OpenOnRightClickStory() {
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
    return (
      <Host height={240}>
        <button
          type="button"
          style={{ margin: 12 }}
          onContextMenu={(event) => {
            event.preventDefault();
            const host = event.currentTarget.parentElement;
            if (!host) {
              return;
            }
            const rect = host.getBoundingClientRect();
            setPos({
              left: event.clientX - rect.left,
              top: event.clientY - rect.top,
            });
          }}
        >
          Right-click me
        </button>
        {pos ? (
          <ContextMenu
            open
            left={pos.left}
            top={pos.top}
            items={COMMAND_ITEMS}
            aria-label="Demo"
            onItemActivate={() => setPos(null)}
          />
        ) : null}
      </Host>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole('button', { name: /right-click me/i });
    await userEvent.pointer({ keys: '[MouseRight>]', target });
    await userEvent.pointer({ keys: '[/MouseRight]', target });
    // Fallback: dispatch contextmenu if pointer API is picky
    target.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 80, clientY: 80 }),
    );
    const menu = await canvas.findByRole('menu', { name: 'Demo' });
    await expect(menu).toBeVisible();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Copy' }));
    await expect(canvas.queryByRole('menu', { name: 'Demo' })).toBeNull();
  },
};
