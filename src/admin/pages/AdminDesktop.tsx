import { useRef, useState } from 'react';
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
  className?: string;
};

type DesktopShellState = {
  windows: ShellWindowState[];
  activeId: string | null;
};

const CASCADE_ORIGIN = { left: 48, top: 24 };
const CASCADE_STEP = 28;

function topWindowId(windows: ShellWindowState[]): string | null {
  return windows.reduce<ShellWindowState | null>(
    (best, win) => (!best || win.z > best.z ? win : best),
    null,
  )?.id ?? null;
}

/**
 * Admin desktop: site icons + Control Panel; openable shell windows.
 * Phase 5 Slice A–B: registry + active/inactive + title-bar drag. Taskbar / persistence follow.
 */
export function AdminDesktop({
  sites = [],
  explorerTreeForSite = buildEmptySiteExplorerTree,
  className,
}: AdminDesktopProps) {
  const nextZRef = useRef(10);
  const cascadeRef = useRef(0);
  const [shell, setShell] = useState<DesktopShellState>({
    windows: [],
    activeId: null,
  });

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
      if (!target) {
        return prev;
      }
      if (target.z === nextZRef.current && prev.activeId === id) {
        return prev;
      }
      const z =
        target.z === nextZRef.current ? target.z : raiseZ();
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
        activeId: prev.activeId === id ? topWindowId(windows) : prev.activeId,
      };
    });
  };

  const openControlPanel = () => {
    setShell((prev) => {
      const existing = prev.windows.find((win) => win.id === CONTROL_PANEL_WINDOW_ID);
      if (existing) {
        const z = existing.z === nextZRef.current ? existing.z : raiseZ();
        return {
          activeId: CONTROL_PANEL_WINDOW_ID,
          windows: prev.windows.map((win) =>
            win.id === CONTROL_PANEL_WINDOW_ID ? { ...win, z } : win,
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
        const z = existing.z === nextZRef.current ? existing.z : raiseZ();
        return {
          activeId: id,
          windows: prev.windows.map((win) => (win.id === id ? { ...win, z } : win)),
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
        const active = win.id === shell.activeId;

        if (win.kind === 'control-panel') {
          return (
            <DesktopWindow
              key={win.id}
              windowId={win.id}
              left={win.left}
              top={win.top}
              zIndex={win.z}
              onActivate={() => activateWindow(win.id)}
              onPositionChange={(left, top) => moveWindow(win.id, left, top)}
            >
              <ControlPanel
                inactive={!active}
                onClose={() => closeWindow(win.id)}
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
            onActivate={() => activateWindow(win.id)}
            onPositionChange={(left, top) => moveWindow(win.id, left, top)}
          >
            <SiteFileExplorer
              inactive={!active}
              title={win.title}
              titleIcon="site"
              tree={explorerTreeForSite(site)}
              onClose={() => closeWindow(win.id)}
              width={640}
              paneHeight={360}
            />
          </DesktopWindow>
        );
      })}
    </div>
  );
}
