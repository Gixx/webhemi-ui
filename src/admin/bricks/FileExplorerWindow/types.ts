import type { SystemIconKind } from '../../chrome/SystemIcon';

/** Content view modes for FileExplorerWindow (no small-icons). */
export type ExplorerView = 'large-icons' | 'list' | 'details';

/**
 * Semantic role in a site-management explorer (not the glyph).
 * Drives tree expand rules and later open behavior.
 */
export type ExplorerNodeRole =
  | 'site'
  | 'folder'
  | 'document'
  | 'media-library'
  | 'media-asset'
  | 'trash'
  | 'settings';

/**
 * Explorer list/tree item. Metadata stays on this model (not on SystemIcon).
 *
 * Tree roots for a site window: site (nav tree) | media library | trash | settings.
 */
export type ExplorerItem = {
  id: string;
  label: string;
  kind: SystemIconKind;
  role?: ExplorerNodeRole;
  typeLabel?: string;
  sizeBytes?: number;
  modifiedAt?: string;
  hidden?: boolean;
  /**
   * When false, never render as expandable tree branch (e.g. recycle bin),
   * even if `children` holds a flat listing for the content pane.
   */
  expandable?: boolean;
  /** Inactive tree row (e.g. Settings until its window exists). */
  disabled?: boolean;
  children?: ExplorerItem[];
};

export function formatExplorerSize(sizeBytes: number | undefined): string {
  if (sizeBytes === undefined) {
    return '';
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes}B`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))}KB`;
}

/** Folder-like nodes that may appear under a tree branch (not documents/assets). */
export function isExplorerFolder(item: ExplorerItem): boolean {
  if (item.role === 'folder') {
    return true;
  }
  return (
    item.kind === 'folder' ||
    item.kind === 'folder-open' ||
    item.kind === 'folder-documents' ||
    item.kind === 'folder-gallery'
  );
}

/** HTML / page documents — open is deferred to a future editor window. */
export function isExplorerDocument(item: ExplorerItem): boolean {
  return (
    item.role === 'document' ||
    item.kind === 'file-document' ||
    item.kind === 'file-draft'
  );
}

/** Nodes that can be a content-pane location (show their children). */
export function isExplorerLocation(item: ExplorerItem): boolean {
  if (item.disabled) {
    return false;
  }
  if (item.role === 'site' || item.role === 'media-library' || item.role === 'trash') {
    return true;
  }
  return isExplorerFolder(item);
}

/** Whether this node may show a tree disclosure (details/summary). */
export function isExplorerTreeExpandable(item: ExplorerItem): boolean {
  return explorerTreeChildren(item).length > 0;
}

/**
 * Children shown under a tree branch: folders only.
 * Root rows (site, media library, trash, settings) are rendered by the caller;
 * documents and media assets appear only in the content pane.
 */
export function explorerTreeChildren(item: ExplorerItem): ExplorerItem[] {
  if (item.expandable === false || item.disabled) {
    return [];
  }
  return (item.children ?? []).filter(isExplorerFolder);
}

/** Content-pane listing for the selected tree node. */
export function explorerContentItems(selected: ExplorerItem | null | undefined): ExplorerItem[] {
  if (!selected || selected.disabled) {
    return [];
  }
  return selected.children ?? [];
}

/** Find a node by id in a forest. */
export function findExplorerItem(
  roots: ExplorerItem[],
  id: string | null | undefined,
): ExplorerItem | null {
  if (!id) {
    return null;
  }
  for (const node of roots) {
    if (node.id === id) {
      return node;
    }
    const nested = findExplorerItem(node.children ?? [], id);
    if (nested) {
      return nested;
    }
  }
  return null;
}
