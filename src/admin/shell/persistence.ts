import {
  CONTROL_PANEL_WINDOW_ID,
  HOSTS_WINDOW_ID,
  PERMISSIONS_WINDOW_ID,
  ROLES_WINDOW_ID,
  SETTINGS_WINDOW_ID,
  SITES_WINDOW_ID,
  parseSiteWindowId,
  type ShellWindowKind,
  type ShellWindowState,
} from './types';
import { DEFAULT_WINDOW_SIZE } from './resize';

export const DESKTOP_WINDOWS_STORAGE_KEY = 'webhemi.admin.desktop.windows.v1';

export type PersistedWindowEntry = {
  id: string;
  kind: ShellWindowKind;
  title: string;
  siteId?: number;
  left: number;
  top: number;
  z: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  restore?: ShellWindowState['restore'];
  /** Closed windows keep geometry for the next open. */
  closed: boolean;
};

export type PersistedDesktopState = {
  v: 1;
  activeId: string | null;
  nextZ: number;
  cascade: number;
  entries: Record<string, PersistedWindowEntry>;
};

export type DesktopPersistenceSite = {
  id: number;
  name: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseRestore(
  value: unknown,
): ShellWindowState['restore'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const restore = value as Record<string, unknown>;
  if (
    !isFiniteNumber(restore.left) ||
    !isFiniteNumber(restore.top) ||
    !isFiniteNumber(restore.width) ||
    !isFiniteNumber(restore.height)
  ) {
    return undefined;
  }
  return {
    left: restore.left,
    top: restore.top,
    width: restore.width,
    height: restore.height,
  };
}

function parseEntry(id: string, value: unknown): PersistedWindowEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const kind =
    raw.kind === 'site' ||
    raw.kind === 'control-panel' ||
    raw.kind === 'sites' ||
    raw.kind === 'hosts' ||
    raw.kind === 'settings' ||
    raw.kind === 'permissions' ||
    raw.kind === 'roles'
      ? raw.kind
      : null;
  if (!kind) {
    return null;
  }
  if (
    !isFiniteNumber(raw.left) ||
    !isFiniteNumber(raw.top) ||
    !isFiniteNumber(raw.z) ||
    !isFiniteNumber(raw.width) ||
    !isFiniteNumber(raw.height)
  ) {
    return null;
  }
  const siteId = kind === 'site' ? parseSiteWindowId(id) : undefined;
  if (kind === 'site' && siteId === null) {
    return null;
  }
  if (kind === 'sites' && id !== SITES_WINDOW_ID) {
    return null;
  }
  if (kind === 'hosts' && id !== HOSTS_WINDOW_ID) {
    return null;
  }
  if (kind === 'settings' && id !== SETTINGS_WINDOW_ID) {
    return null;
  }
  if (kind === 'permissions' && id !== PERMISSIONS_WINDOW_ID) {
    return null;
  }
  if (kind === 'roles' && id !== ROLES_WINDOW_ID) {
    return null;
  }
  if (kind === 'control-panel' && id !== CONTROL_PANEL_WINDOW_ID) {
    return null;
  }
  return {
    id,
    kind,
    title: typeof raw.title === 'string' ? raw.title : id,
    siteId: siteId ?? undefined,
    left: raw.left,
    top: raw.top,
    z: raw.z,
    width: raw.width,
    height: raw.height,
    minimized: Boolean(raw.minimized),
    maximized: Boolean(raw.maximized),
    restore: parseRestore(raw.restore),
    closed: Boolean(raw.closed),
  };
}

/** Read persisted desktop state (empty object on miss / corrupt data). */
export function loadPersistedDesktop(
  storageKey: string = DESKTOP_WINDOWS_STORAGE_KEY,
): PersistedDesktopState | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const data = parsed as Record<string, unknown>;
    if (data.v !== 1 || !data.entries || typeof data.entries !== 'object') {
      return null;
    }
    const entries: Record<string, PersistedWindowEntry> = {};
    for (const [id, value] of Object.entries(
      data.entries as Record<string, unknown>,
    )) {
      const entry = parseEntry(id, value);
      if (entry) {
        entries[id] = entry;
      }
    }
    return {
      v: 1,
      activeId: typeof data.activeId === 'string' ? data.activeId : null,
      nextZ: isFiniteNumber(data.nextZ) ? data.nextZ : 10,
      cascade: isFiniteNumber(data.cascade) ? data.cascade : 0,
      entries,
    };
  } catch {
    return null;
  }
}

