import type {
  AdminApiContentNode,
  AdminApiErrorBody,
  AdminApiExplorerItem,
  AdminApiHost,
  AdminApiHostDeleteResult,
  AdminApiMediaAsset,
  AdminApiMe,
  AdminApiPermission,
  AdminApiPurgeResult,
  AdminApiResult,
  AdminApiRole,
  AdminApiSettings,
  AdminApiSite,
  AdminApiSiteSettings,
  AdminApiTrashPayload,
  AdminApiUser,
  AdminApiFailure,
} from './types';

export type AdminApiClientOptions = {
  /** Default `/admin/api`. */
  baseUrl?: string;
  /** CSRF token for mutating requests (`X-CSRF-TOKEN` / id `admin_api`). */
  csrfToken?: string;
  /** Injected `fetch` (Storybook / tests). */
  fetch?: typeof globalThis.fetch;
};

export type CreateSiteBody = {
  name: string;
  slug: string;
  enabled?: boolean;
};

export type CreateHostBody = {
  host: string;
  siteId?: number | null;
  surface?: 'admin' | 'site';
  enabled?: boolean;
};

export type UpdateSiteBody = {
  name?: string;
  slug?: string;
  enabled?: boolean;
};

export type UpdateHostBody = {
  host?: string;
  siteId?: number | null;
  surface?: 'admin' | 'site';
  enabled?: boolean;
};

export type UpdateSettingsBody = {
  adminAccess?: 'path' | 'domain';
  symfonyDebugToolbar?: boolean;
};

export type CreatePermissionBody = {
  name: string;
  label: string;
  description?: string;
};

export type UpdatePermissionBody = {
  name?: string;
  label?: string;
  description?: string;
};

export type CreateRoleBody = {
  name: string;
  label: string;
  description?: string;
  permissionIds?: number[];
};

export type UpdateRoleBody = {
  name?: string;
  label?: string;
  description?: string;
  permissionIds?: number[];
};

export type CreateUserSiteAssignmentBody = {
  siteId: number;
  roleId: number;
};

export type CreateUserBody = {
  email: string;
  password: string;
  roleIds?: number[];
  siteAssignments?: CreateUserSiteAssignmentBody[];
};

export type UpdateUserBody = {
  email?: string;
  roleIds?: number[];
  siteAssignments?: CreateUserSiteAssignmentBody[];
};

export type SetUserPasswordBody = {
  currentPassword?: string;
  password: string;
  confirmPassword?: string;
};

export type CreateContentNodeBody = {
  kind: 'folder' | 'document' | 'media_ref' | 'redirect';
  slug: string;
  title: string;
  tree?: 'site' | 'media';
  parentId?: number | null;
  folderType?: 'normal' | 'locale' | null;
  body?: string | null;
  redirectTarget?: string | null;
  mediaAssetId?: number | null;
  publication?: 'draft' | 'published' | 'scheduled';
  publishAt?: string | null;
  hidden?: boolean;
  sortOrder?: number;
};

export type UpdateContentNodeBody = {
  parentId?: number | null;
  slug?: string;
  title?: string;
  folderType?: 'normal' | 'locale' | null;
  body?: string | null;
  redirectTarget?: string | null;
  mediaAssetId?: number | null;
  publication?: 'draft' | 'published' | 'scheduled';
  publishAt?: string | null;
  hidden?: boolean;
  sortOrder?: number;
};

export type UpdateSiteSettingsBody = {
  name?: string;
  description?: string | null;
  faviconMediaId?: number | null;
};

const DEFAULT_BASE = '/admin/api';

const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please sign in again.';

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function unauthorizedResult(): AdminApiFailure {
  return {
    ok: false,
    status: 401,
    error: {
      code: 'unauthorized',
      message: SESSION_EXPIRED_MESSAGE,
    },
  };
}

function pathLooksLikeLogin(urlOrPath: string): boolean {
  try {
    const path = new URL(urlOrPath, 'http://localhost').pathname;
    return path === '/login' || path.endsWith('/login');
  } catch {
    return /\/login(?:\?|$)/.test(urlOrPath);
  }
}

/**
 * Session lost: 401, opaque redirect, or 3xx Location → /login.
 * (With `redirect: 'manual'`, the firewall's form_login bounce is not followed.)
 */
