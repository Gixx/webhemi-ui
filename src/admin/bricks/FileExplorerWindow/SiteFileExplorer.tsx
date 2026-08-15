import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminApiClient } from '../../api';
import { StatusBar, StatusBarField, TitleBarControl, TitleBarControls } from '../../chrome';
import { DesktopModal } from '../DesktopModal';
import { MessageDialog } from '../MessageDialog';
import {
  apiParentContext,
  isUnderMediaLibrary,
  mapApiExplorerForest,
  parseExplorerEntityId,
  slugifyExplorerTitle,
} from './explorerApi';
import { ExplorerPromptDialog } from './ExplorerPromptDialog';
import { ExplorerPropertiesDialog } from './ExplorerPropertiesDialog';
import {
  buildEmptySiteExplorerTree,
  type SiteExplorerIdentity,
} from './FileExplorerWindow.data';
import {
  canCutOrCopyExplorerItems,
  canDeleteExplorerItem,
  canPasteIntoExplorerLocation,
  cloneExplorerForest,
  deleteExplorerItems,
  isUnderExplorerTrash,
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

type PromptKind = 'new-folder' | 'new-page' | 'rename';

type SoftDeleteUndo = {
  type: 'soft-delete';
  refs: Array<{ type: 'node' | 'media'; id: number }>;
};

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
  | 'onNewFolder'
  | 'onNewPage'
  | 'onRename'
  | 'statusBar'
  | 'statusBarVisible'
  | 'onStatusBarToggle'
  | 'titleBarControls'
> & {
  /** Initial / Storybook forest. Ignored after first successful API load when `api` is set. */
  tree?: ExplorerItem[];
  /** When set with `siteId`, load + mutate via `/admin/api/sites/{id}/…`. */
  api?: AdminApiClient;
  siteId?: number;
  /** Used for empty roots while loading. */
  siteName?: string;
  /** Initial content location; defaults to the first tree root. */
  initialLocationId?: string;
  /** Called when the Settings root is activated (opens site-settings shell). */
  onOpenSiteSettings?: () => void;
  /** Shell minimize (Phase 5 taskbar). */
  onMinimize?: () => void;
  /** Shell maximize / restore. */
  onMaximize?: () => void;
  /** Title-bar control label when maximized. */
  maximizeAction?: 'Maximize' | 'Restore';
};

/**
 * Stateful FileExplorer host for one site window: owns view / location / selection / forest edits.
 * With `api` + `siteId`, forest and mutations go through PHP (Slice 2). Without API, local ops
 * (Storybook fixtures).
 */
export function SiteFileExplorer({
  tree: treeProp,
  api,
  siteId,
  siteName,
  initialLocationId,
  onOpenSiteSettings,
  onClose,
  onMinimize,
  onMaximize,
  maximizeAction = 'Maximize',
  title,
  titleIcon = 'site',
  resizable = true,
  ...rest
}: SiteFileExplorerProps) {
  const live = Boolean(api && siteId != null);
  const siteIdentity: SiteExplorerIdentity = {
    id: siteId ?? 'local',
    name: siteName ?? title ?? 'Site',
  };
  const fallbackTree = treeProp ?? buildEmptySiteExplorerTree(siteIdentity);
  const rootId = initialLocationId ?? fallbackTree[0]?.id ?? '';

  const [forest, setForest] = useState(() => cloneExplorerForest(fallbackTree));
  const [view, setView] = useState<ExplorerView>('large-icons');
  const [locationId, setLocationId] = useState(rootId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [clipboard, setClipboard] = useState<ExplorerClipboard | null>(null);
  const [undoEntry, setUndoEntry] = useState<ExplorerUndo | null>(null);
  const [softDeleteUndo, setSoftDeleteUndo] = useState<SoftDeleteUndo | null>(null);
  const [propertiesItem, setPropertiesItem] = useState<ExplorerItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<PromptKind | null>(null);

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

  const selectedMovable = useMemo(() => {
    if (!live) {
      return selectedItems;
    }
    // API mode: nodes only for cut/move; media move deferred.
    return selectedItems.filter((item) => parseExplorerEntityId(item.id)?.type === 'node');
  }, [live, selectedItems]);

  const canDelete =
    selectedItems.length > 0 &&
    selectedItems.every((item) => canDeleteExplorerItem(forest, item));
  const canCutCopy = canCutOrCopyExplorerItems(forest, selectedMovable);
  const canPaste =
    Boolean(clipboard) &&
    clipboard?.mode === 'cut' &&
    canPasteIntoExplorerLocation(forest, locationId, clipboard);
  const canProperties = selectedItems.length === 1;
  const canSelectAll = items.length > 0;
  const canCreate = Boolean(
    location &&
      !location.disabled &&
      (location.role === 'site' ||
        location.role === 'media-library' ||
        location.role === 'folder'),
  );
  const canRename =
    selectedItems.length === 1 &&
    canDeleteExplorerItem(forest, selectedItems[0]) &&
    parseExplorerEntityId(selectedItems[0].id)?.type === 'node';

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionAnchorId(null);
  };

  const reloadForest = useCallback(async (): Promise<boolean> => {
    if (!api || siteId == null) {
      return false;
    }
    const result = await api.getExplorerForest(siteId);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      return false;
    }
    const next = mapApiExplorerForest(result.data);
    setForest(next);
    setLocationId((prev) => {
      if (prev && findExplorerItem(next, prev)) {
        return prev;
      }
      return next[0]?.id ?? '';
    });
    return true;
  }, [api, siteId]);

  useEffect(() => {
    if (!live) {
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      await reloadForest();
      if (!cancelled) {
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live, reloadForest]);

  const resolveCreateContext = () => {
    if (!location) {
      return null;
    }
    const base = apiParentContext(location);
    if (!base) {
      return null;
    }
    if (location.role === 'folder') {
      const underMedia = isUnderMediaLibrary(forest, location.id, findExplorerParent);
      return { ...base, tree: underMedia ? ('media' as const) : ('site' as const) };
    }
    return base;
  };

  const goToLocation = (item: ExplorerItem) => {
    if (item.role === 'settings') {
      onOpenSiteSettings?.();
      return;
    }
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
    if (!canCutCopy || selectedMovable.length === 0) {
      return;
    }
    const sourceParent = findExplorerParent(forest, selectedMovable[0].id);
    if (!sourceParent) {
      return;
    }
    if (
      selectedMovable.some(
        (item) => findExplorerParent(forest, item.id)?.id !== sourceParent.id,
      )
    ) {
      return;
    }
    setClipboard({
      mode: 'cut',
      items: cloneExplorerForest(selectedMovable),
      sourceParentId: sourceParent.id,
    });
  };

  const handleCopy = () => {
    if (live) {
      setErrorMessage('Copy is not supported yet.');
      return;
    }
    if (!canCutOrCopyExplorerItems(forest, selectedItems) || selectedItems.length === 0) {
      return;
    }
    setClipboard({
      mode: 'copy',
      items: cloneExplorerForest(selectedItems),
      sourceParentId: null,
    });
  };

  const handlePasteLocal = () => {
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

  const handlePasteApi = async () => {
    if (!api || siteId == null || !clipboard || clipboard.mode !== 'cut' || !location) {
      return;
    }
    const ctx = resolveCreateContext();
    if (!ctx) {
      return;
    }
    setBusy(true);
    for (const item of clipboard.items) {
      const ref = parseExplorerEntityId(item.id);
      if (!ref || ref.type !== 'node') {
        continue;
      }
      const result = await api.updateContentNode(siteId, ref.id, { parentId: ctx.parentId });
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setBusy(false);
        await reloadForest();
        return;
      }
    }
    setClipboard(null);
    setSoftDeleteUndo(null);
    setUndoEntry(null);
    clearSelection();
    await reloadForest();
    setBusy(false);
  };

  const handlePaste = () => {
    if (live) {
      void handlePasteApi();
      return;
    }
    handlePasteLocal();
  };

  const handleDeleteLocal = () => {
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

  const handleDeleteApi = async () => {
    if (!api || siteId == null || selectedItems.length === 0) {
      return;
    }
    setBusy(true);
    const softRefs: SoftDeleteUndo['refs'] = [];
    for (const item of selectedItems) {
      const ref = parseExplorerEntityId(item.id);
      if (!ref) {
        continue;
      }
      const inTrash = isUnderExplorerTrash(forest, item.id);
      if (ref.type === 'node') {
        const result = inTrash
          ? await api.purgeContentNode(siteId, ref.id)
          : await api.deleteContentNode(siteId, ref.id);
        if (!result.ok) {
          setErrorMessage(result.error.message);
          setBusy(false);
          await reloadForest();
          return;
        }
        if (!inTrash) {
          softRefs.push(ref);
        }
      } else {
        const result = inTrash
          ? await api.purgeMedia(siteId, ref.id)
          : await api.deleteMedia(siteId, ref.id);
        if (!result.ok) {
          setErrorMessage(result.error.message);
          setBusy(false);
          await reloadForest();
          return;
        }
        if (!inTrash) {
          softRefs.push(ref);
        }
      }
    }
    if (clipboard?.items.some((item) => selectedIds.includes(item.id))) {
      setClipboard(null);
    }
    if (propertiesItem && selectedIds.includes(propertiesItem.id)) {
      setPropertiesItem(null);
    }
    setSoftDeleteUndo(softRefs.length > 0 ? { type: 'soft-delete', refs: softRefs } : null);
    setUndoEntry(null);
    clearSelection();
    await reloadForest();
    setBusy(false);
  };

  const handleDelete = () => {
    if (live) {
      void handleDeleteApi();
      return;
    }
    handleDeleteLocal();
  };

  const handleItemsDropLocal = (itemIds: string[], targetId: string) => {
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

  const handleItemsDropApi = async (itemIds: string[], targetId: string) => {
    if (!api || siteId == null) {
      return;
    }
    const target = findExplorerItem(forest, targetId);
    if (!target) {
      return;
    }
    const ctx =
      target.role === 'folder'
        ? (() => {
            const ref = parseExplorerEntityId(target.id);
            if (!ref || ref.type !== 'node') {
              return null;
            }
            return {
              parentId: ref.id,
              tree: isUnderMediaLibrary(forest, target.id, findExplorerParent)
                ? ('media' as const)
                : ('site' as const),
            };
          })()
        : apiParentContext(target);
    if (!ctx) {
      return;
    }
    setBusy(true);
    for (const id of itemIds) {
      const ref = parseExplorerEntityId(id);
      if (!ref || ref.type !== 'node') {
        continue;
      }
      const result = await api.updateContentNode(siteId, ref.id, { parentId: ctx.parentId });
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setBusy(false);
        await reloadForest();
        return;
      }
    }
    setClipboard(null);
    setSoftDeleteUndo(null);
    setUndoEntry(null);
    await reloadForest();
    setBusy(false);
  };

  const handleItemsDrop = (itemIds: string[], targetId: string) => {
    if (live) {
      void handleItemsDropApi(itemIds, targetId);
      return;
    }
    handleItemsDropLocal(itemIds, targetId);
  };

  const handleUndoLocal = () => {
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

  const handleUndoApi = async () => {
    if (!api || siteId == null || !softDeleteUndo) {
      return;
    }
    setBusy(true);
    for (const ref of softDeleteUndo.refs) {
      const result =
        ref.type === 'node'
          ? await api.restoreContentNode(siteId, ref.id)
          : await api.restoreMedia(siteId, ref.id);
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setBusy(false);
        await reloadForest();
        return;
      }
    }
    setSoftDeleteUndo(null);
    await reloadForest();
    setBusy(false);
  };

  const handleUndo = () => {
    if (live) {
      void handleUndoApi();
      return;
    }
    handleUndoLocal();
  };

  const handlePromptConfirm = async (value: string) => {
    const kind = prompt;
    setPrompt(null);
    if (!kind) {
      return;
    }

    if (!live || !api || siteId == null) {
      return;
    }

    if (kind === 'rename') {
      const item = selectedItems[0];
      const ref = item ? parseExplorerEntityId(item.id) : null;
      if (!ref || ref.type !== 'node') {
        return;
      }
      setBusy(true);
      const result = await api.updateContentNode(siteId, ref.id, {
        title: value,
        slug: slugifyExplorerTitle(value),
      });
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setBusy(false);
        return;
      }
      await reloadForest();
      setBusy(false);
      return;
    }

    const ctx = resolveCreateContext();
    if (!ctx) {
      return;
    }
    setBusy(true);
    const result = await api.createContentNode(siteId, {
      kind: kind === 'new-folder' ? 'folder' : 'document',
      tree: ctx.tree,
      parentId: ctx.parentId,
      title: value,
      slug: slugifyExplorerTitle(value),
      folderType: kind === 'new-folder' ? 'normal' : null,
      body: kind === 'new-page' ? '' : null,
      publication: 'draft',
    });
    if (!result.ok) {
      setErrorMessage(result.error.message);
      setBusy(false);
      return;
    }
    await reloadForest();
    setBusy(false);
  };

  const propertiesParentLabel = propertiesItem
    ? (findExplorerParent(forest, propertiesItem.id)?.label ?? null)
    : null;

  const statusCountLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} object(s) selected`
      : `${items.length} object(s)${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}${
          busy ? ' — updating…' : ''
        }`;

  const canUndo = live ? softDeleteUndo != null : undoEntry != null;
  const copyHandler = live
    ? undefined
    : canCutOrCopyExplorerItems(forest, selectedItems)
      ? handleCopy
      : undefined;

  return (
    <div className="site-file-explorer">
      <FileExplorerWindow
        title={title}
        titleIcon={titleIcon}
        {...rest}
        resizable={resizable}
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
        onCopy={copyHandler}
        onPaste={canPaste ? handlePaste : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onUndo={canUndo ? handleUndo : undefined}
        onNewFolder={live && canCreate ? () => setPrompt('new-folder') : undefined}
        onNewPage={
          live && canCreate && resolveCreateContext()?.tree === 'site'
            ? () => setPrompt('new-page')
            : undefined
        }
        onRename={live && canRename ? () => setPrompt('rename') : undefined}
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
            {resizable ? (
              <TitleBarControl action={maximizeAction} onClick={onMaximize} />
            ) : null}
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
      {prompt ? (
        <ExplorerPromptDialog
          title={
            prompt === 'new-folder'
              ? 'New Folder'
              : prompt === 'new-page'
                ? 'New Page'
                : 'Rename'
          }
          label={prompt === 'rename' ? 'New name:' : 'Name:'}
          initialValue={prompt === 'rename' ? (primarySelected?.label ?? '') : ''}
          confirmLabel={prompt === 'rename' ? 'Rename' : 'Create'}
          onCancel={() => setPrompt(null)}
          onConfirm={(value) => {
            void handlePromptConfirm(value);
          }}
        />
      ) : null}
      {errorMessage ? (
        <DesktopModal>
          <MessageDialog
            type="error"
            title="Error"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        </DesktopModal>
      ) : null}
    </div>
  );
}
