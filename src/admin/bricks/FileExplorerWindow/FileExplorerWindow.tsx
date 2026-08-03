import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { FieldBorder } from '../../chrome/FieldBorder';
import { TreeToggle, TreeView } from '../../chrome/TreeView';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';
import { ExplorerContent } from './ExplorerContent';
import { endExplorerDrag, readExplorerDragIds } from './explorerDnd';
import { ExplorerMenuBar } from './ExplorerMenuBar';
import { ExplorerSplitter } from './ExplorerSplitter';
import { ExplorerToolbar } from './ExplorerToolbar';
import {
  explorerTreeChildren,
  findExplorerAncestorIds,
  findExplorerItem,
  isExplorerLocation,
  isExplorerTreeExpandable,
  type ExplorerItem,
  type ExplorerView,
} from './types';
import type { DragEvent as ReactDragEvent } from 'react';

const DEFAULT_TREE_WIDTH = 200;
const MIN_TREE_WIDTH = 120;
const MAX_TREE_WIDTH = 480;

export type FileExplorerWindowProps = Omit<PaneWindowShellProps, 'children' | 'onSelect'> & {
  /** Forest of root nodes (site, media library, trash, settings, …). */
  tree: ExplorerItem[];
  /** Content-pane listing for the current location (parent-owned). */
  items: ExplorerItem[];
  view?: ExplorerView;
  onViewChange?: (view: ExplorerView) => void;
  /**
   * Current content location (tree highlight + ancestor auto-expand).
   * Keep separate from `selectedId` (content-pane highlight).
   */
  locationId?: string | null;
  /** Highlighted items in the content pane (multi-select). */
  selectedIds?: string[];
  /** Ghost cut clipboard items in the content pane. */
  cutItemIds?: string[];
  /** Tree navigation (changes location / listing). */
  onTreeSelect?: (item: ExplorerItem) => void;
  /** Content-pane click selection (supports Ctrl/Cmd/Shift modifiers). */
  onSelect?: (
    item: ExplorerItem,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  /** Content-pane double-click open. */
  onOpen?: (item: ExplorerItem) => void;
  /** Drop dragged content ids onto a location (content folder or tree node). */
  onItemsDrop?: (itemIds: string[], targetId: string) => void;
  onLevelUp?: () => void;
  /** When true, Up is disabled (forest root / no parent). */
  levelUpDisabled?: boolean;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;
  onProperties?: () => void;
  /** File menu / title-bar Close. */
  onClose?: () => void;
  onNewFolder?: () => void;
  onNewPage?: () => void;
  onRename?: () => void;
  onSelectAll?: () => void;
  onRefresh?: () => void;
  statusBarVisible?: boolean;
  onStatusBarToggle?: () => void;
  onAbout?: () => void;
  /** Total pane height (toolbar + split). */
  paneHeight?: number | string;
  /** Tree pane width in px (splitter when numeric). */
  treeWidth?: number;
  onTreeWidthChange?: (width: number) => void;
  minTreeWidth?: number;
  maxTreeWidth?: number;
  /** Drag/keyboard resize between tree and content. Default true. */
  treePaneResizable?: boolean;
};

function treeGlyphKind(node: ExplorerItem, expanded: boolean): ExplorerItem['kind'] {
  if ((node.kind === 'folder' || node.role === 'folder') && expanded) {
    return 'folder-open';
  }
  return node.kind;
}

function TreeNodeLabel({
  node,
  expanded = false,
}: {
  node: ExplorerItem;
  expanded?: boolean;
}) {
  return (
    <span className={cn('explorer-tree-node', node.disabled && 'is-disabled')}>
      <span className={cn('explorer-glyph', treeGlyphKind(node, expanded))} aria-hidden />
      <span className="tree-view-label">{node.label}</span>
    </span>
  );
}

function readDraggedIds(event: ReactDragEvent): string[] {
  return readExplorerDragIds(event);
}

function TreeDropLink({
  node,
  isCurrent,
  onTreeSelect,
  onItemsDrop,
  children,
}: {
  node: ExplorerItem;
  isCurrent: boolean;
  onTreeSelect?: (item: ExplorerItem) => void;
  onItemsDrop?: (itemIds: string[], targetId: string) => void;
  children: ReactNode;
}) {
  const droppable = Boolean(onItemsDrop) && isExplorerLocation(node) && !node.disabled;
  const [dragOver, setDragOver] = useState(false);

  return (
    <a
      href="#"
      aria-current={isCurrent ? 'true' : undefined}
      className={cn(droppable && dragOver && 'is-drag-over')}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onTreeSelect?.(node);
      }}
      onDragEnter={
        droppable
          ? (event) => {
              event.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={
        droppable
          ? () => {
              setDragOver(false);
            }
          : undefined
      }
      onDragOver={
        droppable
          ? (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }
          : undefined
      }
      onDrop={
        droppable
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragOver(false);
              const ids = readDraggedIds(event).filter((id) => id !== node.id);
              endExplorerDrag();
              if (ids.length > 0) {
                onItemsDrop?.(ids, node.id);
              }
            }
          : undefined
      }
    >
      {children}
    </a>
  );
}

