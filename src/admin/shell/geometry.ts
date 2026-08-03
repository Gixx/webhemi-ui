/** Match admin98 `DRAG_THRESHOLD_PX` — defer capture until moved past this. */
export const DRAG_THRESHOLD_PX = 4;

/** Fallback when `#toolbar` is not mounted yet (body padding reserves ~44px). */
export const TASKBAR_RESERVE_PX = 40;

/**
 * Desktop work area inside `.dashboard` (above the taskbar top edge).
 * `#toolbar` is fixed/absolute over the bottom — exclude it from drag/resize clamp.
 */
export function getDesktopWorkSize(dashboard: HTMLElement): {
  width: number;
  height: number;
} {
  const width = dashboard.clientWidth;
  const toolbar = dashboard.querySelector('#toolbar');
  if (toolbar instanceof HTMLElement) {
    const dashboardTop = dashboard.getBoundingClientRect().top;
    const toolbarTop = toolbar.getBoundingClientRect().top;
    const height = Math.max(0, Math.floor(toolbarTop - dashboardTop));
    return { width, height };
  }
  return {
    width,
    height: Math.max(0, dashboard.clientHeight - TASKBAR_RESERVE_PX),
  };
}

export function clampDesktopPosition(
  dashboard: HTMLElement,
  width: number,
  height: number,
  left: number,
  top: number,
): { left: number; top: number } {
  const work = getDesktopWorkSize(dashboard);
  const maxLeft = Math.max(0, work.width - width);
  const maxTop = Math.max(0, work.height - height);
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
