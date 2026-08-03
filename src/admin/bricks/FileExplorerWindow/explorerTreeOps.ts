import type { ExplorerItem } from './types';
import { findExplorerAncestorIds, findExplorerItem, findExplorerParent } from './types';

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
