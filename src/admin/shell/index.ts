export {
  CONTROL_PANEL_WINDOW_ID,
  HOSTS_WINDOW_ID,
  PERMISSIONS_WINDOW_ID,
  ROLES_WINDOW_ID,
  SETTINGS_WINDOW_ID,
  SITES_WINDOW_ID,
  USERS_WINDOW_ID,
  siteWindowId,
  parseSiteWindowId,
  type ShellWindowKind,
  type ShellWindowState,
  type ShellPlacement,
} from './types';
export { DesktopWindow, type DesktopWindowProps } from './DesktopWindow';
export { Taskbar, type TaskbarProps } from './Taskbar';
export { TaskbarClock } from './TaskbarClock';
export { StartMenu, type StartMenuProps } from './StartMenu';
export {
  DRAG_THRESHOLD_PX,
  TASKBAR_RESERVE_PX,
  clampDesktopPosition,
  getDesktopWorkSize,
  findShellProductWindow,
  findShellTitleBar,
} from './geometry';
export {
  RESIZE_EDGES,
  RESIZE_CURSORS,
  SHELL_MIN_WIDTH,
  SHELL_MIN_HEIGHT,
  DEFAULT_WINDOW_SIZE,
  computeResizeBounds,
  type ResizeEdge,
  type ShellBounds,
} from './resize';
export {
  DESKTOP_WINDOWS_STORAGE_KEY,
  loadPersistedDesktop,
  savePersistedDesktop,
  hydrateDesktopFromPersistence,
  buildPersistedDesktopState,
  geometryFromPersistence,
  entryFromWindow,
  windowFromEntry,
  type PersistedDesktopState,
  type PersistedWindowEntry,
  type DesktopPersistenceSite,
} from './persistence';
