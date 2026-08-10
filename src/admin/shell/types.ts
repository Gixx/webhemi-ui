/** Stable shell window ids (DOM `id` + `data-shell-window`). */
export const CONTROL_PANEL_WINDOW_ID = 'control-panel';
export const SITES_WINDOW_ID = 'sites';
export const HOSTS_WINDOW_ID = 'hosts';
export const SETTINGS_WINDOW_ID = 'settings';
export const PERMISSIONS_WINDOW_ID = 'permissions';
export const ROLES_WINDOW_ID = 'roles';

export function siteWindowId(siteId: number): string {
  return `site-${siteId}`;
}

export function parseSiteWindowId(id: string): number | null {
  const match = /^site-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export type ShellWindowKind =
  | 'control-panel'
  | 'site'
  | 'sites'
  | 'hosts'
  | 'settings'
  | 'permissions'
  | 'roles';

/**
 * One open desktop shell window.
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
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  /** Geometry before maximize. */
  restore?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export type ShellPlacement = {
  left: number;
  top: number;
  z: number;
};
