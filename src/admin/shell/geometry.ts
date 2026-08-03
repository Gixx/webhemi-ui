/** Match admin98 `DRAG_THRESHOLD_PX` — defer capture until moved past this. */
export const DRAG_THRESHOLD_PX = 4;

export function clampDesktopPosition(
  dashboard: HTMLElement,
  width: number,
  height: number,
  left: number,
  top: number,
): { left: number; top: number } {
  const maxLeft = Math.max(0, dashboard.clientWidth - width);
  const maxTop = Math.max(0, dashboard.clientHeight - height);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

/**
 * Product shell `.window` under a `DesktopWindow` host (not nested dialogs).
 */
export function findShellProductWindow(host: HTMLElement): HTMLElement | null {
  const direct = host.querySelector(':scope > .window');
  if (direct instanceof HTMLElement) {
    return direct;
  }
  const nested = host.querySelector(':scope > .site-file-explorer > .window');
  return nested instanceof HTMLElement ? nested : null;
}

export function findShellTitleBar(host: HTMLElement): HTMLElement | null {
  const win = findShellProductWindow(host);
  const titleBar = win?.querySelector(':scope > .title-bar');
  return titleBar instanceof HTMLElement ? titleBar : null;
}
