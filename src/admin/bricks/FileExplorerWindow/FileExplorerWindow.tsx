import type { CSSProperties, ReactNode } from 'react';
import { FieldBorder } from '../../chrome/FieldBorder';
import { TreeView } from '../../chrome/TreeView';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';
import { ExplorerContent } from './ExplorerContent';
import { ExplorerToolbar } from './ExplorerToolbar';
import {
  explorerTreeChildren,
  isExplorerTreeExpandable,
  type ExplorerItem,
  type ExplorerView,
} from './types';

export type FileExplorerWindowProps = Omit<PaneWindowShellProps, 'children' | 'onSelect'> & {
  /** Forest of root nodes (site, media library, trash, settings, …). */
  tree: ExplorerItem[];
  /** Content-pane listing for the current location (parent-owned). */
  items: ExplorerItem[];
  view?: ExplorerView;
  onViewChange?: (view: ExplorerView) => void;
  /** Highlighted item in the content pane. */
  selectedId?: string | null;
  /** Tree navigation (changes location / listing). */
  onTreeSelect?: (item: ExplorerItem) => void;
  /** Content-pane single-click selection (highlight only). */
  onSelect?: (item: ExplorerItem) => void;
  /** Content-pane double-click open. */
  onOpen?: (item: ExplorerItem) => void;
  onLevelUp?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;
  onProperties?: () => void;
  /** Total pane height (toolbar + split). */
  paneHeight?: number | string;
  treeWidth?: number | string;
};

function treeGlyphKind(node: ExplorerItem, expandableKids: boolean): ExplorerItem['kind'] {
  if ((node.kind === 'folder' || node.role === 'folder') && expandableKids) {
    return 'folder-open';
  }
  return node.kind;
}

function renderTreeNodes(
  nodes: ExplorerItem[],
  onTreeSelect?: (item: ExplorerItem) => void,
): ReactNode {
  return nodes.map((node) => {
    const kids = explorerTreeChildren(node);
    const canExpand = isExplorerTreeExpandable(node);
    const label = (
      <span className={cn('explorer-tree-node', node.disabled && 'is-disabled')}>
        <span className={cn('explorer-glyph', treeGlyphKind(node, kids.length > 0))} aria-hidden />
        {' '}
        {node.label}
      </span>
    );

    if (canExpand) {
      return (
        <li key={node.id}>
          <details open={node.role === 'site'}>
            <summary
              onClick={() => {
                if (!node.disabled) {
                  onTreeSelect?.(node);
                }
              }}
            >
              {label}
            </summary>
            <ul>{renderTreeNodes(kids, onTreeSelect)}</ul>
          </details>
        </li>
      );
    }

    return (
      <li key={node.id} className={cn(node.disabled && 'is-disabled')}>
        {node.disabled ? (
          <span className="explorer-tree-leaf is-disabled" aria-disabled="true">
            {label}
          </span>
        ) : (
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onTreeSelect?.(node);
            }}
          >
            {label}
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
  selectedId = null,
  onTreeSelect,
  onSelect,
  onOpen,
  onLevelUp,
  onCut,
  onCopy,
  onPaste,
  onUndo,
  onDelete,
  onProperties,
  className,
  paneHeight = 360,
  treeWidth = 200,
  resizable = true,
  ...shell
}: FileExplorerWindowProps) {
  const paneStyle: CSSProperties = {
    height: typeof paneHeight === 'number' ? `${paneHeight}px` : paneHeight,
  };
  const treeStyle: CSSProperties = {
    flexBasis: typeof treeWidth === 'number' ? `${treeWidth}px` : treeWidth,
    width: typeof treeWidth === 'number' ? `${treeWidth}px` : treeWidth,
  };

  return (
    <PaneWindowShell
      className={cn('w-window-xl file-explorer-window', className)}
      resizable={resizable}
      {...shell}
    >
      <div className="window-pane explorer-panel-layout" style={paneStyle}>
        <ExplorerToolbar
          view={view}
          onViewChange={onViewChange}
          onLevelUp={onLevelUp}
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
              <TreeView>{renderTreeNodes(tree, onTreeSelect)}</TreeView>
            </div>
          </FieldBorder>
          <FieldBorder scrollable className="panel explorer-content">
            <ExplorerContent
              view={view}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              onOpen={onOpen}
            />
          </FieldBorder>
        </div>
      </div>
    </PaneWindowShell>
  );
}
