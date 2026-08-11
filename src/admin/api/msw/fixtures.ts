import type {
  AdminApiHost,
  AdminApiPermission,
  AdminApiRole,
  AdminApiSettings,
  AdminApiSite,
  AdminApiUser,
} from '../types';

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

export const MSW_SAMPLE_PERMISSIONS: AdminApiPermission[] = [
  {
    id: 1,
    name: 'content.edit',
    label: 'Edit content',
    description: 'Allows editing site content.',
  },
  {
    id: 2,
    name: 'content.publish',
    label: 'Publish content',
    description: '',
  },
];

export const MSW_SAMPLE_ROLES: AdminApiRole[] = [
  {
    id: 1,
    name: 'ROLE_ADMIN',
    label: 'Admin',
    description: 'Full platform access.',
    protected: true,
    permissionIds: [],
    permissionCount: 0,
  },
  {
    id: 2,
    name: 'ROLE_SITE_ADMIN',
    label: 'Site Admin',
    description: 'Administer assigned sites.',
    protected: true,
    permissionIds: [],
    permissionCount: 0,
  },
  {
    id: 3,
    name: 'ROLE_AUTHOR',
    label: 'Author',
    description: 'Edit and publish content.',
    protected: false,
    permissionIds: [1, 2],
    permissionCount: 2,
  },
];

export const MSW_SAMPLE_USERS: AdminApiUser[] = [
  {
    id: 1,
    email: 'admin@example.test',
    roleIds: [1],
    roles: [{ id: 1, name: 'ROLE_ADMIN', label: 'Admin' }],
    siteAssignments: [],
    roleCount: 1,
    siteAssignmentCount: 0,
  },
  {
    id: 2,
    email: 'author@example.test',
    roleIds: [3],
    roles: [{ id: 3, name: 'ROLE_AUTHOR', label: 'Author' }],
    siteAssignments: [
      {
        id: 1,
        siteId: 1,
        siteName: 'Example Site',
        roleId: 2,
        roleName: 'ROLE_SITE_ADMIN',
        roleLabel: 'Site Admin',
      },
    ],
    roleCount: 1,
    siteAssignmentCount: 1,
  },
];
