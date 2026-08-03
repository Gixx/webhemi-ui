/** Stable shell window ids (DOM `id` + `data-shell-window`). */
export const CONTROL_PANEL_WINDOW_ID = 'control-panel';

export function siteWindowId(siteId: number): string {
  return `site-${siteId}`;
}

export function parseSiteWindowId(id: string): number | null {
  const match = /^site-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export type ShellWindowKind = 'control-panel' | 'site';

/**
 * One open desktop shell window.
 * Minimize / maximize / size fields are reserved for later Phase 5 slices.
 */
export type ShellWindowState = {
  id: string;
  kind: ShellWindowKind;
  title: string;
  /** Present when `kind === 'site'`. */
  siteId?: number;
  left: number;
  top: number;
  z: number;
  width?: number;
  height?: number;
  minimized: boolean;
  maximized: boolean;
};

export type ShellPlacement = {
  left: number;
  top: number;
  z: number;
};
