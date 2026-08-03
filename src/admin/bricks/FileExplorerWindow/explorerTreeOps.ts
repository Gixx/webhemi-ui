import type { ExplorerItem } from './types';
import {
  findExplorerAncestorIds,
  findExplorerItem,
  findExplorerParent,
  isExplorerFolder,
} from './types';

/** Deep-clone a forest so hosts can mutate without touching fixtures/props. */
export function cloneExplorerForest(nodes: ExplorerItem[]): ExplorerItem[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneExplorerForest(node.children) : undefined,
  }));
}

export function findExplorerTrashRoot(roots: ExplorerItem[]): ExplorerItem | null {
  return roots.find((node) => node.role === 'trash') ?? null;
}

/** True when `id` is the trash root or any node under it. */
export function isUnderExplorerTrash(
  roots: ExplorerItem[],
  id: string | null | undefined,
): boolean {
  if (!id) {
    return false;
  }
  const trash = findExplorerTrashRoot(roots);
  if (!trash) {
    return false;
  }
  if (id === trash.id) {
    return true;
  }
  return findExplorerAncestorIds(roots, id).includes(trash.id);
}

/**
 * Forest roots and system roots cannot be deleted.
 * Content items (folders, documents, assets, trash contents) can.
 */
export function canDeleteExplorerItem(
  roots: ExplorerItem[],
  item: ExplorerItem | null | undefined,
): boolean {
  if (!item) {
    return false;
  }
  if (roots.some((root) => root.id === item.id)) {
    return false;
  }
  if (
    item.role === 'site' ||
    item.role === 'media-library' ||
    item.role === 'trash' ||
    item.role === 'settings'
  ) {
    return false;
  }
  return findExplorerItem(roots, item.id) !== null;
}

function mapForest(
  nodes: ExplorerItem[],
  mapNode: (node: ExplorerItem) => ExplorerItem | null,
): ExplorerItem[] {
  const result: ExplorerItem[] = [];
  for (const node of nodes) {
    const mapped = mapNode(node);
    if (!mapped) {
      continue;
    }
    result.push(mapped);
  }
  return result;
}

/** Remove `id` from the forest; returns the removed node and its former parent id. */
export function removeExplorerItem(
  roots: ExplorerItem[],
  id: string,
): { tree: ExplorerItem[]; removed: ExplorerItem | null; parentId: string | null } {
  const parent = findExplorerParent(roots, id);
  let removed: ExplorerItem | null = null;

  const walk = (nodes: ExplorerItem[]): ExplorerItem[] =>
    mapForest(nodes, (node) => {
      if (node.id === id) {
        removed = node;
        return null;
      }
      if (!node.children?.length) {
        return node;
      }
      return { ...node, children: walk(node.children) };
    });

  const tree = walk(roots);
  return { tree, removed, parentId: parent?.id ?? null };
}

/** Append `child` under `parentId` (forest root or nested node). */
export function appendExplorerChild(
  roots: ExplorerItem[],
  parentId: string,
  child: ExplorerItem,
): ExplorerItem[] {
  const walk = (nodes: ExplorerItem[]): ExplorerItem[] =>
    nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children ?? []), child],
        };
      }
      if (!node.children?.length) {
        return node;
      }
      return { ...node, children: walk(node.children) };
    });

  return walk(roots);
}

export type ExplorerDeleteUndo =
  | {
      type: 'to-trash';
      item: ExplorerItem;
      parentId: string;
    }
  | {
      type: 'permanent';
      item: ExplorerItem;
      parentId: string;
    };

export type ExplorerClipboard = {
  mode: 'cut' | 'copy';
  items: ExplorerItem[];
  /** Shared parent before cut; unused for copy. */
  sourceParentId: string | null;
};

export type ExplorerPasteUndo =
  | {
      type: 'paste-copy';
      itemIds: string[];
      parentId: string;
    }
  | {
      type: 'paste-cut';
      itemIds: string[];
      fromParentId: string;
      toParentId: string;
    };

export type ExplorerDeleteManyUndo = {
  type: 'delete-many';
  undos: ExplorerDeleteUndo[];
};

export type ExplorerUndo = ExplorerDeleteUndo | ExplorerPasteUndo | ExplorerDeleteManyUndo;

/** Same movability rules as delete (no forest / system roots). */
export function canCutOrCopyExplorerItem(
  roots: ExplorerItem[],
  item: ExplorerItem | null | undefined,
): boolean {
  return canDeleteExplorerItem(roots, item);
}

