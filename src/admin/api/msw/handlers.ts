import { http, HttpResponse, type RequestHandler } from 'msw';
import type {
  AdminApiHost,
  AdminApiPermission,
  AdminApiRole,
  AdminApiSettings,
  AdminApiSite,
  AdminApiUser,
  AdminApiUserSiteAssignment,
} from '../types';
import {
  MSW_DEFAULT_SETTINGS,
  MSW_SAMPLE_HOSTS,
  MSW_SAMPLE_PERMISSIONS,
  MSW_SAMPLE_ROLES,
  MSW_SAMPLE_SITES,
  MSW_SAMPLE_USERS,
} from './fixtures';

export type AdminApiMswStore = {
  sites: AdminApiSite[];
  hosts: AdminApiHost[];
  permissions: AdminApiPermission[];
  roles: AdminApiRole[];
  users: AdminApiUser[];
  settings: AdminApiSettings;
  /** Simulated signed-in user id for self_delete checks (default first admin). */
  actorUserId: number;
};

export type CreateAdminApiHandlersOptions = {
  sites?: AdminApiSite[];
  hosts?: AdminApiHost[];
  permissions?: AdminApiPermission[];
  roles?: AdminApiRole[];
  users?: AdminApiUser[];
  settings?: AdminApiSettings;
  actorUserId?: number;
  /** When true, GET /sites returns 500. */
  failListSites?: boolean;
  /** When true, GET /permissions returns 500. */
  failListPermissions?: boolean;
  /** When true, GET /roles returns 500. */
  failListRoles?: boolean;
  /** When true, GET /users returns 500. */
  failListUsers?: boolean;
};