export function savePersistedDesktop(
  state: PersistedDesktopState,
  storageKey: string = DESKTOP_WINDOWS_STORAGE_KEY,
): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function entryFromWindow(
  win: ShellWindowState,
  closed = false,
): PersistedWindowEntry {
  return {
    id: win.id,
    kind: win.kind,
    title: win.title,
    siteId: win.siteId,
    left: win.left,
    top: win.top,
    z: win.z,
    width: win.width,
    height: win.height,
    minimized: win.minimized,
    maximized: win.maximized,
    restore: win.restore,
    closed,
  };
}

export function windowFromEntry(entry: PersistedWindowEntry): ShellWindowState {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    siteId: entry.siteId,
    left: entry.left,
    top: entry.top,
    z: entry.z,
    width: entry.width,
    height: entry.height,
    minimized: entry.minimized,
    maximized: entry.maximized,
    restore: entry.restore,
  };
}

/**
 * Hydrate open windows from storage for the current site list.
 * Drops unknown site ids; keeps control-panel / sites / hosts / settings when present and open.
 */
export function hydrateDesktopFromPersistence(
  persisted: PersistedDesktopState | null,
  sites: DesktopPersistenceSite[],
): {
  windows: ShellWindowState[];
  activeId: string | null;
  nextZ: number;
  cascade: number;
} {
  if (!persisted) {
    return { windows: [], activeId: null, nextZ: 10, cascade: 0 };
  }

  const siteIds = new Set(sites.map((site) => site.id));
  const siteName = new Map(sites.map((site) => [site.id, site.name]));
  const windows: ShellWindowState[] = [];

  for (const entry of Object.values(persisted.entries)) {
    if (entry.closed) {
      continue;
    }
    if (entry.kind === 'control-panel' && entry.id === CONTROL_PANEL_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'sites' && entry.id === SITES_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'hosts' && entry.id === HOSTS_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'settings' && entry.id === SETTINGS_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'permissions' && entry.id === PERMISSIONS_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'roles' && entry.id === ROLES_WINDOW_ID) {
      windows.push(windowFromEntry(entry));
      continue;
    }
    if (entry.kind === 'site' && entry.siteId != null && siteIds.has(entry.siteId)) {
      windows.push({
        ...windowFromEntry(entry),
        title: siteName.get(entry.siteId) ?? entry.title,
      });
    }
  }

  windows.sort((a, b) => a.z - b.z);

  const openIds = new Set(windows.map((win) => win.id));
  const activeId =
    persisted.activeId && openIds.has(persisted.activeId)
      ? persisted.activeId
      : windows.reduce<ShellWindowState | null>(
          (best, win) => (!best || win.z > best.z ? win : best),
          null,
        )?.id ?? null;

  return {
    windows,
    activeId,
    nextZ: Math.max(persisted.nextZ, ...windows.map((win) => win.z), 10),
    cascade: persisted.cascade,
  };
}

/** Merge live open windows into the previous entries map (closed keep geometry). */
export function buildPersistedDesktopState(
  previous: PersistedDesktopState | null,
  windows: ShellWindowState[],
  activeId: string | null,
  nextZ: number,
  cascade: number,
): PersistedDesktopState {
  const entries: Record<string, PersistedWindowEntry> = {
    ...(previous?.entries ?? {}),
  };

  const openIds = new Set(windows.map((win) => win.id));

  for (const [id, entry] of Object.entries(entries)) {
    if (!openIds.has(id)) {
      entries[id] = { ...entry, closed: true };
    }
  }

  for (const win of windows) {
    entries[win.id] = entryFromWindow(win, false);
  }

  return {
    v: 1,
    activeId,
    nextZ,
    cascade,
    entries,
  };
}

export function defaultSizeForKind(kind: ShellWindowKind): {
  width: number;
  height: number;
} {
  if (kind === 'control-panel') {
    return DEFAULT_WINDOW_SIZE['control-panel'];
  }
  if (kind === 'sites') {
    return DEFAULT_WINDOW_SIZE.sites;
  }
  if (kind === 'hosts') {
    return DEFAULT_WINDOW_SIZE.hosts;
  }
  if (kind === 'settings') {
    return DEFAULT_WINDOW_SIZE.settings;
  }
  if (kind === 'permissions') {
    return DEFAULT_WINDOW_SIZE.permissions;
  }
  if (kind === 'roles') {
    return DEFAULT_WINDOW_SIZE.roles;
  }
  return DEFAULT_WINDOW_SIZE.site;
}

/** Prefer saved closed-window geometry when reopening. */
export function geometryFromPersistence(
  persisted: PersistedDesktopState | null,
  id: string,
  kind: ShellWindowKind,
): Pick<ShellWindowState, 'left' | 'top' | 'width' | 'height' | 'z'> | null {
  const entry = persisted?.entries[id];
  if (!entry || entry.kind !== kind) {
    return null;
  }
  return {
    left: entry.left,
    top: entry.top,
    width: entry.width,
    height: entry.height,
    z: entry.z,
  };
}