export function canCutOrCopyExplorerItems(
  roots: ExplorerItem[],
  items: ExplorerItem[],
): boolean {
  return items.length > 0 && items.every((item) => canCutOrCopyExplorerItem(roots, item));
}

export function canPasteIntoExplorerLocation(
  roots: ExplorerItem[],
  locationId: string | null | undefined,
  clipboard: ExplorerClipboard | null,
): boolean {
  if (!clipboard?.items.length || !locationId) {
    return false;
  }
  const location = findExplorerItem(roots, locationId);
  if (!location || location.disabled) {
    return false;
  }
  if (location.role === 'trash' || location.role === 'settings') {
    return false;
  }
  if (
    location.role !== 'site' &&
    location.role !== 'media-library' &&
    location.role !== 'folder' &&
    !isExplorerFolder(location)
  ) {
    return false;
  }

  if (clipboard.mode === 'cut') {
    for (const item of clipboard.items) {
      if (!findExplorerItem(roots, item.id)) {
        return false;
      }
      if (locationId === item.id) {
        return false;
      }
      if (findExplorerAncestorIds(roots, locationId).includes(item.id)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Delete selection: move to Recycle Bin, or permanently remove when already in trash.
 * Returns null when the item cannot be deleted or trash is missing for a move.
 */
export function deleteExplorerItem(
  roots: ExplorerItem[],
  itemId: string,
): { tree: ExplorerItem[]; undo: ExplorerDeleteUndo } | null {
  const item = findExplorerItem(roots, itemId);
  if (!canDeleteExplorerItem(roots, item) || !item) {
    return null;
  }

  const parent = findExplorerParent(roots, itemId);
  if (!parent) {
    return null;
  }

  if (isUnderExplorerTrash(roots, itemId)) {
    const { tree, removed, parentId } = removeExplorerItem(roots, itemId);
    if (!removed || !parentId) {
      return null;
    }
    return {
      tree,
      undo: { type: 'permanent', item: removed, parentId },
    };
  }

  const trash = findExplorerTrashRoot(roots);
  if (!trash) {
    return null;
  }

  const { tree: without, removed, parentId } = removeExplorerItem(roots, itemId);
  if (!removed || !parentId) {
    return null;
  }

  return {
    tree: appendExplorerChild(without, trash.id, removed),
    undo: { type: 'to-trash', item: removed, parentId },
  };
}

/** Clone `item` (and descendants) with ids that do not collide with `roots`. */
export function cloneExplorerItemWithNewIds(
  roots: ExplorerItem[],
  item: ExplorerItem,
): ExplorerItem {
  const used = new Set<string>();

  const nextId = (oldId: string): string => {
    let candidate = `${oldId}-copy`;
    let n = 1;
    while (findExplorerItem(roots, candidate) || used.has(candidate)) {
      n += 1;
      candidate = `${oldId}-copy-${n}`;
    }
    used.add(candidate);
    return candidate;
  };

  const walk = (node: ExplorerItem): ExplorerItem => ({
    ...node,
    id: nextId(node.id),
    children: node.children?.map(walk),
  });

  return walk(cloneExplorerForest([item])[0]);
}

/**
 * Move items into `targetId` (same rules as cut + paste).
 * Items must share one parent; target cannot be trash/settings/self/descendant.
 */
export function moveExplorerItems(
  roots: ExplorerItem[],
  itemIds: string[],
  targetId: string,
): { tree: ExplorerItem[]; moved: ExplorerItem[]; undo: ExplorerPasteUndo } | null {
  const items = itemIds
    .map((id) => findExplorerItem(roots, id))
    .filter((item): item is ExplorerItem => item !== null);
  if (!canCutOrCopyExplorerItems(roots, items)) {
    return null;
  }
  const sourceParent = findExplorerParent(roots, items[0].id);
  if (!sourceParent) {
    return null;
  }
  if (items.some((item) => findExplorerParent(roots, item.id)?.id !== sourceParent.id)) {
    return null;
  }
  const result = pasteExplorerClipboard(roots, targetId, {
    mode: 'cut',
    items: cloneExplorerForest(items),
    sourceParentId: sourceParent.id,
  });
  if (!result) {
    return null;
  }
  return { tree: result.tree, moved: result.pasted, undo: result.undo };
}

/**
 * Paste clipboard into `locationId`.
 * Cut moves the original nodes; copy inserts deep clones with new ids.
 */
export function pasteExplorerClipboard(
  roots: ExplorerItem[],
  locationId: string,
  clipboard: ExplorerClipboard,
): { tree: ExplorerItem[]; pasted: ExplorerItem[]; undo: ExplorerPasteUndo } | null {
  if (!canPasteIntoExplorerLocation(roots, locationId, clipboard)) {
    return null;
  }

  if (clipboard.mode === 'copy') {
    let tree = roots;
    const pasted: ExplorerItem[] = [];
    for (const item of clipboard.items) {
      const clone = cloneExplorerItemWithNewIds(tree, item);
      tree = appendExplorerChild(tree, locationId, clone);
      pasted.push(clone);
    }
    return {
      tree,
      pasted,
      undo: {
        type: 'paste-copy',
        itemIds: pasted.map((item) => item.id),
        parentId: locationId,
      },
    };
  }

  const firstParent = findExplorerParent(roots, clipboard.items[0]?.id ?? '');
  if (!firstParent || firstParent.id === locationId) {
    return null;
  }

  let tree = roots;
  const pasted: ExplorerItem[] = [];
  for (const item of clipboard.items) {
    const parent = findExplorerParent(tree, item.id);
    if (!parent || parent.id !== firstParent.id) {
      return null;
    }
    const { tree: without, removed } = removeExplorerItem(tree, item.id);
    if (!removed) {
      return null;
    }
    tree = appendExplorerChild(without, locationId, removed);
    pasted.push(removed);
  }

  return {
    tree,
    pasted,
    undo: {
      type: 'paste-cut',
      itemIds: pasted.map((item) => item.id),
      fromParentId: firstParent.id,
      toParentId: locationId,
    },
  };
}

/** Delete many items; undo restores in reverse order. */
export function deleteExplorerItems(
  roots: ExplorerItem[],
  itemIds: string[],
): { tree: ExplorerItem[]; undo: ExplorerDeleteManyUndo } | null {
  let tree = roots;
  const undos: ExplorerDeleteUndo[] = [];
  for (const id of itemIds) {
    const result = deleteExplorerItem(tree, id);
    if (!result) {
      continue;
    }
    tree = result.tree;
    undos.push(result.undo);
  }
  if (undos.length === 0) {
    return null;
  }
  return { tree, undo: { type: 'delete-many', undos } };
}

/** Reverse the last `deleteExplorerItem` result. */
export function undoExplorerDelete(
  roots: ExplorerItem[],
  entry: ExplorerDeleteUndo,
): ExplorerItem[] | null {
  if (entry.type === 'to-trash') {
    const trash = findExplorerTrashRoot(roots);
    if (!trash) {
      return null;
    }
    const { tree: without, removed } = removeExplorerItem(roots, entry.item.id);
    if (!removed) {
      return null;
    }
    if (!findExplorerItem(without, entry.parentId)) {
      return null;
    }
    return appendExplorerChild(without, entry.parentId, removed);
  }

  if (!findExplorerItem(roots, entry.parentId)) {
    return null;
  }
  return appendExplorerChild(roots, entry.parentId, entry.item);
}

/** Reverse the last paste (copy removes; cut moves back). */
export function undoExplorerPaste(
  roots: ExplorerItem[],
  entry: ExplorerPasteUndo,
): ExplorerItem[] | null {
  if (entry.type === 'paste-copy') {
    let tree = roots;
    for (const id of [...entry.itemIds].reverse()) {
      const { tree: next, removed } = removeExplorerItem(tree, id);
      if (!removed) {
        return null;
      }
      tree = next;
    }
    return tree;
  }

  let tree = roots;
  for (const id of [...entry.itemIds].reverse()) {
    const { tree: without, removed } = removeExplorerItem(tree, id);
    if (!removed || !findExplorerItem(without, entry.fromParentId)) {
      return null;
    }
    tree = appendExplorerChild(without, entry.fromParentId, removed);
  }
  return tree;
}

export function undoExplorerAction(
  roots: ExplorerItem[],
  entry: ExplorerUndo,
): ExplorerItem[] | null {
  if (entry.type === 'to-trash' || entry.type === 'permanent') {
    return undoExplorerDelete(roots, entry);
  }
  if (entry.type === 'delete-many') {
    let tree = roots;
    for (const undo of [...entry.undos].reverse()) {
      const next = undoExplorerDelete(tree, undo);
      if (!next) {
        return null;
      }
      tree = next;
    }
    return tree;
  }
  return undoExplorerPaste(roots, entry);
}