function isAuthFailureResponse(response: Response): boolean {
  if (response.status === 401) {
    return true;
  }
  if (response.type === 'opaqueredirect') {
    return true;
  }
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('Location');
    return location != null && pathLooksLikeLogin(location);
  }
  if (response.url && pathLooksLikeLogin(response.url)) {
    return true;
  }
  return false;
}

async function parseResult<T>(response: Response): Promise<AdminApiResult<T>> {
  if (isAuthFailureResponse(response)) {
    return unauthorizedResult();
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (response.status === 401 || (response.url && pathLooksLikeLogin(response.url))) {
      return unauthorizedResult();
    }
    return {
      ok: false,
      status: response.status,
      error: {
        code: 'invalid_json',
        message: 'Server returned a non-JSON response.',
      },
    };
  }

  if (response.ok) {
    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? (payload as { data: T }).data
        : (payload as T);
    return { ok: true, status: response.status, data };
  }

  const error =
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    (payload as { error: unknown }).error &&
    typeof (payload as { error: unknown }).error === 'object'
      ? ((payload as { error: AdminApiErrorBody }).error)
      : {
          code: 'http_error',
          message: `Request failed (${response.status}).`,
        };

  return {
    ok: false,
    status: response.status,
    error: {
      code: typeof error.code === 'string' ? error.code : 'http_error',
      message:
        typeof error.message === 'string'
          ? error.message
          : `Request failed (${response.status}).`,
      fields:
        error.fields && typeof error.fields === 'object'
          ? (error.fields as Record<string, string>)
          : undefined,
    },
  };
}

/**
 * Thin same-origin client for `/admin/api`. Session cookie + optional CSRF header.
 */
