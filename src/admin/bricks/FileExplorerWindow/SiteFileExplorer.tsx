import { useMemo, useState } from 'react';
import { StatusBar, StatusBarField, TitleBarControl, TitleBarControls } from '../../chrome';
import { DesktopModal } from '../DesktopModal';
import { ExplorerPropertiesDialog } from './ExplorerPropertiesDialog';
import {
  canCutOrCopyExplorerItems,
  canDeleteExplorerItem,
  canPasteIntoExplorerLocation,
  cloneExplorerForest,
  deleteExplorerItems,
  moveExplorerItems,
  pasteExplorerClipboard,
  undoExplorerAction,
  type ExplorerClipboard,
  type ExplorerUndo,
} from './explorerTreeOps';
import { FileExplorerWindow, type FileExplorerWindowProps } from './FileExplorerWindow';
import type { ExplorerSelectModifiers } from './ExplorerContent';
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
  | 'selectedIds'
  | 'cutItemIds'
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
  | 'onSelectAll'
  | 'onItemsDrop'
  | 'statusBar'
  | 'statusBarVisible'
  | 'onStatusBarToggle'
  | 'titleBarControls'
> & {
  tree: ExplorerItem[];
  /** Initial content location; defaults to the first tree root. */
  initialLocationId?: string;
  /** Shell minimize (Phase 5 taskbar). */
  onMinimize?: () => void;
  /** Shell maximize / restore. */
  onMaximize?: () => void;
  /** Title-bar control label when maximized. */
  maximizeAction?: 'Maximize' | 'Restore';
};

/**
 * Stateful FileExplorer host for one site window: owns view / location / selection / forest edits.
 * Parent supplies the initial forest (`tree`) and window chrome callbacks (`onClose`, …).
 */
