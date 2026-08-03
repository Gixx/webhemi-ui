import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { FieldBorder } from '../../chrome/FieldBorder';
import { TreeToggle, TreeView } from '../../chrome/TreeView';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';
import { ExplorerContent } from './ExplorerContent';
import { ExplorerMenuBar } from './ExplorerMenuBar';
import { ExplorerSplitter } from './ExplorerSplitter';
import { ExplorerToolbar } from './ExplorerToolbar';
import {
  explorerTreeChildren,
  findExplorerAncestorIds,
  findExplorerItem,
  isExplorerTreeExpandable,
  type ExplorerItem,
  type ExplorerView,
} from './types';

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
  /** Highlighted item in the content pane. */
  selectedId?: string | null;
  /** Ghost the cut clipboard item in the content pane. */
  cutItemId?: string | null;
  /** Tree navigation (changes location / listing). */
  onTreeSelect?: (item: ExplorerItem) => void;
  /** Content-pane single-click selection (highlight only). */
  onSelect?: (item: ExplorerItem) => void;
  /** Content-pane double-click open. */
  onOpen?: (item: ExplorerItem) => void;
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

function ExplorerTreeBranch({
  node,
  locationId,
  ancestorIds,
  onTreeSelect,
}: {
  node: ExplorerItem;
  locationId?: string | null;
  ancestorIds: Set<string>;
  onTreeSelect?: (item: ExplorerItem) => void;
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
            <a
              href="#"
              aria-current={isCurrent ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onTreeSelect?.(node);
              }}
            >
              <TreeNodeLabel node={node} expanded={open} />
            </a>
          )}
        </summary>
        <ul>{renderTreeNodes(kids, locationId, ancestorIds, onTreeSelect)}</ul>
      </details>
    </li>
  );
}

function renderTreeNodes(
  nodes: ExplorerItem[],
  locationId: string | null | undefined,
  ancestorIds: Set<string>,
  onTreeSelect?: (item: ExplorerItem) => void,
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
          <a
            href="#"
            aria-current={isCurrent ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onTreeSelect?.(node);
            }}
          >
            <TreeNodeLabel node={node} />
          </a>
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
  selectedId = null,
  cutItemId = null,
  onTreeSelect,
  onSelect,
  onOpen,
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

  const selectedItem =
    findExplorerItem(tree, selectedId) ?? items.find((item) => item.id === selectedId) ?? null;

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
              <TreeView>{renderTreeNodes(tree, locationId, ancestorIds, onTreeSelect)}</TreeView>
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
              selectedId={selectedId}
              cutItemId={cutItemId}
              onSelect={onSelect}
              onOpen={onOpen}
            />
          </FieldBorder>
        </div>
      </div>
    </PaneWindowShell>
  );
}
