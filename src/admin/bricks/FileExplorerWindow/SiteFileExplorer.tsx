import { useMemo, useState } from 'react';
import { StatusBar, StatusBarField, TitleBarControl, TitleBarControls } from '../../chrome';
import { ExplorerPropertiesDialog } from './ExplorerPropertiesDialog';
import {
  canCutOrCopyExplorerItem,
  canDeleteExplorerItem,
  canPasteIntoExplorerLocation,
  cloneExplorerForest,
  deleteExplorerItem,
  pasteExplorerClipboard,
  undoExplorerAction,
  type ExplorerClipboard,
  type ExplorerUndo,
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
  | 'cutItemId'
  | 'onTreeSelect'
  | 'onSelect'
  | 'onOpen'
  | 'onLevelUp'
  | 'levelUpDisabled'
  | 'onCut'
  | 'onCopy'
  | 'onPaste'
  | 'onDelete'
  | 'onUndo'
  | 'onProperties'
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
  const [clipboard, setClipboard] = useState<ExplorerClipboard | null>(null);
  const [undoEntry, setUndoEntry] = useState<ExplorerUndo | null>(null);
  const [propertiesItem, setPropertiesItem] = useState<ExplorerItem | null>(null);

  const location = useMemo(() => findExplorerItem(forest, locationId), [forest, locationId]);
  const selected = useMemo(() => findExplorerItem(forest, selectedId), [forest, selectedId]);
  const items = useMemo(() => explorerContentItems(location), [location]);
  const parent = useMemo(() => findExplorerParent(forest, locationId), [forest, locationId]);
  const hiddenCount = items.filter((item) => item.hidden).length;
  const statusItem = selected ?? location;
  const canDelete = canDeleteExplorerItem(forest, selected);
  const canCutCopy = canCutOrCopyExplorerItem(forest, selected);
  const canPaste = canPasteIntoExplorerLocation(forest, locationId, clipboard);
  const canProperties = Boolean(selected);

  const goToLocation = (item: ExplorerItem) => {
    if (item.disabled || !isExplorerLocation(item)) {
      return;
    }
    setLocationId(item.id);
    setSelectedId(null);
  };

  const handleCut = () => {
    if (!selected || !canCutCopy) {
      return;
    }
    const sourceParent = findExplorerParent(forest, selected.id);
    if (!sourceParent) {
      return;
    }
    setClipboard({
      mode: 'cut',
      item: cloneExplorerForest([selected])[0],
      sourceParentId: sourceParent.id,
    });
  };

  const handleCopy = () => {
    if (!selected || !canCutCopy) {
      return;
    }
    setClipboard({
      mode: 'copy',
      item: cloneExplorerForest([selected])[0],
      sourceParentId: null,
    });
  };

  const handlePaste = () => {
    if (!clipboard || !locationId) {
      return;
    }
    const result = pasteExplorerClipboard(forest, locationId, clipboard);
    if (!result) {
      return;
    }
    setForest(result.tree);
    setUndoEntry(result.undo);
    setSelectedId(result.pasted.id);
    if (clipboard.mode === 'cut') {
      setClipboard(null);
    }
  };

  const handleDelete = () => {
    if (!selectedId) {
      return;
    }
    const result = deleteExplorerItem(forest, selectedId);
    if (!result) {
      return;
    }
    if (clipboard && clipboard.item.id === selectedId) {
      setClipboard(null);
    }
    if (propertiesItem?.id === selectedId) {
      setPropertiesItem(null);
    }
    setForest(result.tree);
    setUndoEntry(result.undo);
    setSelectedId(null);
  };

  const handleUndo = () => {
    if (!undoEntry) {
      return;
    }
    const next = undoExplorerAction(forest, undoEntry);
    if (!next) {
      setUndoEntry(null);
      return;
    }
    setForest(next);
    if (undoEntry.type === 'to-trash' || undoEntry.type === 'permanent') {
      setSelectedId(undoEntry.item.id);
    } else {
      setSelectedId(undoEntry.itemId);
    }
    setUndoEntry(null);
  };

  const propertiesParentLabel = propertiesItem
    ? (findExplorerParent(forest, propertiesItem.id)?.label ?? null)
    : null;

  return (
    <div className="site-file-explorer">
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
        cutItemId={clipboard?.mode === 'cut' ? clipboard.item.id : null}
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
        onCut={canCutCopy ? handleCut : undefined}
        onCopy={canCutCopy ? handleCopy : undefined}
        onPaste={canPaste ? handlePaste : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onUndo={undoEntry ? handleUndo : undefined}
        onProperties={
          canProperties
            ? () => {
                if (selected) {
                  setPropertiesItem(selected);
                }
              }
            : undefined
        }
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
      {propertiesItem ? (
        <div className="explorer-properties-overlay">
          <ExplorerPropertiesDialog
            item={propertiesItem}
            parentLabel={propertiesParentLabel}
            onClose={() => setPropertiesItem(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
