import { getDesktopWorkSize } from './geometry';

/** No top-edge resize: title-bar drag stays uncontested (admin98). */
export const RESIZE_EDGES = ['e', 'w', 's', 'se', 'sw'] as const;

export type ResizeEdge = (typeof RESIZE_EDGES)[number];

export const RESIZE_CURSORS: Record<ResizeEdge, string> = {
  e: 'ew-resize',
  w: 'ew-resize',
  s: 'ns-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

export const SHELL_MIN_WIDTH = 500;
export const SHELL_MIN_HEIGHT = 340;

export const DEFAULT_WINDOW_SIZE = {
  'control-panel': { width: 600, height: 380 },
  site: { width: 640, height: 440 },
  'site-settings': { width: 480, height: 520 },
  sites: { width: 560, height: 480 },
  hosts: { width: 640, height: 480 },
  settings: { width: 420, height: 400 },
  permissions: { width: 560, height: 480 },
  roles: { width: 640, height: 480 },
  /** Height is unused for Users (content-sized shell); width is applied. */
  users: { width: 480, height: 420 },
} as const;

export type ShellBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function computeResizeBounds(
  dashboard: HTMLElement,
  edge: ResizeEdge,
  start: ShellBounds,
  pointer: { clientX: number; clientY: number; startX: number; startY: number },
  minWidth = SHELL_MIN_WIDTH,
  minHeight = SHELL_MIN_HEIGHT,
): ShellBounds {
  const dx = pointer.clientX - pointer.startX;
  const dy = pointer.clientY - pointer.startY;
  let nextLeft = start.left;
  let nextTop = start.top;
  let nextWidth = start.width;
  let nextHeight = start.height;

  if (edge.includes('e')) {
    nextWidth = start.width + dx;
  }
  if (edge.includes('w')) {
    nextWidth = start.width - dx;
    nextLeft = start.left + dx;
  }
  if (edge.includes('s')) {
    nextHeight = start.height + dy;
  }

  if (nextWidth < minWidth) {
    if (edge.includes('w')) {
      nextLeft = start.left + (start.width - minWidth);
    }
    nextWidth = minWidth;
  }
  if (nextHeight < minHeight) {
    nextHeight = minHeight;
  }

  const work = getDesktopWorkSize(dashboard);
  const maxWidth = Math.max(minWidth, work.width - nextLeft);
  const maxHeight = Math.max(minHeight, work.height - nextTop);
  nextWidth = Math.min(nextWidth, maxWidth);
  nextHeight = Math.min(nextHeight, maxHeight);

  if (edge.includes('w')) {
    const maxLeft = start.left + start.width - minWidth;
    nextLeft = Math.max(0, Math.min(nextLeft, maxLeft));
    nextWidth = start.left + start.width - nextLeft;
    nextWidth = Math.min(nextWidth, work.width - nextLeft);
  }

  nextLeft = Math.max(0, Math.min(nextLeft, Math.max(0, work.width - nextWidth)));
  nextTop = Math.max(0, Math.min(nextTop, Math.max(0, work.height - nextHeight)));

  return {
    left: nextLeft,
    top: nextTop,
    width: nextWidth,
    height: nextHeight,
  };
}
