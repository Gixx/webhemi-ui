import { http, HttpResponse, type RequestHandler } from 'msw';
import type { AdminApiHost, AdminApiPermission, AdminApiSettings, AdminApiSite } from '../types';
import {
  MSW_DEFAULT_SETTINGS,
  MSW_SAMPLE_HOSTS,
  MSW_SAMPLE_PERMISSIONS,
  MSW_SAMPLE_SITES,
} from './fixtures';

export type AdminApiMswStore = {
  sites: AdminApiSite[];
  hosts: AdminApiHost[];
  permissions: AdminApiPermission[];
  settings: AdminApiSettings;
};

export type CreateAdminApiHandlersOptions = {
  sites?: AdminApiSite[];
  hosts?: AdminApiHost[];
  permissions?: AdminApiPermission[];
  settings?: AdminApiSettings;
  /** When true, GET /sites returns 500. */
  failListSites?: boolean;
  /** When true, GET /permissions returns 500. */
  failListPermissions?: boolean;
};

/**
 * In-memory `/admin/api` handlers for Storybook (MSW).
 * Co-located under `admin/api/msw` — not part of package `exports` / `dist`.
 */
export function createAdminApiHandlers(
  options: CreateAdminApiHandlersOptions = {},
): RequestHandler[] {
  const store: AdminApiMswStore = {
    sites: structuredClone(options.sites ?? MSW_SAMPLE_SITES),
    hosts: structuredClone(options.hosts ?? MSW_SAMPLE_HOSTS),
    permissions: structuredClone(options.permissions ?? MSW_SAMPLE_PERMISSIONS),
    settings: structuredClone(options.settings ?? MSW_DEFAULT_SETTINGS),
  };

  const failListSites = Boolean(options.failListSites);
  const failListPermissions = Boolean(options.failListPermissions);

  return [
    http.get('/admin/api/sites', () => {
      if (failListSites) {
        return HttpResponse.json(
          {
            error: {
              code: 'server_error',
              message: 'Could not load sites. Try again.',
            },
          },
          { status: 500 },
        );
      }
      return HttpResponse.json({ data: store.sites });
    }),

    http.get('/admin/api/sites/:id', ({ params }) => {
      const id = Number(params.id);
      const site = store.sites.find((row) => row.id === id);
      if (!site) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Site not found.' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: site });
    }),

    http.post('/admin/api/sites', async ({ request }) => {
      const body = (await request.json()) as {
        name?: string;
        slug?: string;
        enabled?: boolean;
      };
      if (!body.name?.trim() || !body.slug?.trim()) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Name and slug are required.',
              fields: {
                ...(body.name?.trim() ? {} : { name: 'Name is required.' }),
                ...(body.slug?.trim() ? {} : { slug: 'Slug is required.' }),
              },
            },
          },
          { status: 422 },
        );
      }
      if (store.sites.some((row) => row.slug === body.slug)) {
        return HttpResponse.json(
          {
            error: {
              code: 'slug_taken',
              message: 'A site with this slug already exists.',
              fields: { slug: 'Slug is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const created: AdminApiSite = {
        id: Math.max(0, ...store.sites.map((row) => row.id)) + 1,
        name: body.name.trim(),
        slug: body.slug.trim(),
        enabled: body.enabled ?? true,
        protected: false,
        hostCount: 0,
      };
      store.sites = [...store.sites, created];
      return HttpResponse.json({ data: created }, { status: 201 });
    }),

    http.patch('/admin/api/sites/:id', async ({ params, request }) => {
      const id = Number(params.id);
      const existing = store.sites.find((row) => row.id === id);
      if (!existing) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Site not found.' } },
          { status: 404 },
        );
      }
      const body = (await request.json()) as {
        name?: string;
        slug?: string;
        enabled?: boolean;
      };
      if (
        body.slug != null &&
        store.sites.some((row) => row.slug === body.slug && row.id !== id)
      ) {
        return HttpResponse.json(
          {
            error: {
              code: 'slug_taken',
              message: 'A site with this slug already exists.',
              fields: { slug: 'Slug is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const updated: AdminApiSite = {
        ...existing,
        name: body.name ?? existing.name,
        slug: body.slug ?? existing.slug,
        enabled: body.enabled ?? existing.enabled,
      };
      store.sites = store.sites.map((row) => (row.id === id ? updated : row));
      return HttpResponse.json({ data: updated });
    }),

    http.delete('/admin/api/sites/:id', ({ params }) => {
      const id = Number(params.id);
      const existing = store.sites.find((row) => row.id === id);
      if (!existing) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Site not found.' } },
          { status: 404 },
        );
      }
      if (store.hosts.some((row) => row.siteId === id)) {
        return HttpResponse.json(
          {
            error: {
              code: 'hosts_assigned',
              message: 'Unassign or delete hosts before deleting this site.',
            },
          },
          { status: 409 },
        );
      }
      store.sites = store.sites.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),

    http.get('/admin/api/hosts', () => {
      return HttpResponse.json({ data: store.hosts });
    }),

    http.get('/admin/api/hosts/:id', ({ params }) => {
      const id = Number(params.id);
      const host = store.hosts.find((row) => row.id === id);
      if (!host) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Host not found.' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: host });
    }),

    http.post('/admin/api/hosts', async ({ request }) => {
      const body = (await request.json()) as {
        host?: string;
        surface?: 'admin' | 'site';
        enabled?: boolean;
      };
      if (!body.host?.trim()) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Host is required.',
              fields: { host: 'Host is required.' },
            },
          },
          { status: 422 },
        );
      }
      const created: AdminApiHost = {
        id: Math.max(0, ...store.hosts.map((row) => row.id)) + 1,
        host: body.host.trim(),
        siteId: null,
        siteSlug: null,
        siteName: null,
        surface: body.surface ?? 'site',
        verification: 'pending',
        enabled: body.enabled ?? true,
        protected: false,
      };
      store.hosts = [...store.hosts, created];
      return HttpResponse.json({ data: created }, { status: 201 });
    }),

    http.get('/admin/api/settings', () => {
      return HttpResponse.json({ data: store.settings });
    }),

    http.patch('/admin/api/settings', async ({ request }) => {
      const body = (await request.json()) as {
        adminAccess?: 'path' | 'domain';
      };
      if (body.adminAccess !== 'path' && body.adminAccess !== 'domain') {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Invalid admin access mode.',
            },
          },
          { status: 422 },
        );
      }
      store.settings = {
        ...store.settings,
        adminAccess: body.adminAccess,
        effectiveAdminAccess: body.adminAccess,
      };
      return HttpResponse.json({ data: store.settings });
    }),

    http.get('/admin/api/permissions', () => {
      if (failListPermissions) {
        return HttpResponse.json(
          {
            error: {
              code: 'server_error',
              message: 'Could not load permissions. Try again.',
            },
          },
          { status: 500 },
        );
      }
      return HttpResponse.json({ data: store.permissions });
    }),

    http.get('/admin/api/permissions/:id', ({ params }) => {
      const id = Number(params.id);
      const permission = store.permissions.find((row) => row.id === id);
      if (!permission) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Permission not found.' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: permission });
    }),

    http.post('/admin/api/permissions', async ({ request }) => {
      const body = (await request.json()) as {
        name?: string;
        label?: string;
        description?: string;
      };
      const name = body.name?.trim().toLowerCase() ?? '';
      const label = body.label?.trim() ?? '';
      const description = body.description?.trim() ?? '';
      if (!name || !label) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Name and label are required.',
              fields: {
                ...(name ? {} : { name: 'Name is required.' }),
                ...(label ? {} : { label: 'Label is required.' }),
              },
            },
          },
          { status: 422 },
        );
      }
      if (store.permissions.some((row) => row.name === name)) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'A permission with this name already exists.',
              fields: { name: 'Name is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const created: AdminApiPermission = {
        id: Math.max(0, ...store.permissions.map((row) => row.id)) + 1,
        name,
        label,
        description,
      };
      store.permissions = [...store.permissions, created].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return HttpResponse.json({ data: created }, { status: 201 });
    }),

    http.patch('/admin/api/permissions/:id', async ({ params, request }) => {
      const id = Number(params.id);
      const index = store.permissions.findIndex((row) => row.id === id);
      if (index < 0) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Permission not found.' } },
          { status: 404 },
        );
      }
      const body = (await request.json()) as {
        name?: string;
        label?: string;
        description?: string;
      };
      const current = store.permissions[index];
      const name =
        body.name !== undefined ? body.name.trim().toLowerCase() : current.name;
      const label = body.label !== undefined ? body.label.trim() : current.label;
      const description =
        body.description !== undefined
          ? body.description.trim()
          : current.description;
      if (!name || !label) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Name and label are required.',
              fields: {
                ...(name ? {} : { name: 'Name is required.' }),
                ...(label ? {} : { label: 'Label is required.' }),
              },
            },
          },
          { status: 422 },
        );
      }
      if (store.permissions.some((row) => row.name === name && row.id !== id)) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'A permission with this name already exists.',
              fields: { name: 'Name is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const updated: AdminApiPermission = { ...current, name, label, description };
      store.permissions = store.permissions
        .map((row) => (row.id === id ? updated : row))
        .sort((a, b) => a.name.localeCompare(b.name));
      return HttpResponse.json({ data: updated });
    }),

    http.delete('/admin/api/permissions/:id', ({ params }) => {
      const id = Number(params.id);
      if (!store.permissions.some((row) => row.id === id)) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Permission not found.' } },
          { status: 404 },
        );
      }
      store.permissions = store.permissions.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Empty Sites list (still returns hosts/settings). */
export function createEmptySitesHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ sites: [], hosts: [] });
}

/** List Sites fails with 500. */
export function createFailingSitesListHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ failListSites: true });
}

/** Empty Permissions list. */
export function createEmptyPermissionsHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ permissions: [] });
}

/** List Permissions fails with 500. */
export function createFailingPermissionsListHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ failListPermissions: true });
}