function ExplorerTreeBranch({
  node,
  locationId,
  ancestorIds,
  onTreeSelect,
  onItemsDrop,
}: {
  node: ExplorerItem;
  locationId?: string | null;
  ancestorIds: Set<string>;
  onTreeSelect?: (item: ExplorerItem) => void;
  onItemsDrop?: (itemIds: string[], targetId: string) => void;
}) {
  const kids = explorerTreeChildren(node);
  const [open, setOpen] = useState(node.role === 'site' || ancestorIds.has(node.id));

  useEffect(() => {
    if (ancestorIds.has(node.id)) {
      setOpen(true);
    }
  }, [ancestorIds, node.id]);

  const isCurrent = locationId === node.id;

  return (
    <li>
      <details open={open}>
        <summary
          tabIndex={-1}
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          <TreeToggle
            expanded={open}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((value) => !value);
            }}
          />
          {node.disabled ? (
            <span className="explorer-tree-leaf is-disabled" aria-disabled="true">
              <TreeNodeLabel node={node} expanded={open} />
            </span>
          ) : (
            <TreeDropLink
              node={node}
              isCurrent={isCurrent}
              onTreeSelect={onTreeSelect}
              onItemsDrop={onItemsDrop}
            >
              <TreeNodeLabel node={node} expanded={open} />
            </TreeDropLink>
          )}
        </summary>
        <ul>{renderTreeNodes(kids, locationId, ancestorIds, onTreeSelect, onItemsDrop)}</ul>
      </details>
    </li>
  );
}

function renderTreeNodes(
  nodes: ExplorerItem[],
  locationId: string | null | undefined,
  ancestorIds: Set<string>,
  onTreeSelect?: (item: ExplorerItem) => void,
  onItemsDrop?: (itemIds: string[], targetId: string) => void,
): ReactNode {
  return nodes.map((node) => {
    const canExpand = isExplorerTreeExpandable(node);
    const isCurrent = locationId === node.id;

    if (canExpand) {
      return (
        <ExplorerTreeBranch
          key={node.id}
          node={node}
          locationId={locationId}
          ancestorIds={ancestorIds}
          onTreeSelect={onTreeSelect}
          onItemsDrop={onItemsDrop}
        />
      );
    }

    return (
      <li key={node.id} className={cn(node.disabled && 'is-disabled')}>
        {node.disabled ? (
          <span className="explorer-tree-leaf is-disabled" aria-disabled="true">
            <TreeNodeLabel node={node} />
          </span>
        ) : (
          <TreeDropLink
            node={node}
            isCurrent={isCurrent}
            onTreeSelect={onTreeSelect}
            onItemsDrop={onItemsDrop}
          >
            <TreeNodeLabel node={node} />
          </TreeDropLink>
        )}
      </li>
    );
  });
}

/**
 * File explorer product brick: toolbar + tree | content (large-icons / list / details).
 * Site-management window — not an IconPanelWindow variant.
 */
