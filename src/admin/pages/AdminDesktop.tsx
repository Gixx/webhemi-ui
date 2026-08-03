import { useCallback, useRef, useState } from 'react';
import {
  buildEmptySiteExplorerTree,
  SiteFileExplorer,
  type ExplorerItem,
} from '../bricks/FileExplorerWindow';
import { SystemIcon } from '../chrome/SystemIcon';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { cn } from '../../lib/cn';
import {
  CONTROL_PANEL_WINDOW_ID,
  DesktopWindow,
  siteWindowId,
  StartMenu,
  Taskbar,
  type ShellWindowState,
} from '../shell';

export type DesktopSite = {
  id: number;
  name: string;
  slug?: string;
  enabled?: boolean;
};

export type AdminDesktopProps = {
  sites?: DesktopSite[];
  /**
   * Forest for a site explorer window. Defaults to empty product roots
   * (`buildEmptySiteExplorerTree`) until PHP supplies real data.
   */
  explorerTreeForSite?: (site: DesktopSite) => ExplorerItem[];
  /** Logout URL for Start → Logout (Twig: `path('app_logout')`). */
  logoutHref?: string;
  className?: string;
};

type DesktopShellState = {
  windows: ShellWindowState[];
  activeId: string | null;
};

const CASCADE_ORIGIN = { left: 48, top: 24 };
const CASCADE_STEP = 28;

function topVisibleWindowId(windows: ShellWindowState[]): string | null {
  return (
    windows
      .filter((win) => !win.minimized)
      .reduce<ShellWindowState | null>(
        (best, win) => (!best || win.z > best.z ? win : best),
        null,
      )?.id ?? null
  );
}

/**
 * Admin desktop: site icons + Control Panel; openable shell windows.
 * Phase 5 Slice A–D: registry, drag, taskbar + minimize, Start menu.
 */
