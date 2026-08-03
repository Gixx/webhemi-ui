/**
 * Public URL prefix for Admin Theme graphics (Storybook staticDirs only).
 * Files live in `src/admin/assets/` and sync to `webhemi-php/assets/admin/`.
 *
 * Prefer CSS `url("/assets/admin/...")` (rewritten to relative `./` at CSS build
 * so PHP AssetMapper digests them). For React `<img>`, pass Twig `asset(...)`
 * props — bare `/assets/admin/...` paths 404 on PHP (digest-only DevServer).
 *
 * Layout:
 * - `chrome/` — window chrome SVGs (buttons, scrollbar, form chrome)
 * - `icons/system/` — CMS / desktop system glyphs
 * - `icons/explorer/` — file explorer glyphs
 * - `icons/toolbar/` — explorer toolbar tools
 * - `system/` — banners / misc product bitmaps
 * - `sounds/` — system sounds (`chord.mp3` Critical Stop, `ding.mp3` Default Beep)
 * - `fonts/`, `logo/`
 */
export const ADMIN_ASSETS_BASE = '/assets/admin';

export function adminAsset(path: string): string {
  const normalized = path.replace(/^\/+/, '');
  return `${ADMIN_ASSETS_BASE}/${normalized}`;
}

/** @deprecated Prefer CSS backgrounds or Twig `asset()` props — not digest-safe on PHP. */
export function adminIconAsset(kind: string): string {
  const file = kind.replace(/-/g, '_');
  return adminAsset(`icons/system/${file}.svg`);
}
