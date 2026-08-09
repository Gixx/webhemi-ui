import { http, HttpResponse, type RequestHandler } from 'msw';
import type {
  AdminApiHost,
  AdminApiSettings,
  AdminApiSite,
} from '../types';
import {
  MSW_DEFAULT_SETTINGS,
  MSW_SAMPLE_HOSTS,
  MSW_SAMPLE_SITES,
} from './fixtures';

export type AdminApiMswStore = {
  sites: AdminApiSite[];
  hosts: AdminApiHost[];
  settings: AdminApiSettings;
};

export type CreateAdminApiHandlersOptions = {
  sites?: AdminApiSite[];
  hosts?: AdminApiHost[];
  settings?: AdminApiSettings;
  /** When true, GET /sites returns 500. */
  failListSites?: boolean;
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
    settings: structuredClone(options.settings ?? MSW_DEFAULT_SETTINGS),
  };

  const failListSites = Boolean(options.failListSites);

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
