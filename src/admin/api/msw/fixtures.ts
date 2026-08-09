import type { AdminApiHost, AdminApiSettings, AdminApiSite } from '../types';

/** Shared Storybook / MSW fixtures for `/admin/api` (not exported from package root). */
export const MSW_SAMPLE_SITES: AdminApiSite[] = [
  {
    id: 1,
    name: 'Example Site',
    slug: 'example',
    enabled: true,
    protected: false,
    hostCount: 2,
  },
  {
    id: 2,
    name: 'Docs',
    slug: 'docs',
    enabled: true,
    protected: false,
    hostCount: 1,
  },
];

export const MSW_SAMPLE_HOSTS: AdminApiHost[] = [
  {
    id: 10,
    host: 'admin.example.test',
    siteId: 1,
    siteSlug: 'example',
    siteName: 'Example Site',
    surface: 'admin',
    verification: 'verified',
    enabled: true,
    protected: false,
  },
  {
    id: 11,
    host: 'www.example.test',
    siteId: 1,
    siteSlug: 'example',
    siteName: 'Example Site',
    surface: 'site',
    verification: 'verified',
    enabled: true,
    protected: true,
  },
  {
    id: 12,
    host: 'docs.example.test',
    siteId: 2,
    siteSlug: 'docs',
    siteName: 'Docs',
    surface: 'site',
    verification: 'verified',
    enabled: true,
    protected: false,
  },
];

export const MSW_DEFAULT_SETTINGS: AdminApiSettings = {
  adminAccess: 'path',
  effectiveAdminAccess: 'path',
  domainAvailable: false,
  adminHost: null,
  paths: {
    admin: '/admin',
    adminApi: '/admin/api',
    publicApi: '/api',
    login: '/admin/login',
    register: '/register',
  },
};
