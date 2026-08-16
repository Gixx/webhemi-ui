/** Title-bar glyph kinds (CSS classes on `.title-bar-text`). */
export type TitleBarIconKind =
  | 'control-panel'
  | 'site'
  | 'site-main'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'hosts'
  | 'sites'
  | 'settings'
  | 'themes'
  | 'folder'
  | 'file-document'
  | 'external-link'
  | 'my-account';

/** Storybook select options: `none` maps to no `titleIcon`. */
export const TITLE_BAR_ICON_OPTIONS = [
  'none',
  'control-panel',
  'site',
  'site-main',
  'users',
  'roles',
  'permissions',
  'hosts',
  'sites',
  'settings',
  'themes',
  'folder',
  'file-document',
  'external-link',
  'my-account',
] as const satisfies ReadonlyArray<'none' | TitleBarIconKind>;

export type TitleBarIconOption = (typeof TITLE_BAR_ICON_OPTIONS)[number];

export function resolveTitleBarIcon(
  value: TitleBarIconOption | undefined,
): TitleBarIconKind | undefined {
  return value && value !== 'none' ? value : undefined;
}
