import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  buildEmptySiteExplorerTree,
  SiteFileExplorer,
  type ExplorerItem,
} from '../bricks/FileExplorerWindow';
import { SystemIcon } from '../chrome/SystemIcon';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import {
  SitesWindow,
  type SitesWindowSite,
} from '../components/SitesWindow/SitesWindow';
import {
  HostsWindow,
  type HostsWindowHost,
} from '../components/HostsWindow/HostsWindow';
import type { HostFormSavePayload } from '../components/HostsWindow/HostFormDialog';
import type { SiteFormHostOption } from '../components/SitesWindow/SiteFormDialog';
import {
  createAdminApiClient,
  isUnauthorizedResult,
  type AdminApiClient,
  type AdminApiHost,
  type AdminApiResult,
  type AdminApiSite,
} from '../api';
import { cn } from '../../lib/cn';
import {
  buildPersistedDesktopState,
  CONTROL_PANEL_WINDOW_ID,
  DEFAULT_WINDOW_SIZE,
  DESKTOP_WINDOWS_STORAGE_KEY,
  DesktopWindow,
  geometryFromPersistence,
  getDesktopWorkSize,
  HOSTS_WINDOW_ID,
  hydrateDesktopFromPersistence,
  loadPersistedDesktop,
  savePersistedDesktop,
  siteWindowId,
  SITES_WINDOW_ID,
  StartMenu,
  Taskbar,
  type PersistedDesktopState,
  type ShellBounds,
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
  /** CSRF token for `POST /admin/api/*` (`csrf_token('admin_api')`). */
  apiCsrfToken?: string;
  /** Digested chord.mp3 URL for error dialogs (`asset('admin/sounds/chord.mp3')`). */
  errorSoundUrl?: string;
  /** Digested ding.mp3 — click blocked owner while a modal is open. */
  dingSoundUrl?: string;
  /** Override API base URL (default `/admin/api`). */
  apiBaseUrl?: string;
  /** Injected `fetch` for Storybook / tests. */
  apiFetch?: typeof fetch;
  /** Full API client override (Storybook mocks). */
  sitesApi?: AdminApiClient;
  /**
   * localStorage key for window geometry. Default product key;
   * pass `false` to disable (Storybook interaction tests).
   */
  persistenceKey?: string | false;
  className?: string;
};

type DesktopShellState = {
  windows: ShellWindowState[];
  activeId: string | null;
};

const CASCADE_ORIGIN = { left: 48, top: 24 };
const CASCADE_STEP = 28;
const PERSIST_DEBOUNCE_MS = 200;

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

function toDesktopSite(site: AdminApiSite | SitesWindowSite): DesktopSite {
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    enabled: site.enabled,
  };
}

function toWindowSite(site: AdminApiSite): SitesWindowSite {
  return {
    id: site.id,
    name: site.name,
    slug: site.slug,
    enabled: site.enabled,
    hostCount: site.hostCount,
  };
}

function toWindowHost(host: AdminApiHost): HostsWindowHost {
  return {
    id: host.id,
    host: host.host,
    siteId: host.siteId,
    siteSlug: host.siteSlug,
    siteName: host.siteName,
    surface: host.surface,
    status: host.status,
    active: host.active,
  };
}

function toSiteFormHostOption(host: AdminApiHost | HostsWindowHost): SiteFormHostOption {
  return {
    id: host.id,
    host: host.host,
    siteId: host.siteId,
    siteName: host.siteName,
    status:
      host.status === 'pending' ||
      host.status === 'verified' ||
      host.status === 'active'
        ? host.status
        : 'pending',
  };
}

/**
 * Admin desktop: site icons + Control Panel; openable shell windows.
 * Phase 6: Sites + Hosts via `/admin/api`.
 */
