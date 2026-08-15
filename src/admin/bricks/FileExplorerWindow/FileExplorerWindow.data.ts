import type { ExplorerItem } from './types';

/**
 * Storybook fixture: one site’s explorer forest.
 *
 * Roots:
 * 1. Site (nav tree — folders + documents)
 * 2. Media library (embedded upload assets)
 * 3. Recycle bin (flat deleted nav items; not expandable in the tree)
 * 4. Settings (inactive — opens a separate window later)
 */
export const EXPLORER_FIXTURE_SITE = {
  id: 'site-acme',
  name: 'Acme Website',
  /** Default site glyph until favicon support exists. */
  titleIcon: 'site' as const,
};

export const EXPLORER_FIXTURE_TREE: ExplorerItem[] = [
  {
    id: 'site-acme',
    label: EXPLORER_FIXTURE_SITE.name,
    kind: 'site',
    role: 'site',
    typeLabel: 'Website',
    children: [
      {
        id: 'nav-home',
        label: 'Home',
        kind: 'file-document',
        role: 'document',
        typeLabel: 'HTML Document',
        sizeBytes: 4096,
        modifiedAt: '7/12/26 9:00 AM',
      },
      {
        id: 'nav-about',
        label: 'About',
        kind: 'folder',
        role: 'folder',
        typeLabel: 'Folder',
        modifiedAt: '7/10/26 2:15 PM',
        children: [
          {
            id: 'nav-about-team',
            label: 'Team',
            kind: 'file-document',
            role: 'document',
            typeLabel: 'HTML Document',
            sizeBytes: 3072,
            modifiedAt: '7/10/26 2:15 PM',
          },
          {
            id: 'nav-about-history',
            label: 'History',
            kind: 'file-document',
            role: 'document',
            typeLabel: 'HTML Document',
            sizeBytes: 2560,
            modifiedAt: '6/01/26 11:30 AM',
          },
        ],
      },
      {
        id: 'nav-blog',
        label: 'Blog',
        kind: 'folder',
        role: 'folder',
        typeLabel: 'Folder',
        modifiedAt: '7/20/26 4:00 PM',
        children: [
          {
            id: 'nav-blog-index',
            label: 'Index',
            kind: 'file-document',
            role: 'document',
            typeLabel: 'HTML Document',
            sizeBytes: 5120,
            modifiedAt: '7/20/26 4:00 PM',
          },
        ],
      },
      {
        id: 'nav-contact',
        label: 'Contact',
        kind: 'file-document',
        role: 'document',
        typeLabel: 'HTML Document',
        sizeBytes: 2048,
        modifiedAt: '5/18/26 8:45 AM',
      },
    ],
  },
  {
    id: 'media-library',
    label: 'Media library',
    kind: 'folder-gallery',
    role: 'media-library',
    typeLabel: 'Media Library',
    children: [
      {
        id: 'media-hero',
        label: 'hero.jpg',
        kind: 'file-image',
        role: 'media-asset',
        typeLabel: 'JPEG Image',
        sizeBytes: 245_760,
        modifiedAt: '7/01/26 10:12 AM',
      },
      {
        id: 'media-logo',
        label: 'logo.png',
        kind: 'file-image',
        role: 'media-asset',
        typeLabel: 'PNG Image',
        sizeBytes: 18_432,
        modifiedAt: '6/15/26 3:20 PM',
      },
      {
        id: 'media-gallery',
        label: 'gallery',
        kind: 'folder',
        role: 'folder',
        typeLabel: 'Folder',
        modifiedAt: '7/08/26 1:00 PM',
        children: [
          {
            id: 'media-gallery-1',
            label: 'photo-01.jpg',
            kind: 'file-image',
            role: 'media-asset',
            typeLabel: 'JPEG Image',
            sizeBytes: 102_400,
            modifiedAt: '7/08/26 1:00 PM',
          },
        ],
      },
    ],
  },
  {
    id: 'trash',
    label: 'Recycle Bin',
    kind: 'trash',
    role: 'trash',
    typeLabel: 'Recycle Bin',
    expandable: false,
    children: [
      {
        id: 'trash-old-landing',
        label: 'Old landing',
        kind: 'file-document',
        role: 'document',
        typeLabel: 'HTML Document',
        sizeBytes: 8192,
        modifiedAt: '4/02/26 5:10 PM',
      },
      {
        id: 'trash-drafts',
        label: 'Drafts',
        kind: 'folder',
        role: 'folder',
        typeLabel: 'Folder',
        modifiedAt: '3/11/26 9:00 AM',
      },
    ],
  },
    {
      id: 'settings',
      label: 'Settings',
      kind: 'settings',
      role: 'settings',
      typeLabel: 'Settings',
      expandable: false,
    },
  ];

/** @deprecated Prefer selecting from `EXPLORER_FIXTURE_TREE`; kept for shallow imports. */
export const EXPLORER_FIXTURE_ITEMS: ExplorerItem[] =
  EXPLORER_FIXTURE_TREE.find((n) => n.id === 'site-acme')?.children ?? [];

export type SiteExplorerIdentity = {
  id: string | number;
  name: string;
};

/**
 * Empty product forest for a site window until PHP supplies real nav/media data.
 * Roots match the FileExplorer data model (site, media library, trash, settings).
 */
export function buildEmptySiteExplorerTree(site: SiteExplorerIdentity): ExplorerItem[] {
  const prefix = `site-${site.id}`;
  return [
    {
      id: prefix,
      label: site.name,
      kind: 'site',
      role: 'site',
      typeLabel: 'Website',
      children: [],
    },
    {
      id: `${prefix}-media`,
      label: 'Media library',
      kind: 'folder-gallery',
      role: 'media-library',
      typeLabel: 'Media Library',
      children: [],
    },
    {
      id: `${prefix}-trash`,
      label: 'Recycle Bin',
      kind: 'trash',
      role: 'trash',
      typeLabel: 'Recycle Bin',
      expandable: false,
      children: [],
    },
    {
      id: `${prefix}-settings`,
      label: 'Settings',
      kind: 'settings',
      role: 'settings',
      typeLabel: 'Settings',
      expandable: false,
    },
  ];
}

/**
 * Remap the Storybook Acme fixture onto another site id/name (demo / desktop stories).
 */
export function buildDemoSiteExplorerTree(site: SiteExplorerIdentity): ExplorerItem[] {
  const prefix = `site-${site.id}`;

  const remap = (nodes: ExplorerItem[], path: string): ExplorerItem[] =>
    nodes.map((node) => ({
      ...node,
      id: `${path}/${node.id}`,
      children: node.children ? remap(node.children, `${path}/${node.id}`) : undefined,
    }));

  const [siteRoot, media, trash, settings] = EXPLORER_FIXTURE_TREE;
  return [
    {
      ...siteRoot,
      id: prefix,
      label: site.name,
      children: siteRoot.children ? remap(siteRoot.children, prefix) : [],
    },
    {
      ...media,
      id: `${prefix}-media`,
      children: media.children ? remap(media.children, `${prefix}-media`) : [],
    },
    {
      ...trash,
      id: `${prefix}-trash`,
      children: trash.children ? remap(trash.children, `${prefix}-trash`) : [],
    },
    {
      ...settings,
      id: `${prefix}-settings`,
    },
  ];
}
