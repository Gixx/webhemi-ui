import type { DragEvent as ReactDragEvent } from 'react';

export const EXPLORER_DND_MIME = 'application/x-webhemi-explorer-ids';

/** Fallback when browsers clear custom MIME data outside a real user gesture. */
let activeDragIds: string[] = [];

export function beginExplorerDrag(ids: string[], dataTransfer: DataTransfer | null | undefined): void {
  // Always stash ids first — synthetic drag events (Chromatic / RTL) may reject setData.
  activeDragIds = [...ids];
  if (!dataTransfer) {
    return;
  }
  try {
    dataTransfer.effectAllowed = 'move';
    dataTransfer.setData(EXPLORER_DND_MIME, JSON.stringify(ids));
    dataTransfer.setData('text/plain', ids.join('\n'));
  } catch {
    // activeDragIds remains the source of truth for drop.
  }
}

export function endExplorerDrag(): void {
  activeDragIds = [];
}

export function readExplorerDragIds(event: ReactDragEvent | DragEvent): string[] {
  const data = event.dataTransfer;
  if (!data) {
    return [...activeDragIds];
  }
  try {
    const fromMime = parseJsonIds(data.getData(EXPLORER_DND_MIME));
    if (fromMime.length > 0) {
      return fromMime;
    }
    const fromText = data
      .getData('text/plain')
      .split('\n')
      .map((id) => id.trim())
      .filter(Boolean);
    if (fromText.length > 0) {
      return fromText;
    }
  } catch {
    // getData may throw outside a real drop gesture.
  }
  return [...activeDragIds];
}

function parseJsonIds(raw: string): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
