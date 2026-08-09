import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { MenuPopup, type AdminMenuItem } from '../../chrome/MenuPopup';
import { underlineAccessKey } from '../../chrome/_lib/underlineAccessKey';
import { cn } from '../../../lib/cn';
import type { ExplorerView } from './types';

export type ExplorerMenuBarProps = {
  view: ExplorerView;
  onViewChange?: (view: ExplorerView) => void;
  /** File → Open (selected content item). Disabled when unset / no selection. */
  onFileOpen?: () => void;
  fileOpenDisabled?: boolean;
  onNewFolder?: () => void;
  onNewPage?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onProperties?: () => void;
  onClose?: () => void;
  onUndo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onRefresh?: () => void;
  statusBarVisible?: boolean;
  onStatusBarToggle?: () => void;
  onAbout?: () => void;
  className?: string;
};

type MenuId = 'file' | 'edit' | 'view' | 'help';

function MenuLabel({ text, accessKey }: { text: string; accessKey: string }) {
  return <>{underlineAccessKey(text, accessKey)}</>;
}

function menuGlyph(kind: string): ReactNode {
  return <span className={`menu-popup-glyph ${kind}`} />;
}

function buildMenus(props: ExplorerMenuBarProps): Record<MenuId, AdminMenuItem[]> {
  const {
    view,
    onViewChange,
    onFileOpen,
    fileOpenDisabled = false,
    onNewFolder,
    onNewPage,
    onRename,
    onDelete,
    onProperties,
    onClose,
    onUndo,
    onCut,
    onCopy,
    onPaste,
    onSelectAll,
    onRefresh,
    statusBarVisible = true,
    onStatusBarToggle,
    onAbout,
  } = props;

  return {
    file: [
      {
        kind: 'item',
        id: 'new-folder',
        label: 'New Folder',
        accessKey: 'F',
        disabled: !onNewFolder,
        onSelect: onNewFolder,
      },
      {
        kind: 'item',
        id: 'new-page',
        label: 'New Page',
        accessKey: 'N',
        disabled: !onNewPage,
        onSelect: onNewPage,
      },
      { kind: 'separator', id: 'file-sep-1' },
      {
        kind: 'item',
        id: 'open',
        label: 'Open',
        accessKey: 'O',
        disabled: !onFileOpen || fileOpenDisabled,
        onSelect: onFileOpen,
      },
      {
        kind: 'item',
        id: 'rename',
        label: 'Rename',
        accessKey: 'M',
        disabled: !onRename,
        onSelect: onRename,
      },
      {
        kind: 'item',
        id: 'delete',
        label: 'Delete',
        accessKey: 'D',
        icon: menuGlyph('delete'),
        disabled: !onDelete,
        onSelect: onDelete,
      },
      {
        kind: 'item',
        id: 'properties',
        label: 'Properties',
        accessKey: 'R',
        icon: menuGlyph('properties'),
        disabled: !onProperties,
        onSelect: onProperties,
      },
      { kind: 'separator', id: 'file-sep-2' },
      {
        kind: 'item',
        id: 'close',
        label: 'Close',
        accessKey: 'C',
        disabled: !onClose,
        onSelect: onClose,
      },
    ],
    edit: [
      {
        kind: 'item',
        id: 'undo',
        label: 'Undo',
        accessKey: 'U',
        icon: menuGlyph('undo'),
        disabled: !onUndo,
        onSelect: onUndo,
      },
      { kind: 'separator', id: 'edit-sep-1' },
      {
        kind: 'item',
        id: 'cut',
        label: 'Cut',
        accessKey: 'T',
        icon: menuGlyph('cut'),
        disabled: !onCut,
        onSelect: onCut,
      },
      {
        kind: 'item',
        id: 'copy',
        label: 'Copy',
        accessKey: 'C',
        icon: menuGlyph('copy'),
        disabled: !onCopy,
        onSelect: onCopy,
      },
      {
        kind: 'item',
        id: 'paste',
        label: 'Paste',
        accessKey: 'P',
        icon: menuGlyph('paste'),
        disabled: !onPaste,
        onSelect: onPaste,
      },
      { kind: 'separator', id: 'edit-sep-2' },
      {
        kind: 'item',
        id: 'select-all',
        label: 'Select All',
        accessKey: 'A',
        disabled: !onSelectAll,
        onSelect: onSelectAll,
      },
    ],
    view: [
      {
        kind: 'item',
        id: 'large-icons',
        label: 'Large Icons',
        accessKey: 'G',
        role: 'menuitemradio',
        checked: view === 'large-icons',
        disabled: !onViewChange,
        onSelect: () => onViewChange?.('large-icons'),
      },
      {
        kind: 'item',
        id: 'list',
        label: 'List',
        accessKey: 'L',
        role: 'menuitemradio',
        checked: view === 'list',
        disabled: !onViewChange,
        onSelect: () => onViewChange?.('list'),
      },
      {
        kind: 'item',
        id: 'details',
        label: 'Details',
        accessKey: 'D',
        role: 'menuitemradio',
        checked: view === 'details',
        disabled: !onViewChange,
        onSelect: () => onViewChange?.('details'),
      },
      { kind: 'separator', id: 'view-sep-1' },
      {
        kind: 'item',
        id: 'refresh',
        label: 'Refresh',
        accessKey: 'R',
        disabled: !onRefresh,
        onSelect: onRefresh,
      },
      {
        kind: 'item',
        id: 'status-bar',
        label: 'Status Bar',
        accessKey: 'B',
        role: 'menuitemcheckbox',
        checked: statusBarVisible,
        disabled: !onStatusBarToggle,
        onSelect: onStatusBarToggle,
      },
    ],
    help: [
      {
        kind: 'item',
        id: 'about',
        label: 'About File Explorer…',
        accessKey: 'A',
        disabled: !onAbout,
        onSelect: onAbout,
      },
    ],
  };
}

