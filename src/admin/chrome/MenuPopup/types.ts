import type { ReactNode } from 'react';

/**
 * Shared declarative menu model (context menu + future MenuBar).
 * @see docs/plan/Admin_Context_Menu.md
 */
export type AdminMenuSeparator = {
  kind: 'separator';
  id: string;
};

export type AdminMenuCommandItem = {
  kind: 'item';
  id: string;
  label: string;
  accessKey?: string;
  /** Command items only — ignored when checkable. */
  icon?: ReactNode;
  disabled?: boolean;
  children?: AdminMenuItem[];
  onSelect?: () => void;
  role?: 'menuitem';
  checked?: undefined;
};

export type AdminMenuCheckableItem = {
  kind: 'item';
  id: string;
  label: string;
  accessKey?: string;
  disabled?: boolean;
  children?: AdminMenuItem[];
  onSelect?: () => void;
  /** Check / radio rows: check gutter only — never an icon. */
  role: 'menuitemcheckbox' | 'menuitemradio';
  checked?: boolean;
};

export type AdminMenuItem =
  | AdminMenuSeparator
  | AdminMenuCommandItem
  | AdminMenuCheckableItem;

export type MenuGutterMode = 'check' | 'icon' | 'none';

export function isAdminMenuCheckable(
  item: Extract<AdminMenuItem, { kind: 'item' }>,
): item is AdminMenuCheckableItem {
  return item.role === 'menuitemcheckbox' || item.role === 'menuitemradio';
}

/**
 * Leading gutter:
 * - any checkable row → check column (View-style; command rows get an empty check cell)
 * - else any command icon → icon column
 * - else none
 */
export function resolveMenuGutterMode(items: AdminMenuItem[]): MenuGutterMode {
  const rows = items.filter(
    (item): item is Extract<AdminMenuItem, { kind: 'item' }> => item.kind === 'item',
  );
  if (rows.length === 0) {
    return 'none';
  }
  if (rows.some((item) => isAdminMenuCheckable(item))) {
    return 'check';
  }
  const anyIcon = rows.some(
    (item) => !isAdminMenuCheckable(item) && item.icon != null,
  );
  return anyIcon ? 'icon' : 'none';
}
