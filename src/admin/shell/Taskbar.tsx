import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { ShellWindowState } from './types';
import { TaskbarClock } from './TaskbarClock';

export type TaskbarProps = {
  windows: ShellWindowState[];
  activeId: string | null;
  onTaskClick: (windowId: string) => void;
  /** Slice D wires Start menu; until then Menu is inert chrome. */
  onMenuClick?: () => void;
  menuExpanded?: boolean;
  /** Optional Start menu panel (rendered above the toolbar body). */
  startMenu?: ReactNode;
  className?: string;
};

function taskClassName(win: ShellWindowState, active: boolean): string {
  return cn(
    'task',
    win.kind === 'control-panel' && 'control-panel',
    win.kind === 'site' && 'site',
    win.kind === 'sites' && 'sites',
    win.kind === 'hosts' && 'hosts',
    win.kind === 'settings' && 'settings',
    win.kind === 'permissions' && 'permissions',
    active && 'active',
  );
}

/**
 * Fixed bottom taskbar (`#toolbar`): Menu, task buttons, clock.
 * Start menu popup is optional (Phase 5 Slice D).
 */
export function Taskbar({
  windows,
  activeId,
  onTaskClick,
  onMenuClick,
  menuExpanded = false,
  startMenu,
  className,
}: TaskbarProps) {
  return (
    <div id="toolbar" className={cn('window', className)}>
      {startMenu}
      <div className="window-body">
        <button
          type="button"
          className="menu"
          aria-expanded={menuExpanded}
          aria-controls="start-menu"
          aria-haspopup="menu"
          onClick={onMenuClick}
        >
          Menu
        </button>
        <div className="task-buttons">
          {windows.map((win) => {
            const pressed = win.id === activeId && !win.minimized;
            return (
              <button
                key={win.id}
                type="button"
                className={taskClassName(win, pressed)}
                data-window={win.id}
                aria-pressed={pressed}
                title={win.title}
                onClick={() => onTaskClick(win.id)}
              >
                <span className="task-title">{win.title}</span>
              </button>
            );
          })}
        </div>
        <TaskbarClock />
      </div>
    </div>
  );
}