const TOP_LEVEL: { id: MenuId; label: string; accessKey: string }[] = [
  { id: 'file', label: 'File', accessKey: 'F' },
  { id: 'edit', label: 'Edit', accessKey: 'E' },
  { id: 'view', label: 'View', accessKey: 'V' },
  { id: 'help', label: 'Help', accessKey: 'H' },
];

/**
 * Win98-style window menubar for FileExplorer (above the toolbar).
 * Dropdown panels use shared {@link MenuPopup} (optional icons / check gutter).
 * Not the taskbar Start button — that uses `menu.svg` separately.
 */
export function ExplorerMenuBar(props: ExplorerMenuBarProps) {
  const { className } = props;
  const menus = buildMenus(props);
  const rootRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const baseId = useId();

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>, menuId: MenuId) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const index = TOP_LEVEL.findIndex((entry) => entry.id === menuId);
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = TOP_LEVEL[(index + delta + TOP_LEVEL.length) % TOP_LEVEL.length];
      setOpenMenu(next.id);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('panel explorer-menubar', className)}
      role="menubar"
      aria-label="Explorer"
    >
      {TOP_LEVEL.map((top) => {
        const menuId = `${baseId}-${top.id}`;
        const expanded = openMenu === top.id;
        const items = menus[top.id];

        return (
          <div
            key={top.id}
            className="explorer-menu-root"
            onKeyDown={(event) => onMenuKeyDown(event, top.id)}
            onMouseEnter={() => {
              if (openMenu !== null) {
                setOpenMenu(top.id);
              }
            }}
          >
            <button
              type="button"
              className="explorer-menu-button"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={expanded}
              aria-controls={menuId}
              onClick={() => {
                setOpenMenu((current) => (current === top.id ? null : top.id));
              }}
            >
              <MenuLabel text={top.label} accessKey={top.accessKey} />
            </button>
            {expanded ? (
              <MenuPopup
                id={menuId}
                className="explorer-menu"
                aria-label={top.label}
                items={items}
                onItemActivate={() => setOpenMenu(null)}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