export function AdminDesktop({
  sites = [],
  explorerTreeForSite = buildEmptySiteExplorerTree,
  logoutHref,
  className,
}: AdminDesktopProps) {
  const nextZRef = useRef(10);
  const cascadeRef = useRef(0);
  const [shell, setShell] = useState<DesktopShellState>({
    windows: [],
    activeId: null,
  });
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const closeStartMenu = useCallback(() => setStartMenuOpen(false), []);
  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen((open) => !open);
  }, []);

  const allocatePlacement = () => {
    const index = cascadeRef.current;
    cascadeRef.current += 1;
    nextZRef.current += 1;
    return {
      left: CASCADE_ORIGIN.left + index * CASCADE_STEP,
      top: CASCADE_ORIGIN.top + index * CASCADE_STEP,
      z: nextZRef.current,
    };
  };

  const raiseZ = () => {
    nextZRef.current += 1;
    return nextZRef.current;
  };

  const activateWindow = (id: string) => {
    setShell((prev) => {
      const target = prev.windows.find((win) => win.id === id);
      if (!target || target.minimized) {
        return prev;
      }
      if (target.z === nextZRef.current && prev.activeId === id) {
        return prev;
      }
      const z = target.z === nextZRef.current ? target.z : raiseZ();
      return {
        activeId: id,
        windows: prev.windows.map((win) =>
          win.id === id ? { ...win, z } : win,
        ),
      };
    });
  };

  const closeWindow = (id: string) => {
    setShell((prev) => {
      const windows = prev.windows.filter((win) => win.id !== id);
      return {
        windows,
        activeId:
          prev.activeId === id ? topVisibleWindowId(windows) : prev.activeId,
      };
    });
  };

  const minimizeWindow = (id: string) => {
    setShell((prev) => {
      let windows = prev.windows.map((win) =>
        win.id === id ? { ...win, minimized: true } : win,
      );
      let activeId =
        prev.activeId === id ? topVisibleWindowId(windows) : prev.activeId;
      if (activeId && activeId !== prev.activeId) {
        const z = raiseZ();
        windows = windows.map((win) =>
          win.id === activeId ? { ...win, z } : win,
        );
      }
      return { windows, activeId };
    });
  };

  const restoreAndActivate = (id: string) => {
    setShell((prev) => {
      const target = prev.windows.find((win) => win.id === id);
      if (!target) {
        return prev;
      }
      const z =
        !target.minimized && target.z === nextZRef.current
          ? target.z
          : raiseZ();
      return {
        activeId: id,
        windows: prev.windows.map((win) =>
          win.id === id ? { ...win, minimized: false, z } : win,
        ),
      };
    });
  };

  const handleTaskClick = (id: string) => {
    const target = shell.windows.find((win) => win.id === id);
    if (!target) {
      return;
    }
    if (!target.minimized && shell.activeId === id) {
      minimizeWindow(id);
      return;
    }
    restoreAndActivate(id);
  };

  const openControlPanel = () => {
    setShell((prev) => {
      const existing = prev.windows.find((win) => win.id === CONTROL_PANEL_WINDOW_ID);
      if (existing) {
        const z =
          !existing.minimized && existing.z === nextZRef.current
            ? existing.z
            : raiseZ();
        return {
          activeId: CONTROL_PANEL_WINDOW_ID,
          windows: prev.windows.map((win) =>
            win.id === CONTROL_PANEL_WINDOW_ID
              ? { ...win, z, minimized: false }
              : win,
          ),
        };
      }
      const place = allocatePlacement();
      return {
        activeId: CONTROL_PANEL_WINDOW_ID,
        windows: [
          ...prev.windows,
          {
            id: CONTROL_PANEL_WINDOW_ID,
            kind: 'control-panel',
            title: 'Control Panel',
            left: place.left,
            top: place.top,
            z: place.z,
            minimized: false,
            maximized: false,
          },
        ],
      };
    });
  };

  const openSite = (site: DesktopSite) => {
    const id = siteWindowId(site.id);
    setShell((prev) => {
      const existing = prev.windows.find((win) => win.id === id);
      if (existing) {
        const z =
          !existing.minimized && existing.z === nextZRef.current
            ? existing.z
            : raiseZ();
        return {
          activeId: id,
          windows: prev.windows.map((win) =>
            win.id === id ? { ...win, z, minimized: false } : win,
          ),
        };
      }
      const place = allocatePlacement();
      return {
        activeId: id,
        windows: [
          ...prev.windows,
          {
            id,
            kind: 'site',
            title: site.name,
            siteId: site.id,
            left: place.left,
            top: place.top,
            z: place.z,
            minimized: false,
            maximized: false,
          },
        ],
      };
    });
  };

  const moveWindow = (id: string, left: number, top: number) => {
    setShell((prev) => ({
      ...prev,
      windows: prev.windows.map((win) =>
        win.id === id ? { ...win, left, top } : win,
      ),
    }));
  };

  return (
    <div className={cn('dashboard', className)}>
      <div className="icon-list">
        {sites.map((site) => (
          <SystemIcon
            key={site.id}
            kind="site"
            label={site.name}
            labelTone="light"
            onOpen={() => openSite(site)}
          />
        ))}
        <SystemIcon
          kind="control-panel"
          label="Control Panel"
          labelTone="light"
          onOpen={openControlPanel}
        />
      </div>

      {shell.windows.map((win) => {
        const active = win.id === shell.activeId && !win.minimized;

        if (win.kind === 'control-panel') {
          return (
            <DesktopWindow
              key={win.id}
              windowId={win.id}
              left={win.left}
              top={win.top}
              zIndex={win.z}
              className={cn(win.minimized && 'is-minimized')}
              dragDisabled={win.minimized}
              onActivate={() => activateWindow(win.id)}
              onPositionChange={(left, top) => moveWindow(win.id, left, top)}
            >
              <ControlPanel
                inactive={!active}
                onClose={() => closeWindow(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onActivate={() => activateWindow(win.id)}
              />
            </DesktopWindow>
          );
        }

        const site = sites.find((entry) => entry.id === win.siteId) ?? {
          id: win.siteId ?? 0,
          name: win.title,
        };

        return (
          <DesktopWindow
            key={win.id}
            windowId={win.id}
            left={win.left}
            top={win.top}
            zIndex={win.z}
            className={cn(win.minimized && 'is-minimized')}
            dragDisabled={win.minimized}
            onActivate={() => activateWindow(win.id)}
            onPositionChange={(left, top) => moveWindow(win.id, left, top)}
          >
            <SiteFileExplorer
              inactive={!active}
              title={win.title}
              titleIcon="site"
              tree={explorerTreeForSite(site)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              width={640}
              paneHeight={360}
            />
          </DesktopWindow>
        );
      })}

      <Taskbar
        windows={shell.windows}
        activeId={shell.activeId}
        onTaskClick={handleTaskClick}
        onMenuClick={toggleStartMenu}
        menuExpanded={startMenuOpen}
        startMenu={
          <StartMenu
            open={startMenuOpen}
            onClose={closeStartMenu}
            onOpenControlPanel={openControlPanel}
            logoutHref={logoutHref}
          />
        }
      />
    </div>
  );
}
