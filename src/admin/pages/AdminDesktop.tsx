import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildEmptySiteExplorerTree,
  SiteFileExplorer,
  parseExplorerEntityId,
  type ExplorerItem,
} from '../bricks/FileExplorerWindow';
import { DocumentEditorWindow } from '../bricks/DocumentEditor';
import { SystemIcon } from '../chrome/SystemIcon';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import {
  SitesWindow,
  type SitesWindowSite,
} from '../components/SitesWindow/SitesWindow';
import {
  PermissionsWindow,
  type PermissionsWindowPermission,
} from '../components/PermissionsWindow/PermissionsWindow';
import {
  RolesWindow,
  type RolesWindowRole,
} from '../components/RolesWindow/RolesWindow';
import {
  UsersWindow,
  type UsersWindowUser,
} from '../components/UsersWindow/UsersWindow';
import {
  HostsWindow,
  type HostsWindowHost,
} from '../components/HostsWindow/HostsWindow';
import type { HostFormSavePayload } from '../components/HostsWindow/HostFormDialog';
import type { SiteFormHostOption } from '../components/SitesWindow/SiteFormDialog';
import type { PermissionFormSavePayload } from '../components/PermissionsWindow/PermissionFormDialog';
import type { RoleFormSavePayload } from '../components/RolesWindow/RoleFormDialog';
import type { UserFormSavePayload } from '../components/UsersWindow/UserFormDialog';
import {
  SetPasswordDialog,
  type SetPasswordSavePayload,
} from '../components/UsersWindow/SetPasswordDialog';
import { DesktopModal } from '../bricks/DesktopModal';
import { MessageDialog } from '../bricks/MessageDialog';
import {
  createAdminApiClient,
  isUnauthorizedResult,
  type AdminApiClient,
  type AdminApiHost,
  type AdminApiPermission,
  type AdminApiResult,
  type AdminApiRole,
  type AdminApiSettings,
  type AdminApiSite,
  type AdminApiSiteSettings,
  type AdminApiContentNode,
  type AdminApiUser,
  type AdminApiUserCapabilities,
} from '../api';
import { cn } from '../../lib/cn';
import { assignSafeAppPath, assignSafeNavigationUrl } from '../lib/safeAppPath';
import { parseAdminDeepLink, type AdminDeepLink } from '../lib/deepLink';
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
  PERMISSIONS_WINDOW_ID,
  ROLES_WINDOW_ID,
  USERS_WINDOW_ID,
  savePersistedDesktop,
  siteWindowId,
  siteSettingsWindowId,
  documentEditorWindowId,
  SETTINGS_WINDOW_ID,
  SITES_WINDOW_ID,
  StartMenu,
  Taskbar,
  type PersistedDesktopState,
  type ShellBounds,
  type ShellWindowState,
} from '../shell';
import {
  SettingsWindow,
  type SettingsSavePatch,
} from '../components/SettingsWindow/SettingsWindow';
import {
  SiteSettingsWindow,
  type SiteSettingsSavePatch,
} from '../components/SiteSettingsWindow/SiteSettingsWindow';
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
  /** Logout URL for Start → Logout (Twig: `path('admin_logout')`). */
  logoutHref?: string;
  /** Session-expired redirect (Twig: `path('admin_login')`). Default `/admin/login`. */
  loginHref?: string;
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
  /**
   * Deep-link query override (`?window=` / `?id=`).
   * Default: read `window.location.search`. Pass `''` in Storybook to ignore
   * the iframe URL; pass an explicit search string to test deep links.
   */
  locationSearch?: string;
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
    themeId: site.themeId,
    protected: site.protected,
    hostCount: site.hostCount,
  };
}

function toWindowPermission(permission: AdminApiPermission): PermissionsWindowPermission {
  return {
    id: permission.id,
    name: permission.name,
    label: permission.label,
    description: permission.description,
  };
}

function toWindowRole(role: AdminApiRole): RolesWindowRole {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    description: role.description,
    protected: role.protected,
    permissionIds: [...role.permissionIds],
    permissionCount: role.permissionCount,
  };
}

function toWindowUser(user: AdminApiUser): UsersWindowUser {
  return {
    id: user.id,
    email: user.email,
    roleIds: [...user.roleIds],
    roles: user.roles.map((role) => ({ ...role })),
    siteAssignments: user.siteAssignments.map((row) => ({ ...row })),
    roleCount: user.roleCount,
    siteAssignmentCount: user.siteAssignmentCount,
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
    verification: host.verification,
    enabled: host.enabled,
    protected: host.protected,
  };
}

