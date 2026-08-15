import type { AdminApiExplorerItem } from '../../api/types';
import type { ExplorerItem, ExplorerNodeRole } from './types';
import type { SystemIconKind } from '../../chrome/SystemIcon';

const NODE_ID = /^node-(\d+)$/;
const MEDIA_ID = /^media-(\d+)$/;

export type ExplorerEntityRef =
  | { type: 'node'; id: number }
  | { type: 'media'; id: number };

export function parseExplorerEntityId(id: string): ExplorerEntityRef | null {
  const node = NODE_ID.exec(id);
  if (node) {
    return { type: 'node', id: Number(node[1]) };
  }
  const media = MEDIA_ID.exec(id);
  if (media) {
    return { type: 'media', id: Number(media[1]) };
  }
  return null;
}

export function slugifyExplorerTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

/** Map PHP explorer DTO → UI forest (kinds/roles already aligned). */
export function mapApiExplorerForest(items: AdminApiExplorerItem[]): ExplorerItem[] {
  return items.map(mapApiExplorerItem);
}

function mapApiExplorerItem(item: AdminApiExplorerItem): ExplorerItem {
  return {
    id: item.id,
    label: item.label,
    kind: item.kind as SystemIconKind,
    role: item.role as ExplorerNodeRole | undefined,
    typeLabel: item.typeLabel,
    sizeBytes: item.sizeBytes,
    modifiedAt: item.modifiedAt,
    hidden: item.hidden,
    publication: item.publication,
    expandable: item.expandable,
    disabled: item.disabled,
    children: item.children?.map(mapApiExplorerItem),
  };
}

/**
 * Resolve API parentId + tree for creating/moving under the current location.
 * Synthetic roots → null parent; folders → numeric node id.
 */
export function apiParentContext(
  location: ExplorerItem | null,
): { tree: 'site' | 'media'; parentId: number | null } | null {
  if (!location || location.disabled) {
    return null;
  }
  if (location.role === 'trash' || location.role === 'settings') {
    return null;
  }
  if (location.role === 'site') {
    return { tree: 'site', parentId: null };
  }
  if (location.role === 'media-library') {
    return { tree: 'media', parentId: null };
  }
  if (location.role === 'folder') {
    const ref = parseExplorerEntityId(location.id);
    if (!ref || ref.type !== 'node') {
      return null;
    }
    // Media-tree folders live under media-library; site folders under site.
    // Detect via id path is unreliable; caller may pass tree hint. Default site;
    // SiteFileExplorer overrides using findExplorerParent chain.
    return { tree: 'site', parentId: ref.id };
  }
  return null;
}

/** Walk parents to see if a folder sits under the media-library root. */
export function isUnderMediaLibrary(
  forest: ExplorerItem[],
  itemId: string,
  findParent: (forest: ExplorerItem[], id: string) => ExplorerItem | null,
): boolean {
  let current: ExplorerItem | null = findParent(forest, itemId);
  while (current) {
    if (current.role === 'media-library') {
      return true;
    }
    if (current.role === 'site') {
      return false;
    }
    current = findParent(forest, current.id);
  }
  return false;
}