export function SiteFileExplorer({
  tree,
  initialLocationId,
  onClose,
  onMinimize,
  onMaximize,
  maximizeAction = 'Maximize',
  title,
  titleIcon = 'site',
  ...rest
}: SiteFileExplorerProps) {
  const rootId = initialLocationId ?? tree[0]?.id ?? '';
  const [forest, setForest] = useState(() => cloneExplorerForest(tree));
  const [view, setView] = useState<ExplorerView>('large-icons');
  const [locationId, setLocationId] = useState(rootId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [clipboard, setClipboard] = useState<ExplorerClipboard | null>(null);
  const [undoEntry, setUndoEntry] = useState<ExplorerUndo | null>(null);
  const [propertiesItem, setPropertiesItem] = useState<ExplorerItem | null>(null);

  const location = useMemo(() => findExplorerItem(forest, locationId), [forest, locationId]);
  const items = useMemo(() => explorerContentItems(location), [location]);
  const parent = useMemo(() => findExplorerParent(forest, locationId), [forest, locationId]);
  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => findExplorerItem(forest, id) ?? items.find((item) => item.id === id) ?? null)
        .filter((item): item is ExplorerItem => item !== null),
    [forest, items, selectedIds],
  );
  const primarySelected = selectedItems[selectedItems.length - 1] ?? null;
  const hiddenCount = items.filter((item) => item.hidden).length;
  const statusItem = primarySelected ?? location;
  const canDelete =
    selectedItems.length > 0 &&
    selectedItems.every((item) => canDeleteExplorerItem(forest, item));
  const canCutCopy = canCutOrCopyExplorerItems(forest, selectedItems);
  const canPaste = canPasteIntoExplorerLocation(forest, locationId, clipboard);
  const canProperties = selectedItems.length === 1;
  const canSelectAll = items.length > 0;

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionAnchorId(null);
  };

  const goToLocation = (item: ExplorerItem) => {
    if (item.disabled || !isExplorerLocation(item)) {
      return;
    }
    setLocationId(item.id);
    clearSelection();
  };

  const handleSelect = (item: ExplorerItem, modifiers: ExplorerSelectModifiers) => {
    const additive = modifiers.ctrlKey || modifiers.metaKey;

    if (modifiers.shiftKey && selectionAnchorId) {
      const anchorIndex = items.findIndex((entry) => entry.id === selectionAnchorId);
      const targetIndex = items.findIndex((entry) => entry.id === item.id);
      if (anchorIndex >= 0 && targetIndex >= 0) {
        const [from, to] =
          anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
        const rangeIds = items.slice(from, to + 1).map((entry) => entry.id);
        if (additive) {
          setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        } else {
          setSelectedIds(rangeIds);
        }
        return;
      }
    }

    if (additive) {
      setSelectedIds((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
      );
      setSelectionAnchorId(item.id);
      return;
    }

    setSelectedIds([item.id]);
    setSelectionAnchorId(item.id);
  };

  const handleSelectAll = () => {
    if (!canSelectAll) {
      return;
    }
    setSelectedIds(items.map((item) => item.id));
    setSelectionAnchorId(items[0]?.id ?? null);
  };

  const handleCut = () => {
    if (!canCutCopy || selectedItems.length === 0) {
      return;
    }
    const sourceParent = findExplorerParent(forest, selectedItems[0].id);
    if (!sourceParent) {
      return;
    }
    if (
      selectedItems.some((item) => findExplorerParent(forest, item.id)?.id !== sourceParent.id)
    ) {
      return;
    }
    setClipboard({
      mode: 'cut',
      items: cloneExplorerForest(selectedItems),
      sourceParentId: sourceParent.id,
    });
  };

  const handleCopy = () => {
    if (!canCutCopy || selectedItems.length === 0) {
      return;
    }
    setClipboard({
      mode: 'copy',
      items: cloneExplorerForest(selectedItems),
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
    setSelectedIds(result.pasted.map((item) => item.id));
    setSelectionAnchorId(result.pasted[0]?.id ?? null);
    if (clipboard.mode === 'cut') {
      setClipboard(null);
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }
    const result = deleteExplorerItems(forest, selectedIds);
    if (!result) {
      return;
    }
    if (clipboard?.items.some((item) => selectedIds.includes(item.id))) {
      setClipboard(null);
    }
    if (propertiesItem && selectedIds.includes(propertiesItem.id)) {
      setPropertiesItem(null);
    }
    setForest(result.tree);
    setUndoEntry(result.undo);
    clearSelection();
  };

  const handleItemsDrop = (itemIds: string[], targetId: string) => {
    const result = moveExplorerItems(forest, itemIds, targetId);
    if (!result) {
      return;
    }
    if (clipboard?.items.some((item) => itemIds.includes(item.id))) {
      setClipboard(null);
    }
    setForest(result.tree);
    setUndoEntry(result.undo);
    setSelectedIds(result.moved.map((item) => item.id));
    setSelectionAnchorId(result.moved[0]?.id ?? null);
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
      setSelectedIds([undoEntry.item.id]);
      setSelectionAnchorId(undoEntry.item.id);
    } else if (undoEntry.type === 'delete-many') {
      const ids = undoEntry.undos.map((entry) => entry.item.id);
      setSelectedIds(ids);
      setSelectionAnchorId(ids[0] ?? null);
    } else {
      setSelectedIds(undoEntry.itemIds);
      setSelectionAnchorId(undoEntry.itemIds[0] ?? null);
    }
    setUndoEntry(null);
  };

  const propertiesParentLabel = propertiesItem
    ? (findExplorerParent(forest, propertiesItem.id)?.label ?? null)
    : null;

  const statusCountLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} object(s) selected`
      : `${items.length} object(s)${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}`;

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
        selectedIds={selectedIds}
        cutItemIds={clipboard?.mode === 'cut' ? clipboard.items.map((item) => item.id) : []}
        onTreeSelect={goToLocation}
        onSelect={handleSelect}
        onOpen={goToLocation}
        onItemsDrop={handleItemsDrop}
        onLevelUp={() => {
          if (!parent) {
            return;
          }
          setLocationId(parent.id);
          clearSelection();
        }}
        levelUpDisabled={!parent}
        onClose={onClose}
        onCut={canCutCopy ? handleCut : undefined}
        onCopy={canCutCopy ? handleCopy : undefined}
        onPaste={canPaste ? handlePaste : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onUndo={undoEntry ? handleUndo : undefined}
        onSelectAll={canSelectAll ? handleSelectAll : undefined}
        onProperties={
          canProperties
            ? () => {
                if (primarySelected) {
                  setPropertiesItem(primarySelected);
                }
              }
            : undefined
        }
        statusBarVisible={statusBarVisible}
        onStatusBarToggle={() => setStatusBarVisible((value) => !value)}
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Minimize" onClick={onMinimize} />
            <TitleBarControl action={maximizeAction} onClick={onMaximize} />
            <TitleBarControl action="Close" onClick={onClose} />
          </TitleBarControls>
        }
        statusBar={
          statusBarVisible ? (
            <StatusBar>
              <StatusBarField>{statusCountLabel}</StatusBarField>
              <StatusBarField className="description">{statusItem?.typeLabel ?? ''}</StatusBarField>
              <StatusBarField />
            </StatusBar>
          ) : undefined
        }
      />
      {propertiesItem ? (
        <DesktopModal>
          <ExplorerPropertiesDialog
            item={propertiesItem}
            parentLabel={propertiesParentLabel}
            onClose={() => setPropertiesItem(null)}
          />
        </DesktopModal>
      ) : null}
    </div>
  );
}
