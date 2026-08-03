import { useRef, useState } from 'react';
import {
  buildEmptySiteExplorerTree,
  SiteFileExplorer,
  type ExplorerItem,
} from '../bricks/FileExplorerWindow';
import { SystemIcon } from '../chrome/SystemIcon';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { cn } from '../../lib/cn';

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

type OpenSiteWindow = {
  id: number;
  name: string;
  left: number;
  top: number;
  z: number;
};

type ControlPanelWindow = {
  left: number;
  top: number;
  z: number;
};

const CASCADE_ORIGIN = { left: 48, top: 24 };
const CASCADE_STEP = 28;

/**
 * Phase 4 admin desktop: site icons + Control Panel icon; openable windows.
 * Site open → FileExplorer; drag / taskbar / persistence = Phase 5.
 */
export function AdminDesktop({
  sites = [],
  explorerTreeForSite = buildEmptySiteExplorerTree,
  className,
}: AdminDesktopProps) {
  const nextZRef = useRef(10);
  const cascadeRef = useRef(0);
  const [controlPanel, setControlPanel] = useState<ControlPanelWindow | null>(null);
  const [openSites, setOpenSites] = useState<OpenSiteWindow[]>([]);

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

  const openControlPanel = () => {
    setControlPanel((prev) => {
      if (prev) {
        return { ...prev, z: raiseZ() };
      }
      return allocatePlacement();
    });
  };

  const closeControlPanel = () => setControlPanel(null);

  const openSite = (site: DesktopSite) => {
    setOpenSites((prev) => {
      const existing = prev.find((w) => w.id === site.id);
      if (existing) {
        const z = raiseZ();
        return prev.map((w) => (w.id === site.id ? { ...w, z } : w));
      }
      const place = allocatePlacement();
      return [...prev, { id: site.id, name: site.name, ...place }];
    });
  };

  const closeSite = (id: number) => {
    setOpenSites((prev) => prev.filter((w) => w.id !== id));
  };

  const activateSite = (id: number) => {
    setOpenSites((prev) => {
      const target = prev.find((w) => w.id === id);
      if (!target || target.z === nextZRef.current) {
        return prev;
      }
      const z = raiseZ();
      return prev.map((w) => (w.id === id ? { ...w, z } : w));
    });
  };

  const activateControlPanel = () => {
    setControlPanel((prev) => {
      if (!prev || prev.z === nextZRef.current) {
        return prev;
      }
      return { ...prev, z: raiseZ() };
    });
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

      {controlPanel ? (
        <div
          className="desktop-window"
          style={{ left: controlPanel.left, top: controlPanel.top, zIndex: controlPanel.z }}
        >
          <ControlPanel onClose={closeControlPanel} onActivate={activateControlPanel} />
        </div>
      ) : null}

      {openSites.map((win) => {
        const site = sites.find((entry) => entry.id === win.id) ?? {
          id: win.id,
          name: win.name,
        };
        return (
          <div
            key={win.id}
            className="desktop-window"
            style={{ left: win.left, top: win.top, zIndex: win.z }}
            onMouseDown={() => activateSite(win.id)}
          >
            <SiteFileExplorer
              title={win.name}
              titleIcon="site"
              tree={explorerTreeForSite(site)}
              onClose={() => closeSite(win.id)}
              width={640}
              paneHeight={360}
            />
          </div>
        );
      })}
    </div>
  );
}
