import type {
  AdminApiErrorBody,
  AdminApiHost,
  AdminApiResult,
  AdminApiSite,
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
  surface?: 'admin' | 'site' | 'api';
  active?: boolean;
};

export type UpdateHostBody = {
  host?: string;
  siteId?: number | null;
  surface?: 'admin' | 'site' | 'api';
  active?: boolean;
};

const DEFAULT_BASE = '/admin/api';

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function parseResult<T>(response: Response): Promise<AdminApiResult<T>> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
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
    });

    return parseResult<T>(response);
  }

  return {
    listSites: () => request<AdminApiSite[]>('/sites'),
    createSite: (body: CreateSiteBody) =>
      request<AdminApiSite>('/sites', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listHosts: () => request<AdminApiHost[]>('/hosts'),
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
    unassignHost: (id: number) =>
      request<AdminApiHost>(`/hosts/${id}/unassign`, {
        method: 'POST',
      }),
  };
}

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;