function toSiteFormHostOption(host: AdminApiHost | HostsWindowHost): SiteFormHostOption {
  return {
    id: host.id,
    host: host.host,
    siteId: host.siteId,
    siteName: host.siteName,
    status: host.verification === 'verified' ? 'verified' : 'pending',
    surface: host.surface,
    enabled: host.enabled,
    protected: host.protected,
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
  loginHref = '/admin/login',
  apiCsrfToken,
  errorSoundUrl,
  dingSoundUrl,
  apiBaseUrl,
  apiFetch,
  sitesApi,
  persistenceKey = DESKTOP_WINDOWS_STORAGE_KEY,
  locationSearch,
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
  const [deepLink] = useState<AdminDeepLink | null>(() => {
    const search =
      locationSearch !== undefined
        ? locationSearch
        : typeof window !== 'undefined'
          ? window.location.search
          : '';
    return parseAdminDeepLink(search);
  });
  const deepLinkAppliedRef = useRef(false);
  const sitesPreferSelectedId =
    deepLink?.window === 'sites' ? deepLink.id : null;
  const hostsPreferSelectedId =
    deepLink?.window === 'hosts' ? deepLink.id : null;
  const permissionsPreferSelectedId =
    deepLink?.window === 'permissions' ? deepLink.id : null;
  const rolesPreferSelectedId =
    deepLink?.window === 'roles' ? deepLink.id : null;
  const usersPreferSelectedId =
    deepLink?.window === 'users' ? deepLink.id : null;
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [desktopSites, setDesktopSites] = useState<DesktopSite[]>(sites);
  const [sitesRows, setSitesRows] = useState<SitesWindowSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesCreating, setSitesCreating] = useState(false);
  const [sitesDeleting, setSitesDeleting] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [sitesFormError, setSitesFormError] = useState<string | null>(null);
  const [sitesFieldErrors, setSitesFieldErrors] = useState<
    Partial<Record<'name' | 'slug', string>>
  >({});
  const [permissionsRows, setPermissionsRows] = useState<
    PermissionsWindowPermission[]
  >([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsCreating, setPermissionsCreating] = useState(false);
  const [permissionsDeleting, setPermissionsDeleting] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissionsFormError, setPermissionsFormError] = useState<string | null>(
    null,
  );
  const [permissionsFieldErrors, setPermissionsFieldErrors] = useState<
    Partial<Record<'name' | 'label' | 'description', string>>
  >({});
  const [permissionsStatusMessage, setPermissionsStatusMessage] = useState<
    string | null
  >(null);
  const [rolesRows, setRolesRows] = useState<RolesWindowRole[]>([]);
  const [rolesPermissionOptions, setRolesPermissionOptions] = useState<
    { id: number; name: string; label: string }[]
  >([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesCreating, setRolesCreating] = useState(false);
  const [rolesDeleting, setRolesDeleting] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesFormError, setRolesFormError] = useState<string | null>(null);
  const [rolesFieldErrors, setRolesFieldErrors] = useState<
    Partial<Record<'name' | 'label' | 'description', string>>
  >({});
  const [rolesStatusMessage, setRolesStatusMessage] = useState<string | null>(
    null,
  );
  const [usersRows, setUsersRows] = useState<UsersWindowUser[]>([]);
  const [usersRoleOptions, setUsersRoleOptions] = useState<
    { id: number; name: string; label: string }[]
  >([]);
  const [usersSiteOptions, setUsersSiteOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCreating, setUsersCreating] = useState(false);
  const [usersDeleting, setUsersDeleting] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersFormError, setUsersFormError] = useState<string | null>(null);
  const [usersFieldErrors, setUsersFieldErrors] = useState<
    Partial<Record<'email' | 'password' | 'roleIds' | 'siteAssignments', string>>
  >({});
  const [usersStatusMessage, setUsersStatusMessage] = useState<string | null>(
    null,
  );
  const [usersSettingPassword, setUsersSettingPassword] = useState(false);
  const [usersPasswordFormError, setUsersPasswordFormError] = useState<
    string | null
  >(null);
  const [usersPasswordFieldErrors, setUsersPasswordFieldErrors] = useState<
    Partial<Record<'currentPassword' | 'password' | 'confirmPassword', string>>
  >({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userCapabilities, setUserCapabilities] =
    useState<AdminApiUserCapabilities | null>(null);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [myAccountSaving, setMyAccountSaving] = useState(false);
  const [myAccountFormError, setMyAccountFormError] = useState<string | null>(
    null,
  );
  const [myAccountFieldErrors, setMyAccountFieldErrors] = useState<
    Partial<Record<'currentPassword' | 'password' | 'confirmPassword', string>>
  >({});
  const [myAccountAlert, setMyAccountAlert] = useState<string | null>(null);
  const [hostsRows, setHostsRows] = useState<HostsWindowHost[]>([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [hostsCreating, setHostsCreating] = useState(false);
  const [hostsDeleting, setHostsDeleting] = useState(false);
  const [hostsUnassigning, setHostsUnassigning] = useState(false);
  const [hostsAssigning, setHostsAssigning] = useState(false);
  const [hostsVerifying, setHostsVerifying] = useState(false);
  const [hostsError, setHostsError] = useState<string | null>(null);
  const [hostsFormError, setHostsFormError] = useState<string | null>(null);
  const [hostsFieldErrors, setHostsFieldErrors] = useState<
    Partial<Record<'host' | 'siteId' | 'surface' | 'enabled', string>>
  >({});
  const [sitesStatusMessage, setSitesStatusMessage] = useState<string | null>(null);
  const [hostsStatusMessage, setHostsStatusMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminApiSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsStatusMessage, setSettingsStatusMessage] = useState<string | null>(
    null,
  );
  const [siteSettingsById, setSiteSettingsById] = useState<
    Record<number, AdminApiSiteSettings>
  >({});
  const [siteSettingsLoadingId, setSiteSettingsLoadingId] = useState<number | null>(
    null,
  );
  const [siteSettingsSavingId, setSiteSettingsSavingId] = useState<number | null>(
    null,
  );
  const [siteSettingsError, setSiteSettingsError] = useState<string | null>(null);
  const [siteSettingsStatusMessage, setSiteSettingsStatusMessage] = useState<
    string | null
  >(null);
  const [documentsByKey, setDocumentsByKey] = useState<
    Record<string, AdminApiContentNode>
  >({});
  const [documentLoadingKey, setDocumentLoadingKey] = useState<string | null>(
    null,
  );
  const [documentSavingKey, setDocumentSavingKey] = useState<string | null>(
    null,
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentStatusMessage, setDocumentStatusMessage] = useState<
    string | null
  >(null);
  /** After Error modal OK — bounce to login when the API reported session loss. */
  const pendingLoginRedirectRef = useRef(false);
  const sitesStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hostsStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionsStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const rolesStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usersStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const canEditPermissions = canEditSites;
  const canEditRoles = canEditSites;
  const canEditSettings = canEditSites;
  const canEditSiteSettings = canEditSites;
  const canEditDocuments = canEditSites;
  const usersCaps: AdminApiUserCapabilities = userCapabilities ?? {
    listUsers: canEditSites,
    viewUser: canEditSites,
    createUser: canEditSites,
    editUser: canEditSites,
    deleteUser: canEditSites,
  };

  const clearSitesStatusMessage = useCallback(() => {
    if (sitesStatusTimerRef.current != null) {
      clearTimeout(sitesStatusTimerRef.current);
      sitesStatusTimerRef.current = null;
    }
    setSitesStatusMessage(null);
  }, []);

  const clearHostsStatusMessage = useCallback(() => {
    if (hostsStatusTimerRef.current != null) {
      clearTimeout(hostsStatusTimerRef.current);
      hostsStatusTimerRef.current = null;
    }
    setHostsStatusMessage(null);
  }, []);

  const clearPermissionsStatusMessage = useCallback(() => {
    if (permissionsStatusTimerRef.current != null) {
      clearTimeout(permissionsStatusTimerRef.current);
      permissionsStatusTimerRef.current = null;
    }
    setPermissionsStatusMessage(null);
  }, []);

  const clearRolesStatusMessage = useCallback(() => {
    if (rolesStatusTimerRef.current != null) {
      clearTimeout(rolesStatusTimerRef.current);
      rolesStatusTimerRef.current = null;
    }
    setRolesStatusMessage(null);
  }, []);

  const clearUsersStatusMessage = useCallback(() => {
    if (usersStatusTimerRef.current != null) {
      clearTimeout(usersStatusTimerRef.current);
      usersStatusTimerRef.current = null;
    }
    setUsersStatusMessage(null);
  }, []);

  const flashSitesStatus = useCallback(
    (message: string) => {
      clearSitesStatusMessage();
      setSitesStatusMessage(message);
      sitesStatusTimerRef.current = setTimeout(() => {
        sitesStatusTimerRef.current = null;
        setSitesStatusMessage(null);
      }, 4000);
    },
    [clearSitesStatusMessage],
  );

  const flashHostsStatus = useCallback(
    (message: string) => {
      clearHostsStatusMessage();
      setHostsStatusMessage(message);
      hostsStatusTimerRef.current = setTimeout(() => {
        hostsStatusTimerRef.current = null;
        setHostsStatusMessage(null);
      }, 4000);
    },
    [clearHostsStatusMessage],
  );

  const flashPermissionsStatus = useCallback(
    (message: string) => {
      clearPermissionsStatusMessage();
      setPermissionsStatusMessage(message);
      permissionsStatusTimerRef.current = setTimeout(() => {
        permissionsStatusTimerRef.current = null;
        setPermissionsStatusMessage(null);
      }, 4000);
    },
    [clearPermissionsStatusMessage],
  );

  const flashRolesStatus = useCallback(
    (message: string) => {
      clearRolesStatusMessage();
      setRolesStatusMessage(message);
      rolesStatusTimerRef.current = setTimeout(() => {
        rolesStatusTimerRef.current = null;
        setRolesStatusMessage(null);
      }, 4000);
    },
    [clearRolesStatusMessage],
  );

  const flashUsersStatus = useCallback(
    (message: string) => {
      clearUsersStatusMessage();
      setUsersStatusMessage(message);
      usersStatusTimerRef.current = setTimeout(() => {
        usersStatusTimerRef.current = null;
        setUsersStatusMessage(null);
      }, 4000);
    },
    [clearUsersStatusMessage],
  );

  const clearSettingsStatusMessage = useCallback(() => {
    if (settingsStatusTimerRef.current != null) {
      clearTimeout(settingsStatusTimerRef.current);
      settingsStatusTimerRef.current = null;
    }
    setSettingsStatusMessage(null);
  }, []);

  const flashSettingsStatus = useCallback(
    (message: string) => {
      clearSettingsStatusMessage();
      setSettingsStatusMessage(message);
      settingsStatusTimerRef.current = setTimeout(() => {
        settingsStatusTimerRef.current = null;
        setSettingsStatusMessage(null);
      }, 4000);
    },
    [clearSettingsStatusMessage],
  );

  useEffect(() => {
    return () => {
      if (sitesStatusTimerRef.current != null) {
        clearTimeout(sitesStatusTimerRef.current);
      }
      if (hostsStatusTimerRef.current != null) {
        clearTimeout(hostsStatusTimerRef.current);
      }
      if (permissionsStatusTimerRef.current != null) {
        clearTimeout(permissionsStatusTimerRef.current);
      }
      if (rolesStatusTimerRef.current != null) {
        clearTimeout(rolesStatusTimerRef.current);
      }
      if (usersStatusTimerRef.current != null) {
        clearTimeout(usersStatusTimerRef.current);
      }
      if (settingsStatusTimerRef.current != null) {
        clearTimeout(settingsStatusTimerRef.current);
      }
    };
  }, []);

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
      pendingLoginRedirectRef.current = false;
      assignSafeAppPath(loginHref, '/admin/login');
    }
  }, [loginHref]);

  const dismissSitesAlert = useCallback(() => {
    setSitesError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const dismissHostsAlert = useCallback(() => {
    setHostsError(null);
    setHostsFormError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const dismissPermissionsAlert = useCallback(() => {
    setPermissionsError(null);
    setPermissionsFormError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const dismissRolesAlert = useCallback(() => {
    setRolesError(null);
    setRolesFormError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const dismissUsersAlert = useCallback(() => {
    setUsersError(null);
    setUsersFormError(null);
    setUsersPasswordFormError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const dismissSettingsAlert = useCallback(() => {
    setSettingsError(null);
    handleAlertClose();
  }, [handleAlertClose]);

  const sitesWindowOpen = shell.windows.some((win) => win.id === SITES_WINDOW_ID);
  const hostsWindowOpen = shell.windows.some((win) => win.id === HOSTS_WINDOW_ID);
  const permissionsWindowOpen = shell.windows.some(
    (win) => win.id === PERMISSIONS_WINDOW_ID,
  );
  const rolesWindowOpen = shell.windows.some((win) => win.id === ROLES_WINDOW_ID);
  const usersWindowOpen = shell.windows.some((win) => win.id === USERS_WINDOW_ID);
  const settingsWindowOpen = shell.windows.some((win) => win.id === SETTINGS_WINDOW_ID);
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
    let cancelled = false;
    (async () => {
      const result = await api.getMe();
      if (cancelled || !result.ok) {
        return;
      }
      setCurrentUserId(
        typeof result.data.id === 'number' ? result.data.id : null,
      );
      setCurrentUserEmail(
        typeof result.data.email === 'string' ? result.data.email : null,
      );
      if (result.data.capabilities) {
        setUserCapabilities(result.data.capabilities);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

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
    clearSitesStatusMessage();

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
  }, [sitesWindowOpen, api, handleApiFailure, clearSitesStatusMessage]);

  useEffect(() => {
    if (!permissionsWindowOpen) {
      return;
    }

    let cancelled = false;
    setPermissionsLoading(true);
    setPermissionsError(null);
    clearPermissionsStatusMessage();

    void (async () => {
      const result = await api.listPermissions();
      if (cancelled) {
        return;
      }
      setPermissionsLoading(false);
      if (!result.ok) {
        handleApiFailure(result, setPermissionsError);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setPermissionsRows(result.data.map(toWindowPermission));
    })();

    return () => {
      cancelled = true;
    };
  }, [permissionsWindowOpen, api, handleApiFailure, clearPermissionsStatusMessage]);

  useEffect(() => {
    if (!rolesWindowOpen) {
      return;
    }

    let cancelled = false;
    setRolesLoading(true);
    setRolesError(null);
    clearRolesStatusMessage();

    void (async () => {
      const [rolesResult, permissionsResult] = await Promise.all([
        api.listRoles(),
        api.listPermissions(),
      ]);
      if (cancelled) {
        return;
      }
      setRolesLoading(false);
      if (!rolesResult.ok) {
        handleApiFailure(rolesResult, setRolesError);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setRolesRows(rolesResult.data.map(toWindowRole));
      if (permissionsResult.ok) {
        setRolesPermissionOptions(
          permissionsResult.data.map((row) => ({
            id: row.id,
            name: row.name,
            label: row.label,
          })),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rolesWindowOpen, api, handleApiFailure, clearRolesStatusMessage]);

  useEffect(() => {
    if (!usersWindowOpen) {
      return;
    }

    let cancelled = false;
    setUsersLoading(true);
    setUsersError(null);
    clearUsersStatusMessage();

    void (async () => {
      const [usersResult, rolesResult, sitesResult] = await Promise.all([
        api.listUsers(),
        api.listRoles(),
        api.listSites(),
      ]);
      if (cancelled) {
        return;
      }
      setUsersLoading(false);
      if (!usersResult.ok) {
        handleApiFailure(usersResult, setUsersError);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setUsersRows(usersResult.data.map(toWindowUser));
      if (rolesResult.ok) {
        setUsersRoleOptions(
          rolesResult.data.map((row) => ({
            id: row.id,
            name: row.name,
            label: row.label,
          })),
        );
      }
      if (sitesResult.ok) {
        setUsersSiteOptions(
          sitesResult.data.map((row) => ({
            id: row.id,
            name: row.name,
          })),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [usersWindowOpen, api, handleApiFailure, clearUsersStatusMessage]);

  useEffect(() => {
    if (!hostsWindowOpen && !sitesWindowOpen) {
      return;
    }

    let cancelled = false;
    if (hostsWindowOpen) {
      setHostsLoading(true);
      setHostsError(null);
      clearHostsStatusMessage();
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
  }, [
    hostsWindowOpen,
    sitesWindowOpen,
    api,
    handleApiFailure,
    noteUnauthorized,
    clearHostsStatusMessage,
  ]);

  useEffect(() => {
    if (!settingsWindowOpen && !hostsWindowOpen && !sitesWindowOpen) {
      return;
    }

    let cancelled = false;
    if (settingsWindowOpen) {
      setSettingsLoading(true);
      setSettingsError(null);
      clearSettingsStatusMessage();
    }

    void (async () => {
      const result = await api.getSettings();
      if (cancelled) {
        return;
      }
      if (settingsWindowOpen) {
        setSettingsLoading(false);
      }
      if (!result.ok) {
        if (settingsWindowOpen) {
          handleApiFailure(result, setSettingsError);
        }
        return;
      }
      pendingLoginRedirectRef.current = false;
      setSettings(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    settingsWindowOpen,
    hostsWindowOpen,
    sitesWindowOpen,
    api,
    handleApiFailure,
    clearSettingsStatusMessage,
  ]);

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

  const openSettings = () => {
    openOrRaiseWindow(
      SETTINGS_WINDOW_ID,
      'settings',
      'Settings',
      DEFAULT_WINDOW_SIZE.settings,
    );
  };

  const openPermissions = () => {
    openOrRaiseWindow(
      PERMISSIONS_WINDOW_ID,
      'permissions',
      'Permissions',
      DEFAULT_WINDOW_SIZE.permissions,
    );
  };

  const openRoles = () => {
    openOrRaiseWindow(
      ROLES_WINDOW_ID,
      'roles',
      'Roles',
      DEFAULT_WINDOW_SIZE.roles,
    );
  };

  const openUsers = () => {
    openOrRaiseWindow(
      USERS_WINDOW_ID,
      'users',
      'Users',
      DEFAULT_WINDOW_SIZE.users,
    );
  };

  const refreshSettings = useCallback(async () => {
    const result = await api.getSettings();
    if (!result.ok) {
      return;
    }
    pendingLoginRedirectRef.current = false;
    setSettings(result.data);
  }, [api]);

  const handleSaveSettings = useCallback(
    async (patch: SettingsSavePatch) => {
      setSettingsSaving(true);
      setSettingsError(null);
      clearSettingsStatusMessage();
      const result = await api.updateSettings(patch);
      setSettingsSaving(false);
      if (!result.ok) {
        handleApiFailure(result, setSettingsError);
        return;
      }
      pendingLoginRedirectRef.current = false;
      setSettings(result.data);
      if (result.data.sessionEnded && result.data.loginUrl) {
        assignSafeNavigationUrl(result.data.loginUrl, loginHref);
        return;
      }
      if (typeof patch.symfonyDebugToolbar === 'boolean') {
        window.location.reload();
        return;
      }
      flashSettingsStatus('Settings saved.');
    },
    [
      api,
      handleApiFailure,
      clearSettingsStatusMessage,
      flashSettingsStatus,
      loginHref,
    ],
  );

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

  const openSiteSettings = (site: DesktopSite) => {
    const id = siteSettingsWindowId(site.id);
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
      const saved = geometryFromPersistence(
        persistedRef.current,
        id,
        'site-settings',
      );
      const place = saved
        ? { left: saved.left, top: saved.top, z: raiseZ() }
        : allocatePlacement();
      const size = saved
        ? { width: saved.width, height: saved.height }
        : DEFAULT_WINDOW_SIZE['site-settings'];
      return {
        activeId: id,
        windows: [
          ...prev.windows,
          {
            id,
            kind: 'site-settings',
            title: `${site.name} — Settings`,
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
    void (async () => {
      setSiteSettingsLoadingId(site.id);
      setSiteSettingsError(null);
      const result = await api.getSiteSettings(site.id);
      setSiteSettingsLoadingId(null);
      if (!result.ok) {
        handleApiFailure(result, setSiteSettingsError);
        return;
      }
      setSiteSettingsById((prev) => ({ ...prev, [site.id]: result.data }));
    })();
  };

  const handleSaveSiteSettings = async (
    siteId: number,
    patch: SiteSettingsSavePatch,
  ) => {
    setSiteSettingsSavingId(siteId);
    setSiteSettingsError(null);
    const result = await api.updateSiteSettings(siteId, patch);
    setSiteSettingsSavingId(null);
    if (!result.ok) {
      handleApiFailure(result, setSiteSettingsError);
      return;
    }
    setSiteSettingsById((prev) => ({ ...prev, [siteId]: result.data }));
    setSiteSettingsStatusMessage('Settings saved.');
    // Keep desktop site label in sync when name changes.
    if (patch.name) {
      setDesktopSites((prev) =>
        prev.map((row) =>
          row.id === siteId ? { ...row, name: result.data.name } : row,
        ),
      );
      setShell((prev) => ({
        ...prev,
        windows: prev.windows.map((win) => {
          if (win.siteId !== siteId) {
            return win;
          }
          if (win.kind === 'site') {
            return { ...win, title: result.data.name };
          }
          if (win.kind === 'site-settings') {
            return { ...win, title: `${result.data.name} — Settings` };
          }
          return win;
        }),
      }));
    }
  };

  const documentCacheKey = (siteId: number, nodeId: number) =>
    `${siteId}:${nodeId}`;

  const openDocumentEditor = (
    site: DesktopSite,
    nodeId: number,
    title: string,
  ) => {
    const id = documentEditorWindowId(site.id, nodeId);
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
      const saved = geometryFromPersistence(
        persistedRef.current,
        id,
        'document-editor',
      );
      const place = saved
        ? { left: saved.left, top: saved.top, z: raiseZ() }
        : allocatePlacement();
      const size = saved
        ? { width: saved.width, height: saved.height }
        : DEFAULT_WINDOW_SIZE['document-editor'];
      return {
        activeId: id,
        windows: [
          ...prev.windows,
          {
            id,
            kind: 'document-editor',
            title,
            siteId: site.id,
            contentNodeId: nodeId,
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
    void (async () => {
      const key = documentCacheKey(site.id, nodeId);
      setDocumentLoadingKey(key);
      setDocumentError(null);
      const result = await api.getContentNode(site.id, nodeId);
      setDocumentLoadingKey(null);
      if (!result.ok) {
        handleApiFailure(result, setDocumentError);
        return;
      }
      setDocumentsByKey((prev) => ({ ...prev, [key]: result.data }));
      setShell((prev) => ({
        ...prev,
        windows: prev.windows.map((win) =>
          win.id === id ? { ...win, title: result.data.title } : win,
        ),
      }));
    })();
  };

  const handleSaveDocument = async (
    siteId: number,
    nodeId: number,
    payload: { title: string; body: string },
  ) => {
    const key = documentCacheKey(siteId, nodeId);
    setDocumentSavingKey(key);
    setDocumentError(null);
    const result = await api.updateContentNode(siteId, nodeId, {
      title: payload.title,
      body: payload.body,
    });
    setDocumentSavingKey(null);
    if (!result.ok) {
      handleApiFailure(result, setDocumentError);
      return;
    }
    setDocumentsByKey((prev) => ({ ...prev, [key]: result.data }));
    setDocumentStatusMessage('Document saved.');
    setShell((prev) => ({
      ...prev,
      windows: prev.windows.map((win) =>
        win.id === documentEditorWindowId(siteId, nodeId)
          ? { ...win, title: result.data.title }
          : win,
      ),
    }));
  };

  // Before paint so Chromatic/Storybook play sees the opened window (useEffect is too late).
  useLayoutEffect(() => {
    if (!deepLink || deepLinkAppliedRef.current) {
      return;
    }
    deepLinkAppliedRef.current = true;

    switch (deepLink.window) {
      case 'sites':
        openSites();
        break;
      case 'hosts':
        openHosts();
        break;
      case 'control-panel':
        openControlPanel();
        break;
      case 'settings':
        openSettings();
        break;
      case 'permissions':
        openPermissions();
        break;
      case 'roles':
        openRoles();
        break;
      case 'users':
        openUsers();
        break;
      case 'site': {
        if (deepLink.id == null) {
          break;
        }
        const site =
          desktopSites.find((row) => row.id === deepLink.id) ??
          sites.find((row) => row.id === deepLink.id);
        if (site) {
          openSite(site);
        }
        break;
      }
      default:
        break;
    }
    // Once per mount: open helpers are stable enough for this intentional fire-and-forget.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep-link bootstrap
  }, [deepLink]);

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
    clearSitesStatusMessage();
    setSitesCreating(true);
    setSitesFormError(null);
    setSitesFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createSite({
            name: payload.name,
            slug: payload.slug,
            enabled: payload.enabled,
          })
        : payload.siteId != null
          ? await api.updateSite(payload.siteId, {
              name: payload.name,
              slug: payload.slug,
              enabled: payload.enabled,
            })
          : null;

    setSitesCreating(false);

    if (!result) {
      setSitesFormError('Site could not be saved.');
      return;
    }

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

    flashSitesStatus(payload.mode === 'new' ? 'Site created.' : 'Site updated.');

    const list = await api.listSites();
    if (list.ok) {
      setSitesRows(list.data.map(toWindowSite));
      setDesktopSites(list.data.map(toDesktopSite));
      return;
    }

    const saved = toWindowSite(result.data);
    setSitesRows((prev) =>
      [...prev.filter((row) => row.id !== saved.id), saved].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setDesktopSites((prev) => {
      const next = [
        ...prev.filter((row) => row.id !== saved.id),
        toDesktopSite(saved),
      ];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleDeleteSite = async (site: SitesWindowSite) => {
    clearSitesStatusMessage();
    setSitesDeleting(true);
    setSitesError(null);
    const result = await api.deleteSite(site.id);
    setSitesDeleting(false);

    if (!result.ok) {
      handleApiFailure(result, setSitesError);
      return;
    }

    flashSitesStatus('Site deleted.');

    const list = await api.listSites();
    if (list.ok) {
      setSitesRows(list.data.map(toWindowSite));
      setDesktopSites(list.data.map(toDesktopSite));
    } else {
      setSitesRows((prev) => prev.filter((row) => row.id !== site.id));
      setDesktopSites((prev) => prev.filter((row) => row.id !== site.id));
    }
  };

  const handleSavePermission = async (payload: PermissionFormSavePayload) => {
    clearPermissionsStatusMessage();
    setPermissionsCreating(true);
    setPermissionsFormError(null);
    setPermissionsFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createPermission({
            name: payload.name,
            label: payload.label,
            description: payload.description,
          })
        : payload.permissionId != null
          ? await api.updatePermission(payload.permissionId, {
              name: payload.name,
              label: payload.label,
              description: payload.description,
            })
          : null;

    setPermissionsCreating(false);

    if (!result) {
      setPermissionsFormError('Permission could not be saved.');
      return;
    }

    if (!result.ok) {
      if (result.error.fields) {
        setPermissionsFieldErrors({
          name: result.error.fields.name,
          label: result.error.fields.label,
          description: result.error.fields.description,
        });
      }
      handleApiFailure(result, setPermissionsFormError);
      return;
    }

    flashPermissionsStatus(
      payload.mode === 'new' ? 'Permission created.' : 'Permission updated.',
    );

    const list = await api.listPermissions();
    if (list.ok) {
      setPermissionsRows(list.data.map(toWindowPermission));
      return;
    }

    const saved = toWindowPermission(result.data);
    setPermissionsRows((prev) =>
      [...prev.filter((row) => row.id !== saved.id), saved].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
  };

  const handleDeletePermission = async (permission: PermissionsWindowPermission) => {
    clearPermissionsStatusMessage();
    setPermissionsDeleting(true);
    setPermissionsError(null);
    const result = await api.deletePermission(permission.id);
    setPermissionsDeleting(false);

    if (!result.ok) {
      handleApiFailure(result, setPermissionsError);
      return;
    }

    flashPermissionsStatus('Permission deleted.');

    const list = await api.listPermissions();
    if (list.ok) {
      setPermissionsRows(list.data.map(toWindowPermission));
    } else {
      setPermissionsRows((prev) => prev.filter((row) => row.id !== permission.id));
    }
  };

  const handleSaveRole = async (payload: RoleFormSavePayload) => {
    clearRolesStatusMessage();
    setRolesCreating(true);
    setRolesFormError(null);
    setRolesFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createRole({
            name: payload.name,
            label: payload.label,
            description: payload.description,
            permissionIds: payload.permissionIds,
          })
        : payload.roleId != null
          ? await api.updateRole(payload.roleId, {
              name: payload.name,
              label: payload.label,
              description: payload.description,
              permissionIds: payload.permissionIds,
            })
          : null;

    setRolesCreating(false);

    if (!result) {
      setRolesFormError('Role could not be saved.');
      return;
    }

    if (!result.ok) {
      if (result.error.fields) {
        setRolesFieldErrors({
          name: result.error.fields.name,
          label: result.error.fields.label,
          description: result.error.fields.description,
        });
      }
      handleApiFailure(result, setRolesFormError);
      return;
    }

    flashRolesStatus(payload.mode === 'new' ? 'Role created.' : 'Role updated.');

    const list = await api.listRoles();
    if (list.ok) {
      setRolesRows(list.data.map(toWindowRole));
      return;
    }

    const saved = toWindowRole(result.data);
    setRolesRows((prev) =>
      [...prev.filter((row) => row.id !== saved.id), saved].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
  };

  const handleDeleteRole = async (role: RolesWindowRole) => {
    clearRolesStatusMessage();
    setRolesDeleting(true);
    setRolesError(null);
    const result = await api.deleteRole(role.id);
    setRolesDeleting(false);

    if (!result.ok) {
      handleApiFailure(result, setRolesError);
      return;
    }

    flashRolesStatus('Role deleted.');

    const list = await api.listRoles();
    if (list.ok) {
      setRolesRows(list.data.map(toWindowRole));
    } else {
      setRolesRows((prev) => prev.filter((row) => row.id !== role.id));
    }
  };

  const handleSaveUser = async (payload: UserFormSavePayload) => {
    clearUsersStatusMessage();
    setUsersCreating(true);
    setUsersFormError(null);
    setUsersFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createUser({
            email: payload.email,
            password: payload.password ?? '',
            roleIds: payload.roleIds,
            siteAssignments: payload.siteAssignments,
          })
        : payload.userId != null
          ? await api.updateUser(payload.userId, {
              email: payload.email,
              roleIds: payload.roleIds,
              siteAssignments: payload.siteAssignments,
            })
          : null;

    setUsersCreating(false);

    if (!result) {
      setUsersFormError('User could not be saved.');
      return;
    }

    if (!result.ok) {
      if (result.error.fields) {
        setUsersFieldErrors({
          email: result.error.fields.email,
          password: result.error.fields.password,
          roleIds: result.error.fields.roleIds,
          siteAssignments: result.error.fields.siteAssignments,
        });
      }
      handleApiFailure(result, setUsersFormError);
      return;
    }

    flashUsersStatus(payload.mode === 'new' ? 'User created.' : 'User updated.');

    const list = await api.listUsers();
    if (list.ok) {
      setUsersRows(list.data.map(toWindowUser));
      return;
    }

    const saved = toWindowUser(result.data);
    setUsersRows((prev) =>
      [...prev.filter((row) => row.id !== saved.id), saved].sort((a, b) =>
        a.email.localeCompare(b.email),
      ),
    );
  };

  const handleDeleteUser = async (user: UsersWindowUser) => {
    clearUsersStatusMessage();
    setUsersDeleting(true);
    setUsersError(null);
    const result = await api.deleteUser(user.id);
    setUsersDeleting(false);

    if (!result.ok) {
      handleApiFailure(result, setUsersError);
      return;
    }

    flashUsersStatus('User deleted.');

    const list = await api.listUsers();
    if (list.ok) {
      setUsersRows(list.data.map(toWindowUser));
    } else {
      setUsersRows((prev) => prev.filter((row) => row.id !== user.id));
    }
  };

  const handleSetUserPassword = async (payload: SetPasswordSavePayload) => {
    clearUsersStatusMessage();
    setUsersSettingPassword(true);
    setUsersPasswordFormError(null);
    setUsersPasswordFieldErrors({});

    const result = await api.setUserPassword(payload.userId, {
      ...(payload.currentPassword !== undefined
        ? { currentPassword: payload.currentPassword }
        : {}),
      password: payload.password,
      confirmPassword: payload.password,
    });
    setUsersSettingPassword(false);

    if (!result.ok) {
      if (result.error.fields) {
        setUsersPasswordFieldErrors({
          currentPassword: result.error.fields.currentPassword,
          password: result.error.fields.password,
          confirmPassword: result.error.fields.confirmPassword,
        });
      }
      handleApiFailure(result, setUsersPasswordFormError);
      return;
    }

    flashUsersStatus('Password updated.');
  };

  const openMyAccount = useCallback(() => {
    setMyAccountFormError(null);
    setMyAccountFieldErrors({});
    setMyAccountAlert(null);
    setMyAccountOpen(true);
  }, []);

  const closeMyAccount = useCallback(() => {
    setMyAccountOpen(false);
    setMyAccountFormError(null);
    setMyAccountFieldErrors({});
  }, []);

  const handleMyAccountPassword = async (payload: SetPasswordSavePayload) => {
    setMyAccountSaving(true);
    setMyAccountFormError(null);
    setMyAccountFieldErrors({});

    const result = await api.setUserPassword(payload.userId, {
      currentPassword: payload.currentPassword ?? '',
      password: payload.password,
      confirmPassword: payload.password,
    });
    setMyAccountSaving(false);

    if (!result.ok) {
      if (result.error.fields) {
        setMyAccountFieldErrors({
          currentPassword: result.error.fields.currentPassword,
          password: result.error.fields.password,
          confirmPassword: result.error.fields.confirmPassword,
        });
      }
      handleApiFailure(result, setMyAccountFormError);
      return;
    }

    closeMyAccount();
  };

  const handleSaveHost = async (payload: HostFormSavePayload) => {
    clearHostsStatusMessage();
    setHostsCreating(true);
    setHostsFormError(null);
    setHostsFieldErrors({});

    const result =
      payload.mode === 'new'
        ? await api.createHost({
            host: payload.host,
            siteId: payload.siteId,
            surface: payload.surface,
            enabled: payload.enabled,
          })
        : payload.hostId != null
          ? await api.updateHost(payload.hostId, {
              host: payload.host,
              siteId: payload.siteId,
              surface: payload.surface,
              enabled: payload.enabled,
            })
          : null;

    setHostsCreating(false);

    if (!result) {
      setHostsFormError('Host could not be saved.');
      return;
    }

    if (!result.ok) {
      if (result.error.fields) {
        setHostsFieldErrors({
          host: result.error.fields.host,
          siteId: result.error.fields.siteId,
          surface: result.error.fields.surface,
          enabled: result.error.fields.enabled ?? result.error.fields.active,
        });
      }
      handleApiFailure(result, setHostsFormError);
      return;
    }

    if (result.data.sessionEnded && result.data.loginUrl) {
      assignSafeNavigationUrl(result.data.loginUrl, loginHref);
      return;
    }

    flashHostsStatus(payload.mode === 'new' ? 'Host created.' : 'Host updated.');

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

    await refreshSettings();
  };

  const handleDeleteHost = async (host: HostsWindowHost) => {
    clearHostsStatusMessage();
    setHostsDeleting(true);
    setHostsError(null);
    const result = await api.deleteHost(host.id);
    setHostsDeleting(false);

    if (!result.ok) {
      handleApiFailure(result, setHostsError);
      return;
    }

    if (result.data.sessionEnded && result.data.loginUrl) {
      assignSafeNavigationUrl(result.data.loginUrl, loginHref);
      return;
    }

    flashHostsStatus('Host deleted.');

    const list = await api.listHosts();
    if (list.ok) {
      setHostsRows(list.data.map(toWindowHost));
    } else {
      setHostsRows((prev) => prev.filter((row) => row.id !== host.id));
    }

    const sitesList = await api.listSites();
    if (sitesList.ok) {
      setSitesRows(sitesList.data.map(toWindowSite));
      setDesktopSites(sitesList.data.map(toDesktopSite));
    } else if (host.siteId != null) {
      setSitesRows((prev) =>
        prev.map((row) =>
          row.id === host.siteId
            ? { ...row, hostCount: Math.max(0, row.hostCount - 1) }
            : row,
        ),
      );
    }

    await refreshSettings();
  };

  const handleUnassignHost = async (hostId: number) => {
    clearSitesStatusMessage();
    setHostsUnassigning(true);
    setSitesFormError(null);
    const result = await api.unassignHost(hostId);
    setHostsUnassigning(false);

    if (!result.ok) {
      handleApiFailure(result, setSitesFormError);
      return;
    }

    if (result.data.sessionEnded && result.data.loginUrl) {
      assignSafeNavigationUrl(result.data.loginUrl, loginHref);
      return;
    }

    flashSitesStatus('Host removed from site.');

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
                status: row.verification,
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

    await refreshSettings();
  };

  const handleAssignHost = async (hostId: number, siteId: number) => {
    clearSitesStatusMessage();
    setHostsAssigning(true);
    setSitesFormError(null);
    const result = await api.assignHost(hostId, { siteId });
    setHostsAssigning(false);

    if (!result.ok) {
      handleApiFailure(result, setSitesFormError);
      return;
    }

    flashSitesStatus('Host assigned.');

    const list = await api.listHosts();
    if (list.ok) {
      setHostsRows(list.data.map(toWindowHost));
    } else {
      const assigned = toWindowHost(result.data);
      setHostsRows((prev) =>
        prev.map((row) => (row.id === assigned.id ? assigned : row)),
      );
    }

    const sitesList = await api.listSites();
    if (sitesList.ok) {
      setSitesRows(sitesList.data.map(toWindowSite));
      setDesktopSites(sitesList.data.map(toDesktopSite));
    }

    await refreshSettings();
  };

  const handleVerifyHost = async (host: HostsWindowHost) => {
    clearHostsStatusMessage();
    setHostsVerifying(true);
    setHostsError(null);
    const result = await api.verifyHost(host.id);
    setHostsVerifying(false);

    if (!result.ok) {
      handleApiFailure(result, setHostsError);
      return;
    }

    flashHostsStatus('Host verified.');

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

        const shellFrame = (
          child: ReactNode,
          options?: { resizable?: boolean },
        ) => {
          const shellResizable = options?.resizable !== false;
          return (
            <DesktopWindow
              key={win.id}
              windowId={win.id}
              left={win.left}
              top={win.top}
              zIndex={win.z}
              width={win.width}
              height={shellResizable ? win.height : undefined}
              maximized={shellResizable ? win.maximized : false}
              className={cn(win.minimized && 'is-minimized')}
              dragDisabled={win.minimized || (shellResizable && win.maximized)}
              resizable={shellResizable}
              onActivate={() => activateWindow(win.id)}
              onPositionChange={(left, top) => moveWindow(win.id, left, top)}
              onBoundsChange={
                shellResizable
                  ? (bounds) => resizeWindow(win.id, bounds)
                  : undefined
              }
              onToggleMaximize={
                shellResizable ? () => toggleMaximize(win.id) : undefined
              }
            >
              {child}
            </DesktopWindow>
          );
        };

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
              onOpenSettings={openSettings}
              onOpenPermissions={openPermissions}
              onOpenRoles={openRoles}
              onOpenUsers={openUsers}
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
              preferSelectedId={sitesPreferSelectedId}
              adminAccess={settings?.adminAccess ?? null}
              canEdit={canEditSites}
              loading={sitesLoading}
              saving={sitesCreating}
              deleting={sitesDeleting}
              error={sitesError}
              formError={sitesFormError}
              fieldErrors={sitesFieldErrors}
              statusMessage={sitesStatusMessage}
              onClearStatusMessage={clearSitesStatusMessage}
              onSave={handleSaveSite}
              onDelete={handleDeleteSite}
              onAddHost={openHosts}
              onAssignHost={handleAssignHost}
              onUnassignHost={handleUnassignHost}
              unassigning={hostsUnassigning}
              assigning={hostsAssigning}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissSitesAlert}
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
              preferSelectedId={hostsPreferSelectedId}
              adminAccess={settings?.adminAccess ?? null}
              canEdit={canEditHosts}
              loading={hostsLoading}
              saving={hostsCreating}
              deleting={hostsDeleting}
              verifying={hostsVerifying}
              error={hostsError}
              formError={hostsFormError}
              fieldErrors={hostsFieldErrors}
              statusMessage={hostsStatusMessage}
              onClearStatusMessage={clearHostsStatusMessage}
              onClearFormError={() => {
                setHostsFormError(null);
                setHostsFieldErrors({});
              }}
              onSave={handleSaveHost}
              onDelete={handleDeleteHost}
              onVerify={handleVerifyHost}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissHostsAlert}
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

        if (win.kind === 'settings') {
          return shellFrame(
            <SettingsWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              adminAccess={settings?.adminAccess ?? 'path'}
              domainAvailable={settings?.domainAvailable ?? false}
              symfonyDebugToolbar={settings?.symfonyDebugToolbar ?? true}
              symfonyDebugToolbarEditable={
                settings?.symfonyDebugToolbarEditable ?? false
              }
              canEdit={canEditSettings}
              loading={settingsLoading}
              saving={settingsSaving}
              error={settingsError}
              statusMessage={settingsStatusMessage}
              onClearStatusMessage={clearSettingsStatusMessage}
              onSave={handleSaveSettings}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissSettingsAlert}
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

        if (win.kind === 'site-settings') {
          const siteId = win.siteId ?? 0;
          const data = siteSettingsById[siteId];
          const site =
            desktopSites.find((entry) => entry.id === siteId) ?? {
              id: siteId,
              name: win.title.replace(/ — Settings$/, '') || 'Site',
            };
          return shellFrame(
            <SiteSettingsWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              siteName={data?.name ?? site.name}
              name={data?.name ?? site.name}
              description={data?.description ?? ''}
              themeId={data?.themeId ?? 'default'}
              protected={data?.protected ?? false}
              faviconMediaId={data?.faviconMediaId ?? null}
              favicon={data?.favicon ?? null}
              hosts={data?.hosts ?? []}
              assignments={data?.assignments ?? []}
              capabilities={
                data?.capabilities ?? { manageHosts: false, manageUsers: false }
              }
              canEdit={canEditSiteSettings}
              loading={siteSettingsLoadingId === siteId}
              saving={siteSettingsSavingId === siteId}
              error={siteSettingsError}
              statusMessage={siteSettingsStatusMessage}
              onClearStatusMessage={() => setSiteSettingsStatusMessage(null)}
              onSave={(patch) => {
                void handleSaveSiteSettings(siteId, patch);
              }}
              onManageHosts={() => {
                openHosts();
              }}
              onManageUsers={() => {
                openUsers();
              }}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={() => setSiteSettingsError(null)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onActivate={() => activateWindow(win.id)}
              width={win.width}
              style={{ height: '100%', minHeight: 0, width: '100%' }}
            />,
          );
        }

        if (win.kind === 'document-editor') {
          const siteId = win.siteId ?? 0;
          const nodeId = win.contentNodeId ?? 0;
          const key = documentCacheKey(siteId, nodeId);
          const data = documentsByKey[key];
          return shellFrame(
            <DocumentEditorWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              title={win.title}
              documentTitle={data?.title ?? win.title}
              bodyJson={data?.body ?? null}
              loading={documentLoadingKey === key}
              saving={documentSavingKey === key}
              canEdit={canEditDocuments}
              error={documentError}
              statusMessage={documentStatusMessage}
              onClearStatusMessage={() => setDocumentStatusMessage(null)}
              onSave={(payload) => {
                void handleSaveDocument(siteId, nodeId, payload);
              }}
              errorSoundUrl={errorSoundUrl}
              onAlertClose={() => setDocumentError(null)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => toggleMaximize(win.id)}
              onActivate={() => activateWindow(win.id)}
              width={win.width}
              style={{ height: '100%', minHeight: 0, width: '100%' }}
            />,
          );
        }

        if (win.kind === 'permissions') {
          return shellFrame(
            <PermissionsWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              permissions={permissionsRows}
              preferSelectedId={permissionsPreferSelectedId}
              canEdit={canEditPermissions}
              loading={permissionsLoading}
              saving={permissionsCreating}
              deleting={permissionsDeleting}
              error={permissionsError}
              formError={permissionsFormError}
              fieldErrors={permissionsFieldErrors}
              statusMessage={permissionsStatusMessage}
              onClearStatusMessage={clearPermissionsStatusMessage}
              onSave={handleSavePermission}
              onDelete={handleDeletePermission}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissPermissionsAlert}
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

        if (win.kind === 'roles') {
          return shellFrame(
            <RolesWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              maximized={win.maximized}
              roles={rolesRows}
              permissions={rolesPermissionOptions}
              preferSelectedId={rolesPreferSelectedId}
              canEdit={canEditRoles}
              loading={rolesLoading}
              saving={rolesCreating}
              deleting={rolesDeleting}
              error={rolesError}
              formError={rolesFormError}
              fieldErrors={rolesFieldErrors}
              statusMessage={rolesStatusMessage}
              onClearStatusMessage={clearRolesStatusMessage}
              onSave={handleSaveRole}
              onDelete={handleDeleteRole}
              onAddPermission={openPermissions}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissRolesAlert}
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

        if (win.kind === 'users') {
          return shellFrame(
            <UsersWindow
              className={cn(win.maximized && 'is-maximized')}
              inactive={!active}
              users={usersRows}
              roles={usersRoleOptions}
              sites={usersSiteOptions}
              preferSelectedId={usersPreferSelectedId}
              currentUserId={currentUserId}
              capabilities={usersCaps}
              loading={usersLoading}
              saving={usersCreating}
              deleting={usersDeleting}
              settingPassword={usersSettingPassword}
              error={usersError}
              formError={usersFormError}
              fieldErrors={usersFieldErrors}
              passwordFormError={usersPasswordFormError}
              passwordFieldErrors={usersPasswordFieldErrors}
              statusMessage={usersStatusMessage}
              onClearStatusMessage={clearUsersStatusMessage}
              onSave={handleSaveUser}
              onDelete={handleDeleteUser}
              onSetPassword={handleSetUserPassword}
              onAddRole={openRoles}
              errorSoundUrl={errorSoundUrl}
              dingSoundUrl={dingSoundUrl}
              onAlertClose={dismissUsersAlert}
              onClose={() => closeWindow(win.id)}
              onCancel={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onActivate={() => activateWindow(win.id)}
              width={win.width}
            />,
            { resizable: false },
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
            api={canEditSites ? api : undefined}
            siteId={typeof site.id === 'number' ? site.id : Number(site.id)}
            siteName={site.name}
            tree={explorerTreeForSite(site)}
            onOpenSiteSettings={() => openSiteSettings(site)}
            onOpenDocument={(item) => {
              const ref = parseExplorerEntityId(item.id);
              if (ref?.type !== 'node') {
                return;
              }
              openDocumentEditor(site, ref.id, item.label);
            }}
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
            onOpenMyAccount={openMyAccount}
            logoutHref={logoutHref}
          />
        }
      />

      {myAccountOpen && currentUserId != null && currentUserEmail ? (
        <DesktopModal dingSoundUrl={dingSoundUrl}>
          <SetPasswordDialog
            key={`my-account-${currentUserId}`}
            userId={currentUserId}
            userEmail={currentUserEmail}
            mode="self"
            fieldErrors={myAccountFieldErrors}
            saving={myAccountSaving}
            onSave={handleMyAccountPassword}
            onError={(message) => setMyAccountAlert(message)}
            onClose={closeMyAccount}
          />
        </DesktopModal>
      ) : null}

      {myAccountAlert || myAccountFormError ? (
        <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
          <MessageDialog
            type="error"
            title="Error"
            message={myAccountAlert ?? myAccountFormError ?? ''}
            onClose={() => {
              setMyAccountAlert(null);
              setMyAccountFormError(null);
            }}
          />
        </DesktopModal>
      ) : null}
    </div>
  );
}
