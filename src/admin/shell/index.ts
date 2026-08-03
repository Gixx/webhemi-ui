export {
  CONTROL_PANEL_WINDOW_ID,
  siteWindowId,
  parseSiteWindowId,
  type ShellWindowKind,
  type ShellWindowState,
  type ShellPlacement,
} from './types';
export { DesktopWindow, type DesktopWindowProps } from './DesktopWindow';
export {
  DRAG_THRESHOLD_PX,
  clampDesktopPosition,
  findShellProductWindow,
  findShellTitleBar,
} from './geometry';
