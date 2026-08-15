/** Stable shell window ids (DOM `id` + `data-shell-window`). */
export const CONTROL_PANEL_WINDOW_ID = 'control-panel';
export const SITES_WINDOW_ID = 'sites';
export const HOSTS_WINDOW_ID = 'hosts';
export const SETTINGS_WINDOW_ID = 'settings';
export const PERMISSIONS_WINDOW_ID = 'permissions';
export const ROLES_WINDOW_ID = 'roles';
export const USERS_WINDOW_ID = 'users';

export function siteWindowId(siteId: number): string {
  return `site-${siteId}`;
}

export function siteSettingsWindowId(siteId: number): string {
  return `site-${siteId}-settings`;
}

export function documentEditorWindowId(siteId: number, nodeId: number): string {
  return `site-${siteId}-doc-${nodeId}`;
}

export function parseSiteWindowId(id: string): number | null {
  const match = /^site-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function parseSiteSettingsWindowId(id: string): number | null {
  const match = /^site-(\d+)-settings$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function parseDocumentEditorWindowId(
  id: string,
): { siteId: number; nodeId: number } | null {
  const match = /^site-(\d+)-doc-(\d+)$/.exec(id);
  if (!match) {
    return null;
  }
  return { siteId: Number(match[1]), nodeId: Number(match[2]) };
}

export type ShellWindowKind =
  | 'control-panel'
  | 'site'
  | 'site-settings'
  | 'document-editor'
  | 'sites'
  | 'hosts'
  | 'settings'
  | 'permissions'
  | 'roles'
  | 'users';

/**
 * One open desktop shell window.
 */
export type ShellWindowState = {
  id: string;
  kind: ShellWindowKind;
  title: string;
  /** Present when `kind === 'site'` or `site-settings` or `document-editor`. */
  siteId?: number;
  /** Present when `kind === 'document-editor'`. */
  contentNodeId?: number;
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
