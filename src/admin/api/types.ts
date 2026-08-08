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
  /** Present after PATCH when access mode changed (absolute admin login URL). */
  loginUrl?: string;
  sessionEnded?: boolean;
};
