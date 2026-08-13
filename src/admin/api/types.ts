/** Shared `/admin/api` JSON envelopes (Phase 6). */

export type AdminApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export type AdminApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type AdminApiFailure = {
  ok: false;
  status: number;
  error: AdminApiErrorBody;
};

export type AdminApiResult<T> = AdminApiSuccess<T> | AdminApiFailure;

export type AdminApiSite = {
  id: number;
  slug: string;
  name: string;
  enabled: boolean;
  protected: boolean;
  hostCount: number;
};

export type AdminApiHost = {
  id: number;
  host: string;
  siteId: number | null;
  siteSlug: string | null;
  siteName: string | null;
  surface: 'admin' | 'site';
  verification: 'pending' | 'verified';
  enabled: boolean;
  protected: boolean;
  /** Present after PATCH/unassign when domain access was forced to path. */
  accessModeReset?: boolean;
  loginUrl?: string;
  sessionEnded?: boolean;
};

export type AdminApiSettings = {
  adminAccess: 'path' | 'domain';
  effectiveAdminAccess: 'path' | 'domain';
  domainAvailable: boolean;
  adminHost: { id: number; host: string } | null;
  paths: {
    admin: string;
    adminApi: string;
    publicApi: string;
    login: string;
    register: string;
  };
  symfonyDebugToolbar: boolean;
  symfonyDebugToolbarEditable: boolean;
  /** Present after PATCH when access mode changed (absolute admin login URL). */
  loginUrl?: string;
  sessionEnded?: boolean;
};

export type AdminApiPermission = {
  id: number;
  name: string;
  label: string;
  description: string;
};

export type AdminApiRole = {
  id: number;
  name: string;
  label: string;
  description: string;
  protected: boolean;
  permissionIds: number[];
  permissionCount: number;
};

export type AdminApiUserRoleRef = {
  id: number;
  name: string;
  label: string;
};

export type AdminApiUserSiteAssignment = {
  id: number;
  siteId: number;
  siteName: string;
  roleId: number;
  roleName: string;
  roleLabel: string;
};

export type AdminApiUser = {
  id: number;
  email: string;
  roleIds: number[];
  roles: AdminApiUserRoleRef[];
  siteAssignments: AdminApiUserSiteAssignment[];
  roleCount: number;
  siteAssignmentCount: number;
};

export type AdminApiUserCapabilities = {
  listUsers: boolean;
  viewUser: boolean;
  createUser: boolean;
  editUser: boolean;
  deleteUser: boolean;
};

export type AdminApiMe = {
  user: string | null;
  id?: number | null;
  email?: string | null;
  roles: string[];
  capabilities?: AdminApiUserCapabilities;
};

/** DELETE /hosts/{id} — sessionEnded when domain access was forced back to path. */
export type AdminApiHostDeleteResult = {
  deleted: true;
  accessModeReset?: boolean;
  loginUrl?: string;
  sessionEnded?: boolean;
};
