/**
 * Public URL prefix for Admin Theme graphics (Storybook staticDirs only).
 * Files live in `src/admin/assets/` and sync to `webhemi-php/assets/admin/`.
 *
 * Prefer CSS `url("/assets/admin/...")` (rewritten to relative `./` at CSS build
 * so PHP AssetMapper digests them). For React `<img>`, pass Twig `asset(...)`
 * props — bare `/assets/admin/...` paths 404 on PHP (digest-only DevServer).
 */
export const ADMIN_ASSETS_BASE = '/assets/admin';

export function adminAsset(path: string): string {
  const normalized = path.replace(/^\/+/, '');
  return `${ADMIN_ASSETS_BASE}/${normalized}`;
}

/** @deprecated Prefer CSS backgrounds or Twig `asset()` props — not digest-safe on PHP. */
export function adminIconAsset(kind: string): string {
  return adminAsset(`icons/${kind.replace(/-/g, '_')}.svg`);
}