export function FileExplorerWindow({
  tree,
  items,
  view = 'large-icons',
  onViewChange,
  locationId = null,
  selectedIds = [],
  cutItemIds = [],
  onTreeSelect,
  onSelect,
  onOpen,
  onItemsDrop,
  onLevelUp,
  levelUpDisabled = false,
  onCut,
  onCopy,
  onPaste,
  onUndo,
  onDelete,
  onProperties,
  onClose,
  onNewFolder,
  onNewPage,
  onRename,
  onSelectAll,
  onRefresh,
  statusBarVisible = true,
  onStatusBarToggle,
  onAbout,
  className,
  paneHeight = 360,
  treeWidth = DEFAULT_TREE_WIDTH,
  onTreeWidthChange,
  minTreeWidth = MIN_TREE_WIDTH,
  maxTreeWidth = MAX_TREE_WIDTH,
  treePaneResizable = true,
  resizable = true,
  ...shell
}: FileExplorerWindowProps) {
  const [uncontrolledTreeWidth, setUncontrolledTreeWidth] = useState(treeWidth);
  const isTreeWidthControlled = onTreeWidthChange !== undefined;
  const resolvedTreeWidth = isTreeWidthControlled ? treeWidth : uncontrolledTreeWidth;

  useEffect(() => {
    if (!isTreeWidthControlled) {
      setUncontrolledTreeWidth(treeWidth);
    }
  }, [treeWidth, isTreeWidthControlled]);

  const setTreeWidth = (width: number) => {
    if (isTreeWidthControlled) {
      onTreeWidthChange(width);
    } else {
      setUncontrolledTreeWidth(width);
    }
  };

  const paneStyle: CSSProperties = {
    height: typeof paneHeight === 'number' ? `${paneHeight}px` : paneHeight,
  };
  const treeStyle: CSSProperties = {
    flexBasis: `${resolvedTreeWidth}px`,
    width: `${resolvedTreeWidth}px`,
  };

  const ancestorIds = useMemo(
    () => new Set(findExplorerAncestorIds(tree, locationId)),
    [tree, locationId],
  );

  const primarySelectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedItem =
    findExplorerItem(tree, primarySelectedId) ??
    items.find((item) => item.id === primarySelectedId) ??
    null;

  return (
    <PaneWindowShell
      className={cn('w-window-xl file-explorer-window', className)}
      resizable={resizable}
      {...shell}
    >
      <div className="window-pane explorer-panel-layout" style={paneStyle}>
        <ExplorerMenuBar
          view={view}
          onViewChange={onViewChange}
          onFileOpen={
            onOpen
              ? () => {
                  if (selectedItem) {
                    onOpen(selectedItem);
                  }
                }
              : undefined
          }
          fileOpenDisabled={!selectedItem}
          onNewFolder={onNewFolder}
          onNewPage={onNewPage}
          onRename={onRename}
          onDelete={onDelete}
          onProperties={onProperties}
          onClose={onClose}
          onUndo={onUndo}
          onCut={onCut}
          onCopy={onCopy}
          onPaste={onPaste}
          onSelectAll={onSelectAll}
          onRefresh={onRefresh}
          statusBarVisible={statusBarVisible}
          onStatusBarToggle={onStatusBarToggle}
          onAbout={onAbout}
        />
        <div className="explorer-chrome-separator" role="separator" />
        <ExplorerToolbar
          view={view}
          onViewChange={onViewChange}
          onLevelUp={onLevelUp}
          levelUpDisabled={levelUpDisabled}
          onCut={onCut}
          onCopy={onCopy}
          onPaste={onPaste}
          onUndo={onUndo}
          onDelete={onDelete}
          onProperties={onProperties}
        />
        <div className="explorer-split">
          <FieldBorder scrollable className="panel explorer-tree" style={treeStyle}>
            <div className="explorer-tree-inner">
              <TreeView>
                {renderTreeNodes(tree, locationId, ancestorIds, onTreeSelect, onItemsDrop)}
              </TreeView>
            </div>
          </FieldBorder>
          {treePaneResizable ? (
            <ExplorerSplitter
              value={resolvedTreeWidth}
              onChange={setTreeWidth}
              min={minTreeWidth}
              max={maxTreeWidth}
            />
          ) : (
            <div className="explorer-splitter is-static" aria-hidden />
          )}
          <FieldBorder scrollable className="panel explorer-content">
            <ExplorerContent
              view={view}
              items={items}
              selectedIds={selectedIds}
              cutItemIds={cutItemIds}
              onSelect={onSelect}
              onOpen={onOpen}
              onItemsDrop={onItemsDrop}
            />
          </FieldBorder>
        </div>
      </div>
    </PaneWindowShell>
  );
}
