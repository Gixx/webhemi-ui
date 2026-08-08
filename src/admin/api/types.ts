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