const ROLE_NAME_PATTERN = /^ROLE_[A-Z0-9_]+$/;
const RESERVED_ROLE_NAMES = new Set(['ROLE_ADMIN', 'ROLE_SITE_ADMIN']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRoleName(raw: string): string {
  return raw.trim().toUpperCase();
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizePermissionIds(
  raw: number[] | undefined,
  permissions: AdminApiPermission[],
): number[] {
  if (!raw) {
    return [];
  }
  const valid = new Set(permissions.map((row) => row.id));
  return [...new Set(raw.filter((id) => valid.has(id)))].sort((a, b) => a - b);
}

function countAdmins(users: AdminApiUser[], excludeId?: number): number {
  return users.filter(
    (user) =>
      user.id !== excludeId &&
      user.roles.some((role) => role.name === 'ROLE_ADMIN'),
  ).length;
}

function buildUserRoles(
  roleIds: number[],
  roles: AdminApiRole[],
): { ok: true; roles: AdminApiUser['roles']; roleIds: number[] } | { ok: false; message: string } {
  const resolved: AdminApiUser['roles'] = [];
  const ids: number[] = [];
  for (const id of roleIds) {
    const role = roles.find((row) => row.id === id);
    if (!role) {
      return { ok: false, message: 'One or more roles were not found.' };
    }
    if (role.name === 'ROLE_SITE_ADMIN') {
      return {
        ok: false,
        message: 'Site Admin cannot be assigned as a global role; use siteAssignments.',
      };
    }
    ids.push(role.id);
    resolved.push({ id: role.id, name: role.name, label: role.label });
  }
  resolved.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, roles: resolved, roleIds: [...new Set(ids)].sort((a, b) => a - b) };
}

function buildSiteAssignments(
  raw: { siteId: number; roleId: number }[] | undefined,
  sites: AdminApiSite[],
  roles: AdminApiRole[],
  nextAssignmentId: number,
):
  | { ok: true; assignments: AdminApiUserSiteAssignment[]; nextId: number }
  | { ok: false; code: string; message: string; fields?: Record<string, string> } {
  if (!raw) {
    return { ok: true, assignments: [], nextId: nextAssignmentId };
  }
  const siteIds = raw.map((row) => row.siteId);
  if (siteIds.length !== new Set(siteIds).size) {
    return {
      ok: false,
      code: 'validation_failed',
      message: 'User could not be saved.',
      fields: {
        siteAssignments: 'Each site may appear only once in siteAssignments.',
      },
    };
  }
  const assignments: AdminApiUserSiteAssignment[] = [];
  let id = nextAssignmentId;
  for (const row of raw) {
    const site = sites.find((entry) => entry.id === row.siteId);
    if (!site) {
      return {
        ok: false,
        code: 'site_not_found',
        message: 'One or more sites were not found.',
      };
    }
    const role = roles.find((entry) => entry.id === row.roleId);
    if (!role) {
      return {
        ok: false,
        code: 'invalid_role',
        message: 'One or more roles were not found.',
      };
    }
    if (role.name === 'ROLE_ADMIN') {
      return {
        ok: false,
        code: 'invalid_role',
        message: 'Administrator cannot be used as a site assignment role.',
      };
    }
    assignments.push({
      id,
      siteId: site.id,
      siteName: site.name,
      roleId: role.id,
      roleName: role.name,
      roleLabel: role.label,
    });
    id += 1;
  }
  assignments.sort((a, b) => a.siteName.localeCompare(b.siteName));
  return { ok: true, assignments, nextId: id };
}

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
    roles: structuredClone(options.roles ?? MSW_SAMPLE_ROLES),
    users: structuredClone(options.users ?? MSW_SAMPLE_USERS),
    settings: structuredClone(options.settings ?? MSW_DEFAULT_SETTINGS),
    actorUserId: options.actorUserId ?? 1,
  };

  let nextSiteAssignmentId =
    Math.max(
      0,
      ...store.users.flatMap((user) =>
        user.siteAssignments.map((row) => row.id),
      ),
    ) + 1;

  const failListSites = Boolean(options.failListSites);
  const failListPermissions = Boolean(options.failListPermissions);
  const failListRoles = Boolean(options.failListRoles);
  const failListUsers = Boolean(options.failListUsers);

  return [
    http.get('/admin/api/me', () => {
      const actor =
        store.users.find((row) => row.id === store.actorUserId) ??
        store.users[0] ??
        null;
      const isAdmin = Boolean(
        actor?.roles.some((role) => role.name === 'ROLE_ADMIN'),
      );
      return HttpResponse.json({
        user: actor?.email ?? null,
        id: actor?.id ?? null,
        email: actor?.email ?? null,
        roles: actor
          ? [
              ...actor.roles.map((role) => role.name),
              'ROLE_USER',
            ]
          : ['ROLE_USER'],
        capabilities: {
          listUsers: isAdmin,
          viewUser: isAdmin,
          createUser: isAdmin,
          editUser: isAdmin,
          deleteUser: isAdmin,
        },
      });
    }),

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
        symfonyDebugToolbar?: boolean;
      };
      const hasAccess =
        body.adminAccess === 'path' || body.adminAccess === 'domain';
      const hasToolbar = typeof body.symfonyDebugToolbar === 'boolean';
      if (!hasAccess && !hasToolbar) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Invalid settings payload.',
            },
          },
          { status: 422 },
        );
      }
      if (
        hasToolbar &&
        store.settings.symfonyDebugToolbarEditable === false
      ) {
        return HttpResponse.json(
          {
            error: {
              code: 'toolbar_not_editable',
              message:
                'Symfony debug toolbar can only be changed in the dev or stage environment.',
            },
          },
          { status: 422 },
        );
      }
      store.settings = {
        ...store.settings,
        ...(hasAccess
          ? {
              adminAccess: body.adminAccess!,
              effectiveAdminAccess: body.adminAccess!,
            }
          : {}),
        ...(hasToolbar
          ? { symfonyDebugToolbar: body.symfonyDebugToolbar! }
          : {}),
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

    http.get('/admin/api/roles', () => {
      if (failListRoles) {
        return HttpResponse.json(
          {
            error: {
              code: 'server_error',
              message: 'Could not load roles. Try again.',
            },
          },
          { status: 500 },
        );
      }
      return HttpResponse.json({ data: store.roles });
    }),

    http.get('/admin/api/roles/:id', ({ params }) => {
      const id = Number(params.id);
      const role = store.roles.find((row) => row.id === id);
      if (!role) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Role not found.' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: role });
    }),

    http.post('/admin/api/roles', async ({ request }) => {
      const body = (await request.json()) as {
        name?: string;
        label?: string;
        description?: string;
        permissionIds?: number[];
      };
      const name = normalizeRoleName(body.name ?? '');
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
      if (!ROLE_NAME_PATTERN.test(name)) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Name must match ROLE_[A-Z0-9_]+.',
              fields: { name: 'Name must match ROLE_[A-Z0-9_]+.' },
            },
          },
          { status: 422 },
        );
      }
      if (RESERVED_ROLE_NAMES.has(name)) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'This system role name is reserved.',
              fields: { name: 'This system role name is reserved.' },
            },
          },
          { status: 409 },
        );
      }
      if (store.roles.some((row) => row.name === name)) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'A role with this name already exists.',
              fields: { name: 'Name is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const permissionIds = normalizePermissionIds(
        body.permissionIds,
        store.permissions,
      );
      const created: AdminApiRole = {
        id: Math.max(0, ...store.roles.map((row) => row.id)) + 1,
        name,
        label,
        description,
        protected: false,
        permissionIds,
        permissionCount: permissionIds.length,
      };
      store.roles = [...store.roles, created].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return HttpResponse.json({ data: created }, { status: 201 });
    }),

    http.patch('/admin/api/roles/:id', async ({ params, request }) => {
      const id = Number(params.id);
      const index = store.roles.findIndex((row) => row.id === id);
      if (index < 0) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Role not found.' } },
          { status: 404 },
        );
      }
      const current = store.roles[index];
      if (current.protected) {
        return HttpResponse.json(
          {
            error: {
              code: 'role_protected',
              message: 'Protected system roles cannot be edited.',
            },
          },
          { status: 409 },
        );
      }
      const body = (await request.json()) as {
        name?: string;
        label?: string;
        description?: string;
        permissionIds?: number[];
      };
      const name =
        body.name !== undefined ? normalizeRoleName(body.name) : current.name;
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
      if (!ROLE_NAME_PATTERN.test(name)) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Name must match ROLE_[A-Z0-9_]+.',
              fields: { name: 'Name must match ROLE_[A-Z0-9_]+.' },
            },
          },
          { status: 422 },
        );
      }
      if (RESERVED_ROLE_NAMES.has(name) && name !== current.name) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'This system role name is reserved.',
              fields: { name: 'This system role name is reserved.' },
            },
          },
          { status: 409 },
        );
      }
      if (store.roles.some((row) => row.name === name && row.id !== id)) {
        return HttpResponse.json(
          {
            error: {
              code: 'name_taken',
              message: 'A role with this name already exists.',
              fields: { name: 'Name is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const permissionIds =
        body.permissionIds !== undefined
          ? normalizePermissionIds(body.permissionIds, store.permissions)
          : current.permissionIds;
      const updated: AdminApiRole = {
        ...current,
        name,
        label,
        description,
        permissionIds,
        permissionCount: permissionIds.length,
      };
      store.roles = store.roles
        .map((row) => (row.id === id ? updated : row))
        .sort((a, b) => a.name.localeCompare(b.name));
      return HttpResponse.json({ data: updated });
    }),

    http.delete('/admin/api/roles/:id', ({ params }) => {
      const id = Number(params.id);
      const existing = store.roles.find((row) => row.id === id);
      if (!existing) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'Role not found.' } },
          { status: 404 },
        );
      }
      if (existing.protected) {
        return HttpResponse.json(
          {
            error: {
              code: 'role_protected',
              message: 'Protected system roles cannot be deleted.',
            },
          },
          { status: 409 },
        );
      }
      store.roles = store.roles.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),

    http.get('/admin/api/users', () => {
      if (failListUsers) {
        return HttpResponse.json(
          {
            error: {
              code: 'server_error',
              message: 'Could not load users. Try again.',
            },
          },
          { status: 500 },
        );
      }
      return HttpResponse.json({ data: store.users });
    }),

    http.get('/admin/api/users/:id', ({ params }) => {
      const id = Number(params.id);
      const user = store.users.find((row) => row.id === id);
      if (!user) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'User not found.' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: user });
    }),

    http.post('/admin/api/users', async ({ request }) => {
      const body = (await request.json()) as {
        email?: string;
        password?: string;
        roleIds?: number[];
        siteAssignments?: { siteId: number; roleId: number }[];
      };
      const email = normalizeEmail(body.email ?? '');
      const password = body.password ?? '';
      const fields: Record<string, string> = {};
      if (!email) {
        fields.email = 'Email is required.';
      } else if (!EMAIL_PATTERN.test(email)) {
        fields.email = 'Email must be a valid email address.';
      }
      if (!password) {
        fields.password = 'Password is required.';
      } else if (password.length < 8) {
        fields.password = 'Password must be at least 8 characters.';
      }
      if (Object.keys(fields).length > 0) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'User could not be created.',
              fields,
            },
          },
          { status: 422 },
        );
      }
      if (store.users.some((row) => row.email === email)) {
        return HttpResponse.json(
          {
            error: {
              code: 'email_taken',
              message: 'A user with this email already exists.',
              fields: { email: 'Email is already taken.' },
            },
          },
          { status: 409 },
        );
      }
      const rolesResult = buildUserRoles(body.roleIds ?? [], store.roles);
      if (!rolesResult.ok) {
        return HttpResponse.json(
          { error: { code: 'invalid_role', message: rolesResult.message } },
          { status: 409 },
        );
      }
      const assignmentsResult = buildSiteAssignments(
        body.siteAssignments,
        store.sites,
        store.roles,
        nextSiteAssignmentId,
      );
      if (!assignmentsResult.ok) {
        return HttpResponse.json(
          {
            error: {
              code: assignmentsResult.code,
              message: assignmentsResult.message,
              fields: assignmentsResult.fields,
            },
          },
          { status: assignmentsResult.code === 'validation_failed' ? 422 : 409 },
        );
      }
      nextSiteAssignmentId = assignmentsResult.nextId;
      const created: AdminApiUser = {
        id: Math.max(0, ...store.users.map((row) => row.id)) + 1,
        email,
        roleIds: rolesResult.roleIds,
        roles: rolesResult.roles,
        siteAssignments: assignmentsResult.assignments,
        roleCount: rolesResult.roleIds.length,
        siteAssignmentCount: assignmentsResult.assignments.length,
      };
      store.users = [...store.users, created].sort((a, b) =>
        a.email.localeCompare(b.email),
      );
      return HttpResponse.json({ data: created }, { status: 201 });
    }),

    http.patch('/admin/api/users/:id', async ({ params, request }) => {
      const id = Number(params.id);
      const index = store.users.findIndex((row) => row.id === id);
      if (index < 0) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'User not found.' } },
          { status: 404 },
        );
      }
      const current = store.users[index];
      const body = (await request.json()) as {
        email?: string;
        password?: string;
        roleIds?: number[];
        siteAssignments?: { siteId: number; roleId: number }[];
      };
      if (body.password !== undefined) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'User could not be updated.',
              fields: {
                password: 'Password cannot be changed in this window.',
              },
            },
          },
          { status: 422 },
        );
      }
      if (
        body.email === undefined &&
        body.roleIds === undefined &&
        body.siteAssignments === undefined
      ) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'User could not be updated.',
              fields: {
                _body:
                  'At least one of email, roleIds, or siteAssignments is required.',
              },
            },
          },
          { status: 422 },
        );
      }

      let email = current.email;
      if (body.email !== undefined) {
        email = normalizeEmail(body.email);
        if (!email) {
          return HttpResponse.json(
            {
              error: {
                code: 'validation_failed',
                message: 'User could not be updated.',
                fields: { email: 'Email is required.' },
              },
            },
            { status: 422 },
          );
        }
        if (!EMAIL_PATTERN.test(email)) {
          return HttpResponse.json(
            {
              error: {
                code: 'validation_failed',
                message: 'User could not be updated.',
                fields: { email: 'Email must be a valid email address.' },
              },
            },
            { status: 422 },
          );
        }
        if (store.users.some((row) => row.email === email && row.id !== id)) {
          return HttpResponse.json(
            {
              error: {
                code: 'email_taken',
                message: 'A user with this email already exists.',
                fields: { email: 'Email is already taken.' },
              },
            },
            { status: 409 },
          );
        }
      }

      let roleIds = current.roleIds;
      let roles = current.roles;
      if (body.roleIds !== undefined) {
        const rolesResult = buildUserRoles(body.roleIds, store.roles);
        if (!rolesResult.ok) {
          return HttpResponse.json(
            { error: { code: 'invalid_role', message: rolesResult.message } },
            { status: 409 },
          );
        }
        const hadAdmin = current.roles.some((role) => role.name === 'ROLE_ADMIN');
        const willHaveAdmin = rolesResult.roles.some(
          (role) => role.name === 'ROLE_ADMIN',
        );
        if (hadAdmin && !willHaveAdmin && countAdmins(store.users, id) === 0) {
          return HttpResponse.json(
            {
              error: {
                code: 'last_admin',
                message:
                  'Cannot remove Administrator from the last Administrator account.',
              },
            },
            { status: 409 },
          );
        }
        roleIds = rolesResult.roleIds;
        roles = rolesResult.roles;
      }

      let siteAssignments = current.siteAssignments;
      if (body.siteAssignments !== undefined) {
        const assignmentsResult = buildSiteAssignments(
          body.siteAssignments,
          store.sites,
          store.roles,
          nextSiteAssignmentId,
        );
        if (!assignmentsResult.ok) {
          return HttpResponse.json(
            {
              error: {
                code: assignmentsResult.code,
                message: assignmentsResult.message,
                fields: assignmentsResult.fields,
              },
            },
            {
              status:
                assignmentsResult.code === 'validation_failed' ? 422 : 409,
            },
          );
        }
        nextSiteAssignmentId = assignmentsResult.nextId;
        siteAssignments = assignmentsResult.assignments;
      }

      const updated: AdminApiUser = {
        ...current,
        email,
        roleIds,
        roles,
        siteAssignments,
        roleCount: roleIds.length,
        siteAssignmentCount: siteAssignments.length,
      };
      store.users = store.users
        .map((row) => (row.id === id ? updated : row))
        .sort((a, b) => a.email.localeCompare(b.email));
      return HttpResponse.json({ data: updated });
    }),

    http.delete('/admin/api/users/:id', ({ params }) => {
      const id = Number(params.id);
      const existing = store.users.find((row) => row.id === id);
      if (!existing) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'User not found.' } },
          { status: 404 },
        );
      }
      if (id === store.actorUserId) {
        return HttpResponse.json(
          {
            error: {
              code: 'self_delete',
              message: 'You cannot delete your own account.',
            },
          },
          { status: 409 },
        );
      }
      if (
        existing.roles.some((role) => role.name === 'ROLE_ADMIN') &&
        countAdmins(store.users, id) === 0
      ) {
        return HttpResponse.json(
          {
            error: {
              code: 'last_admin',
              message: 'Cannot delete the last Administrator account.',
            },
          },
          { status: 409 },
        );
      }
      store.users = store.users.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('/admin/api/users/:id/password', async ({ params, request }) => {
      const id = Number(params.id);
      const existing = store.users.find((row) => row.id === id);
      if (!existing) {
        return HttpResponse.json(
          { error: { code: 'not_found', message: 'User not found.' } },
          { status: 404 },
        );
      }
      const isSelf = id === store.actorUserId;
      const body = (await request.json()) as {
        currentPassword?: string;
        password?: string;
        confirmPassword?: string;
      };
      const currentPassword = String(body.currentPassword ?? '');
      const password = String(body.password ?? '');
      const fields: Record<string, string> = {};
      if (isSelf) {
        if (!currentPassword) {
          fields.currentPassword = 'Current password is required.';
        } else if (currentPassword !== 'password') {
          // MSW fixture: accept literal "password" as the current password.
          return HttpResponse.json(
            {
              error: {
                code: 'password_mismatch',
                message: 'Current password is incorrect.',
                fields: { currentPassword: 'Current password is incorrect.' },
              },
            },
            { status: 409 },
          );
        }
      }
      if (!password) {
        fields.password = 'Password is required.';
      } else if (password.length < 8) {
        fields.password = 'Password must be at least 8 characters.';
      }
      if (
        body.confirmPassword != null &&
        String(body.confirmPassword) !== password
      ) {
        fields.confirmPassword = 'Passwords do not match.';
      }
      if (Object.keys(fields).length > 0) {
        return HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: 'Password could not be set.',
              fields,
            },
          },
          { status: 422 },
        );
      }
      return HttpResponse.json({ data: { ok: true } });
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

/** Empty Roles list. */
export function createEmptyRolesHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ roles: [] });
}

/** List Roles fails with 500. */
export function createFailingRolesListHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ failListRoles: true });
}

/** Empty Users list. */
export function createEmptyUsersHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ users: [] });
}

/** List Users fails with 500. */
export function createFailingUsersListHandlers(): RequestHandler[] {
  return createAdminApiHandlers({ failListUsers: true });
}
