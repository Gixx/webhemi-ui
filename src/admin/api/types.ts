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
  /** Frontend theme package id (`data-wh-theme`). */
  themeId: string;
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

/** Content node DTO from `/admin/api/sites/{id}/nodes`. */
export type AdminApiContentNode = {
  id: number;
  siteId: number;
  parentId: number | null;
  tree: 'site' | 'media';
  kind: 'folder' | 'document' | 'media_ref' | 'redirect';
  folderType: 'normal' | 'locale' | null;
  slug: string;
  title: string;
  body: string | null;
  redirectTarget: string | null;
  mediaAssetId: number | null;
  publication: 'draft' | 'published' | 'scheduled';
  publishAt: string | null;
  hidden: boolean;
  sortOrder: number;
  deletedAt: string | null;
  originalParentId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminApiMediaAsset = {
  id: number;
  siteId: number;
  folderNodeId: number | null;
  contentHash: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deduped?: boolean;
};

export type AdminApiTrashPayload = {
  nodes: AdminApiContentNode[];
  media: AdminApiMediaAsset[];
};

export type AdminApiPurgeResult = {
  id: number;
  purged: true;
};

export type AdminApiSiteSettingsHost = {
  id: number;
  host: string;
  surface: string;
  verification: string;
  enabled: boolean;
  protected: boolean;
};

export type AdminApiSiteSettingsAssignment = {
  id: number;
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
  roleLabel: string;
};

export type AdminApiSiteSettings = {
  siteId: number;
  slug: string;
  name: string;
  description: string | null;
  themeId: string;
  protected: boolean;
  faviconMediaId: number | null;
  favicon: AdminApiMediaAsset | null;
  hosts: AdminApiSiteSettingsHost[];
  assignments: AdminApiSiteSettingsAssignment[];
  capabilities: {
    manageHosts: boolean;
    manageUsers: boolean;
  };
};

/**
 * Explorer forest item from `GET …/explorer` — matches UI `ExplorerItem`
 * (string ids, nested children, Win98 roles/kinds).
 */
export type AdminApiExplorerItem = {
  id: string;
  label: string;
  kind: string;
  role?: string;
  typeLabel?: string;
  sizeBytes?: number;
  modifiedAt?: string;
  hidden?: boolean;
  /** Content nodes only — draft | published | scheduled. */
  publication?: 'draft' | 'published' | 'scheduled';
  expandable?: boolean;
  disabled?: boolean;
  children?: AdminApiExplorerItem[];
};
