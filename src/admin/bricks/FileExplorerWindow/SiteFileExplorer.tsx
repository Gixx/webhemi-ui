import { useMemo, useState } from 'react';
import { StatusBar, StatusBarField, TitleBarControl, TitleBarControls } from '../../chrome';
import {
  canDeleteExplorerItem,
  cloneExplorerForest,
  deleteExplorerItem,
  undoExplorerDelete,
  type ExplorerDeleteUndo,
} from './explorerTreeOps';
import { FileExplorerWindow, type FileExplorerWindowProps } from './FileExplorerWindow';
import {
  explorerContentItems,
  findExplorerItem,
  findExplorerParent,
  isExplorerLocation,
  type ExplorerItem,
  type ExplorerView,
} from './types';

export type SiteFileExplorerProps = Omit<
  FileExplorerWindowProps,
  | 'tree'
  | 'items'
  | 'view'
  | 'onViewChange'
  | 'locationId'
  | 'selectedId'
  | 'onTreeSelect'
  | 'onSelect'
  | 'onOpen'
  | 'onLevelUp'
  | 'levelUpDisabled'
  | 'onDelete'
  | 'onUndo'
  | 'statusBar'
  | 'statusBarVisible'
  | 'onStatusBarToggle'
  | 'titleBarControls'
> & {
  tree: ExplorerItem[];
  /** Initial content location; defaults to the first tree root. */
  initialLocationId?: string;
};

/**
 * Stateful FileExplorer host for one site window: owns view / location / selection / forest edits.
 * Parent supplies the initial forest (`tree`) and window chrome callbacks (`onClose`, …).
 */
export function SiteFileExplorer({
  tree,
  initialLocationId,
  onClose,
  title,
  titleIcon = 'site',
  ...rest
}: SiteFileExplorerProps) {
  const rootId = initialLocationId ?? tree[0]?.id ?? '';
  const [forest, setForest] = useState(() => cloneExplorerForest(tree));
  const [view, setView] = useState<ExplorerView>('large-icons');
  const [locationId, setLocationId] = useState(rootId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [undoEntry, setUndoEntry] = useState<ExplorerDeleteUndo | null>(null);

  const location = useMemo(() => findExplorerItem(forest, locationId), [forest, locationId]);
  const selected = useMemo(() => findExplorerItem(forest, selectedId), [forest, selectedId]);
  const items = useMemo(() => explorerContentItems(location), [location]);
  const parent = useMemo(() => findExplorerParent(forest, locationId), [forest, locationId]);
  const hiddenCount = items.filter((item) => item.hidden).length;
  const statusItem = selected ?? location;
  const canDelete = canDeleteExplorerItem(forest, selected);

  const goToLocation = (item: ExplorerItem) => {
    if (item.disabled || !isExplorerLocation(item)) {
      return;
    }
    setLocationId(item.id);
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (!selectedId) {
      return;
    }
    const result = deleteExplorerItem(forest, selectedId);
    if (!result) {
      return;
    }
    setForest(result.tree);
    setUndoEntry(result.undo);
    setSelectedId(null);
  };

  const handleUndo = () => {
    if (!undoEntry) {
      return;
    }
    const next = undoExplorerDelete(forest, undoEntry);
    if (!next) {
      setUndoEntry(null);
      return;
    }
    setForest(next);
    setSelectedId(undoEntry.item.id);
    setUndoEntry(null);
  };

  return (
    <FileExplorerWindow
      title={title}
      titleIcon={titleIcon}
      {...rest}
      tree={forest}
      items={items}
      view={view}
      onViewChange={setView}
      locationId={locationId}
      selectedId={selectedId}
      onTreeSelect={goToLocation}
      onSelect={(item) => setSelectedId(item.id)}
      onOpen={goToLocation}
      onLevelUp={() => {
        if (!parent) {
          return;
        }
        setLocationId(parent.id);
        setSelectedId(null);
      }}
      levelUpDisabled={!parent}
      onClose={onClose}
      onDelete={canDelete ? handleDelete : undefined}
      onUndo={undoEntry ? handleUndo : undefined}
      statusBarVisible={statusBarVisible}
      onStatusBarToggle={() => setStatusBarVisible((value) => !value)}
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" />
          <TitleBarControl action="Maximize" />
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
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