export function AdminDesktop({
  sites = [],
  explorerTreeForSite = buildEmptySiteExplorerTree,
  logoutHref,
  apiCsrfToken,
  errorSoundUrl,
  dingSoundUrl,
  apiBaseUrl,
  apiFetch,
  sitesApi,
  persistenceKey = DESKTOP_WINDOWS_STORAGE_KEY,
  className,
}: AdminDesktopProps) {
  const storageKey = persistenceKey === false ? null : persistenceKey;
  const persistedRef = useRef<PersistedDesktopState | null>(
    storageKey ? loadPersistedDesktop(storageKey) : null,
  );
  const hydratedRef = useRef(
    hydrateDesktopFromPersistence(persistedRef.current, sites),
  );

  const nextZRef = useRef(hydratedRef.current.nextZ);
  const cascadeRef = useRef(hydratedRef.current.cascade);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [shell, setShell] = useState<DesktopShellState>(() => ({
    windows: hydratedRef.current.windows,
    activeId: hydratedRef.current.activeId,
  }));
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [desktopSites, setDesktopSites] = useState<DesktopSite[]>(sites);
  const [sitesRows, setSitesRows] = useState<SitesWindowSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesCreating, setSitesCreating] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [sitesFormError, setSitesFormError] = useState<string | null>(null);
  const [sitesFieldErrors, setSitesFieldErrors] = useState<
    Partial<Record<'name' | 'slug', string>>
  >({});
  const [hostsRows, setHostsRows] = useState<HostsWindowHost[]>([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [hostsCreating, setHostsCreating] = useState(false);
  const [hostsUnassigning, setHostsUnassigning] = useState(false);
  const [hostsVerifying, setHostsVerifying] = useState(false);
  const [hostsError, setHostsError] = useState<string | null>(null);
  const [hostsFormError, setHostsFormError] = useState<string | null>(null);
  const [hostsFieldErrors, setHostsFieldErrors] = useState<
    Partial<Record<'host' | 'siteId' | 'surface' | 'active', string>>
  >({});
  /** After Error modal OK — bounce to login when the API reported session loss. */
  const pendingLoginRedirectRef = useRef(false);

  const api = useMemo(
    () =>
      sitesApi ??
      createAdminApiClient({
        csrfToken: apiCsrfToken,
        baseUrl: apiBaseUrl,
        fetch: apiFetch,
      }),
    [sitesApi, apiCsrfToken, apiBaseUrl, apiFetch],
  );

  const canEditSites = Boolean(sitesApi) || Boolean(apiCsrfToken);
  const canEditHosts = canEditSites;

  const noteUnauthorized = useCallback((setError: (message: string | null) => void, message: string) => {
    pendingLoginRedirectRef.current = true;
    setError(message);
  }, []);

  const handleApiFailure = useCallback(
    (result: AdminApiResult<unknown>, setError: (message: string | null) => void) => {
      if (result.ok) {
        return;
      }
      if (isUnauthorizedResult(result)) {
        noteUnauthorized(setError, result.error.message);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setError(result.error.message);
    },
    [noteUnauthorized],
  );

  const handleAlertClose = useCallback(() => {
    if (pendingLoginRedirectRef.current) {
      window.location.assign('/login');
    }
  }, []);

  const sitesWindowOpen = shell.windows.some((win) => win.id === SITES_WINDOW_ID);
  const hostsWindowOpen = shell.windows.some((win) => win.id === HOSTS_WINDOW_ID);
  const siteFormHosts = useMemo(
    () => hostsRows.map(toSiteFormHostOption),
    [hostsRows],
  );
  const hostFormSites = useMemo(
    () =>
      desktopSites.map((site) => ({
        id: site.id,
        name: site.name,
        slug: site.slug,
      })),
    [desktopSites],
  );

  useEffect(() => {
    setDesktopSites(sites);
  }, [sites]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }
    const timer = window.setTimeout(() => {
      const next = buildPersistedDesktopState(
        persistedRef.current,
        shell.windows,
        shell.activeId,
        nextZRef.current,
        cascadeRef.current,
      );
      persistedRef.current = next;
      savePersistedDesktop(next, storageKey);
    }, PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [shell, storageKey]);

  useEffect(() => {
    if (!sitesWindowOpen) {
      return;
    }

    let cancelled = false;
    setSitesLoading(true);
    setSitesError(null);

    void (async () => {
      const result = await api.listSites();
      if (cancelled) {
        return;
      }
      setSitesLoading(false);
      if (!result.ok) {
        handleApiFailure(result, setSitesError);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setSitesRows(result.data.map(toWindowSite));
      setDesktopSites(result.data.map(toDesktopSite));
    })();

    return () => {
      cancelled = true;
    };
  }, [sitesWindowOpen, api, handleApiFailure]);

  useEffect(() => {
    if (!hostsWindowOpen && !sitesWindowOpen) {
      return;
    }

    let cancelled = false;
    if (hostsWindowOpen) {
      setHostsLoading(true);
      setHostsError(null);
    }

    void (async () => {
      const result = await api.listHosts();
      if (cancelled) {
        return;
      }
      if (hostsWindowOpen) {
        setHostsLoading(false);
      }
      if (!result.ok) {
        if (hostsWindowOpen) {
          handleApiFailure(result, setHostsError);
        } else if (isUnauthorizedResult(result)) {
          noteUnauthorized(setSitesError, result.error.message);
        }
        return;
      }
      pendingLoginRedirectRef.current = false;
      setHostsRows(result.data.map(toWindowHost));
    })();

    return () => {
      cancelled = true;
    };
  }, [hostsWindowOpen, sitesWindowOpen, api, handleApiFailure, noteUnauthorized]);

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

  const toggleMaximize = (id: string) => {
    setShell((prev) => {
      const target = prev.windows.find((win) => win.id === id);
      if (!target) {
        return prev;
      }
      const z = target.z === nextZRef.current ? target.z : raiseZ();

      if (target.maximized && target.restore) {
        return {
          activeId: id,
          windows: prev.windows.map((win) =>
            win.id === id
              ? {
                  ...win,
                  z,
                  maximized: false,
                  left: target.restore!.left,
                  top: target.restore!.top,
                  width: target.restore!.width,
                  height: target.restore!.height,
                  restore: undefined,
                }
              : win,
          ),
        };
      }

      const dashboard = dashboardRef.current;
      const work = dashboard
        ? getDesktopWorkSize(dashboard)
        : { width: target.width, height: target.height };

      return {
        activeId: id,
        windows: prev.windows.map((win) =>
          win.id === id
            ? {
                ...win,
                z,
                maximized: true,
                left: 0,
                top: 0,
                width: work.width,
                height: work.height,
                restore: {
                  left: target.left,
                  top: target.top,
                  width: target.width,
                  height: target.height,
                },
              }
            : win,
        ),
      };
    });
  };

  const openOrRaiseWindow = (
    id: string,
    kind: ShellWindowState['kind'],
    title: string,
    defaultSize: { width: number; height: number },
  ) => {
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
      const saved = geometryFromPersistence(persistedRef.current, id, kind);
      const place = saved
        ? { left: saved.left, top: saved.top, z: raiseZ() }
        : allocatePlacement();
      const size = saved
        ? { width: saved.width, height: saved.height }
        : defaultSize;
      return {
        activeId: id,
        windows: [
          ...prev.windows,
          {
            id,
            kind,
            title,
            left: place.left,
            top: place.top,
            z: place.z,
            width: size.width,
            height: size.height,
            minimized: false,
            maximized: false,
          },
        ],
      };
    });
  };

  const openControlPanel = () => {
    openOrRaiseWindow(
      CONTROL_PANEL_WINDOW_ID,
      'control-panel',
      'Control Panel',
      DEFAULT_WINDOW_SIZE['control-panel'],
    );
  };

  const openSites = () => {
    openOrRaiseWindow(
      SITES_WINDOW_ID,
      'sites',
      'Sites',
      DEFAULT_WINDOW_SIZE.sites,
    );
  };

  const openHosts = () => {
    openOrRaiseWindow(
      HOSTS_WINDOW_ID,
      'hosts',
      'Hosts',
      DEFAULT_WINDOW_SIZE.hosts,
    );
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
      const saved = geometryFromPersistence(persistedRef.current, id, 'site');
      const place = saved
        ? { left: saved.left, top: saved.top, z: raiseZ() }
        : allocatePlacement();
      const size = saved
        ? { width: saved.width, height: saved.height }
        : DEFAULT_WINDOW_SIZE.site;
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
            width: size.width,
            height: size.height,
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

  const resizeWindow = (id: string, bounds: ShellBounds) => {
    setShell((prev) => ({
      ...prev,
      windows: prev.windows.map((win) =>
        win.id === id
          ? {
              ...win,
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              height: bounds.height,
              maximized: false,
              restore: undefined,
            }
          : win,
      ),
    }));
  };

  const handleSaveSite = async (payload: {
    mode: 'new' | 'edit';
    siteId?: number;
    name: string;
    slug: string;
    enabled: boolean;
  }) => {
    if (payload.mode !== 'new') {
      // Update API arrives with Hosts / edit slice; keep dialog feedback for now.
      setSitesFormError('Editing a site is not available yet.');
      return;
    }

    setSitesCreating(true);
    setSitesFormError(null);
    setSitesFieldErrors({});

    const result = await api.createSite({
      name: payload.name,
      slug: payload.slug,
      enabled: payload.enabled,
    });
    setSitesCreating(false);

    if (!result.ok) {
      if (result.error.fields) {
        setSitesFieldErrors({
          name: result.error.fields.name,
          slug: result.error.fields.slug,
        });
      }
      handleApiFailure(result, setSitesFormError);
      return;
    }

    const list = await api.listSites();
    if (list.ok) {
      setSitesRows(list.data.map(toWindowSite));
      setDesktopSites(list.data.map(toDesktopSite));
      return;
    }

    const created = toWindowSite(result.data);
    setSitesRows((prev) =>
      [...prev.filter((row) => row.id !== created.id), created].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setDesktopSites((prev) => {
      const next = [
        ...prev.filter((row) => row.id !== created.id),
        toDesktopSite(created),
      ];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleSaveHost = async (payload: HostFormSavePayload) => {
    setHostsCreating(true);
    setHostsFormError(null);
    setHostsFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createHost({
            host: payload.host,
            siteId: payload.siteId,
            surface: payload.surface,
            active: payload.active,
          })
        : payload.hostId != null
          ? await api.updateHost(payload.hostId, {
              host: payload.host,
              siteId: payload.siteId,
              surface: payload.surface,
              active: payload.active,
            })
          : null;

    setHostsCreating(false);

    if (!result) {
      setHostsFormError('Editing a host is not available yet.');
      return;
    }

    if (!result.ok) {
      if (result.error.fields) {
        setHostsFieldErrors({
          host: result.error.fields.host,
          siteId: result.error.fields.siteId,
          surface: result.error.fields.surface,
          active: result.error.fields.active,
        });
      }
      handleApiFailure(result, setHostsFormError);
      return;
    }

    const list = await api.listHosts();
    if (list.ok) {
      setHostsRows(list.data.map(toWindowHost));
    } else {
      const saved = toWindowHost(result.data);
      setHostsRows((prev) =>
        [...prev.filter((row) => row.id !== saved.id), saved].sort((a, b) =>
          a.host.localeCompare(b.host),
        ),
      );
    }

    const sitesList = await api.listSites();
    if (sitesList.ok) {
      setSitesRows(sitesList.data.map(toWindowSite));
      setDesktopSites(sitesList.data.map(toDesktopSite));
    }
  };

  const handleUnassignHost = async (hostId: number) => {
    setHostsUnassigning(true);
    setSitesFormError(null);
    const result = await api.unassignHost(hostId);
    setHostsUnassigning(false);

    if (!result.ok) {
      handleApiFailure(result, setSitesFormError);
      return;
    }

    const list = await api.listHosts();
    if (list.ok) {
      setHostsRows(list.data.map(toWindowHost));
    } else {
      setHostsRows((prev) =>
        prev.map((row) =>
          row.id === hostId
            ? {
                ...row,
                siteId: null,
                siteSlug: null,
                siteName: null,
                status: row.status === 'active' ? 'verified' : row.status,
              }
            : row,
        ),
      );
    }

    const sitesList = await api.listSites();
    if (sitesList.ok) {
      setSitesRows(sitesList.data.map(toWindowSite));
      setDesktopSites(sitesList.data.map(toDesktopSite));
    }
  };

  const handleVerifyHost = async (host: HostsWindowHost) => {
    setHostsVerifying(true);
    setHostsError(null);
    const result = await api.verifyHost(host.id);
    setHostsVerifying(false);

    if (!result.ok) {
      handleApiFailure(result, setHostsError);
      return;
    }

    const list = await api.listHosts();
    if (list.ok) {
      setHostsRows(list.data.map(toWindowHost));
    } else {
      const verified = toWindowHost(result.data);
      setHostsRows((prev) =>
        prev.map((row) => (row.id === verified.id ? verified : row)),
      );
    }
  };

  return (
    <div ref={dashboardRef} className={cn('dashboard', className)}>
      <div className="icon-list">
        {desktopSites.map((site) => (
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
        const maximizeAction = win.maximized ? 'Restore' : 'Maximize';

        const shellFrame = (child: ReactNode) => (
          <DesktopWindow
            key={win.id}
            windowId={win.id}
            left={win.left}
            top={win.top}
            zIndex={win.z}
            width={win.width}
            height={win.height}
            maximized={win.maximized}
            className={cn(win.minimized && 'is-minimized')}
            dragDisabled={win.minimized || win.maximized}
            onActivate={() => activateWindow(win.id)}
            onPositionChange={(left, top) => moveWindow(win.id, left, top)}
            onBoundsChange={(bounds) => resizeWindow(win.id, bounds)}
            onToggleMaximize={() => toggleMaximize(win.id)}
          >
            {child}
          </DesktopWindow>
        );

        if (win.kind === 'control-panel') {
          return shellFrame(
            <ControlPanel
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onActivate={() => activateWindow(win.id)}
              onOpenSites={openSites}
              onOpenHosts={openHosts}
            />,
          );
        }

        if (win.kind === 'sites') {
          return shellFrame(
            <SitesWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              sites={sitesRows}
              hosts={siteFormHosts}
              canEdit={canEditSites}
              loading={sitesLoading}
              saving={sitesCreating}
              error={sitesError}
              formError={sitesFormError}
              fieldErrors={sitesFieldErrors}
              onSave={handleSaveSite}
              onAddHost={openHosts}
              onUnassignHost={handleUnassignHost}
              unassigning={hostsUnassigning}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={handleAlertClose}
              onClose={() => closeWindow(win.id)}
              onCancel={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onActivate={() => activateWindow(win.id)}
              width={win.width}
              style={{ height: '100%', minHeight: 0, width: '100%' }}
            />,
          );
        }

        if (win.kind === 'hosts') {
          return shellFrame(
            <HostsWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              hosts={hostsRows}
              sites={hostFormSites}
              canEdit={canEditHosts}
              loading={hostsLoading}
              saving={hostsCreating}
              verifying={hostsVerifying}
              error={hostsError}
              formError={hostsFormError}
              fieldErrors={hostsFieldErrors}
              onSave={handleSaveHost}
              onVerify={handleVerifyHost}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={handleAlertClose}
              onClose={() => closeWindow(win.id)}
              onCancel={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onActivate={() => activateWindow(win.id)}
              width={win.width}
              style={{ height: '100%', minHeight: 0, width: '100%' }}
            />,
          );
        }

        const site = desktopSites.find((entry) => entry.id === win.siteId) ?? {
          id: win.siteId ?? 0,
          name: win.title,
        };

        return shellFrame(
          <SiteFileExplorer
            className={cn(win.maximized && 'is-maximized')}
            inactive={!active}
            title={win.title}
            titleIcon="site"
            tree={explorerTreeForSite(site)}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => toggleMaximize(win.id)}
            maximizeAction={maximizeAction}
          />,
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