export function createAdminApiClient(options: AdminApiClientOptions = {}) {
  const baseUrl = normalizeBase(options.baseUrl ?? DEFAULT_BASE);
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const csrfToken = options.csrfToken;

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<AdminApiResult<T>> {
    const headers = new Headers(init.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (init.body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const method = (init.method ?? 'GET').toUpperCase();
    if (csrfToken && method !== 'GET' && method !== 'HEAD') {
      headers.set('X-CSRF-TOKEN', csrfToken);
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
      // Detect form_login bounce to /login or /admin/login instead of parsing HTML as JSON.
      redirect: 'manual',
    });

    return parseResult<T>(response);
  }

  async function requestMultipart<T>(
    path: string,
    form: FormData,
  ): Promise<AdminApiResult<T>> {
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    if (csrfToken) {
      headers.set('X-CSRF-TOKEN', csrfToken);
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: form,
      credentials: 'same-origin',
      redirect: 'manual',
    });

    return parseResult<T>(response);
  }

  return {
    listSites: () => request<AdminApiSite[]>('/sites'),
    getSite: (id: number) => request<AdminApiSite>(`/sites/${id}`),
    createSite: (body: CreateSiteBody) =>
      request<AdminApiSite>('/sites', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateSite: (id: number, body: UpdateSiteBody) =>
      request<AdminApiSite>(`/sites/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteSite: (id: number) =>
      request<undefined>(`/sites/${id}`, {
        method: 'DELETE',
      }),
    listHosts: () => request<AdminApiHost[]>('/hosts'),
    getHost: (id: number) => request<AdminApiHost>(`/hosts/${id}`),
    createHost: (body: CreateHostBody) =>
      request<AdminApiHost>('/hosts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateHost: (id: number, body: UpdateHostBody) =>
      request<AdminApiHost>(`/hosts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteHost: (id: number) =>
      request<AdminApiHostDeleteResult>(`/hosts/${id}`, {
        method: 'DELETE',
      }),
    unassignHost: (id: number) =>
      request<AdminApiHost>(`/hosts/${id}/unassign`, {
        method: 'POST',
      }),
    verifyHost: (id: number) =>
      request<AdminApiHost>(`/hosts/${id}/verify`, {
        method: 'POST',
      }),
    assignHost: (id: number, body: { siteId: number }) =>
      request<AdminApiHost>(`/hosts/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getSettings: () => request<AdminApiSettings>('/settings'),
    updateSettings: (body: UpdateSettingsBody) =>
      request<AdminApiSettings>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    listPermissions: () => request<AdminApiPermission[]>('/permissions'),
    getPermission: (id: number) => request<AdminApiPermission>(`/permissions/${id}`),
    createPermission: (body: CreatePermissionBody) =>
      request<AdminApiPermission>('/permissions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updatePermission: (id: number, body: UpdatePermissionBody) =>
      request<AdminApiPermission>(`/permissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deletePermission: (id: number) =>
      request<undefined>(`/permissions/${id}`, {
        method: 'DELETE',
      }),
    listRoles: () => request<AdminApiRole[]>('/roles'),
    getRole: (id: number) => request<AdminApiRole>(`/roles/${id}`),
    createRole: (body: CreateRoleBody) =>
      request<AdminApiRole>('/roles', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateRole: (id: number, body: UpdateRoleBody) =>
      request<AdminApiRole>(`/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteRole: (id: number) =>
      request<undefined>(`/roles/${id}`, {
        method: 'DELETE',
      }),
    listUsers: () => request<AdminApiUser[]>('/users'),
    getUser: (id: number) => request<AdminApiUser>(`/users/${id}`),
    createUser: (body: CreateUserBody) =>
      request<AdminApiUser>('/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateUser: (id: number, body: UpdateUserBody) =>
      request<AdminApiUser>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteUser: (id: number) =>
      request<undefined>(`/users/${id}`, {
        method: 'DELETE',
      }),
    setUserPassword: (id: number, body: SetUserPasswordBody) =>
      request<{ ok: true }>(`/users/${id}/password`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getMe: () => request<AdminApiMe>('/me'),

    getExplorerForest: (siteId: number) =>
      request<AdminApiExplorerItem[]>(`/sites/${siteId}/explorer`),
    getContentTrash: (siteId: number) =>
      request<AdminApiTrashPayload>(`/sites/${siteId}/trash`),
    getContentNode: (siteId: number, nodeId: number) =>
      request<AdminApiContentNode>(`/sites/${siteId}/nodes/${nodeId}`),
    createContentNode: (siteId: number, body: CreateContentNodeBody) =>
      request<AdminApiContentNode>(`/sites/${siteId}/nodes`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateContentNode: (siteId: number, nodeId: number, body: UpdateContentNodeBody) =>
      request<AdminApiContentNode>(`/sites/${siteId}/nodes/${nodeId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteContentNode: (siteId: number, nodeId: number) =>
      request<AdminApiContentNode>(`/sites/${siteId}/nodes/${nodeId}`, {
        method: 'DELETE',
      }),
    restoreContentNode: (siteId: number, nodeId: number) =>
      request<AdminApiContentNode>(`/sites/${siteId}/nodes/${nodeId}/restore`, {
        method: 'POST',
      }),
    purgeContentNode: (siteId: number, nodeId: number) =>
      request<AdminApiPurgeResult>(`/sites/${siteId}/nodes/${nodeId}/purge`, {
        method: 'DELETE',
      }),
    uploadMedia: (siteId: number, file: File, folderNodeId?: number | null) => {
      const form = new FormData();
      form.append('file', file);
      if (folderNodeId != null) {
        form.append('folderNodeId', String(folderNodeId));
      }
      return requestMultipart<AdminApiMediaAsset>(`/sites/${siteId}/media`, form);
    },
    deleteMedia: (siteId: number, mediaId: number) =>
      request<AdminApiMediaAsset>(`/sites/${siteId}/media/${mediaId}`, {
        method: 'DELETE',
      }),
    restoreMedia: (siteId: number, mediaId: number) =>
      request<AdminApiMediaAsset>(`/sites/${siteId}/media/${mediaId}/restore`, {
        method: 'POST',
      }),
    purgeMedia: (siteId: number, mediaId: number) =>
      request<AdminApiPurgeResult>(`/sites/${siteId}/media/${mediaId}/purge`, {
        method: 'DELETE',
      }),
    getSiteSettings: (siteId: number) =>
      request<AdminApiSiteSettings>(`/sites/${siteId}/settings`),
    updateSiteSettings: (siteId: number, body: UpdateSiteSettingsBody) =>
      request<AdminApiSiteSettings>(`/sites/${siteId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  };
}

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;

export function isUnauthorizedResult(result: AdminApiResult<unknown>): boolean {
  return (
    !result.ok &&
    (result.status === 401 || result.error.code === 'unauthorized')
  );
}

export { SESSION_EXPIRED_MESSAGE };
