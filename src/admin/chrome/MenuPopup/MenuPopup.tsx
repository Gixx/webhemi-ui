import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useId, useRef } from 'react';
import { underlineAccessKey } from '../_lib/underlineAccessKey';
import { cn } from '../../../lib/cn';
import {
  isAdminMenuCheckable,
  resolveMenuGutterMode,
  type AdminMenuItem,
  type MenuGutterMode,
} from './types';

export type MenuPopupProps = {
  items: AdminMenuItem[];
  /** Optional DOM id (e.g. menubar `aria-controls` target). */
  id?: string;
  /** Accessible name for the `role="menu"` surface. */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  /** Called after a non-disabled item activates (and after `onSelect`). */
  onItemActivate?: (itemId: string) => void;
};

function MenuLabel({ text, accessKey }: { text: string; accessKey?: string }) {
  if (!accessKey) {
    return <>{text}</>;
  }
  return <>{underlineAccessKey(text, accessKey)}</>;
}

function LeadingGutter({
  mode,
  item,
}: {
  mode: MenuGutterMode;
  item: Extract<AdminMenuItem, { kind: 'item' }>;
}): ReactNode {
  if (mode === 'none') {
    return null;
  }
  if (mode === 'check') {
    const checked = isAdminMenuCheckable(item) && Boolean(item.checked);
    return (
      <span className="menu-popup-gutter menu-popup-check" aria-hidden>
        {checked ? '✓' : ''}
      </span>
    );
  }
  // icon mode — checkable rows should not appear here; ignore icon if they do
  const icon = !isAdminMenuCheckable(item) ? item.icon : undefined;
  return (
    <span className="menu-popup-gutter menu-popup-icon" aria-hidden>
      {icon ?? null}
    </span>
  );
}

/**
 * Raised Win98-style menu popup (shared by context menus and future menubar).
 */
export function MenuPopup({
  items,
  id,
  'aria-label': ariaLabel = 'Menu',
  className,
  style,
  onItemActivate,
}: MenuPopupProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const gutterMode = resolveMenuGutterMode(items);

  const activate = (item: Extract<AdminMenuItem, { kind: 'item' }>) => {
    if (item.disabled) {
      return;
    }
    item.onSelect?.();
    onItemActivate?.(item.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(
        'button.menu-popup-item:not(:disabled)',
      ) ?? [],
    );
    if (buttons.length === 0) {
      return;
    }
    const current = document.activeElement as HTMLElement | null;
    const index = buttons.findIndex((btn) => btn === current);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = buttons[(index + 1 + buttons.length) % buttons.length];
      next?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = buttons[(index - 1 + buttons.length) % buttons.length];
      next?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      id={baseId}
      className={cn(
        'menu-popup',
        gutterMode === 'check' && 'has-check-gutter',
        gutterMode === 'icon' && 'has-icon-gutter',
        className,
      )}
      role="menu"
      aria-label={ariaLabel}
      style={style}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        if (item.kind === 'separator') {
          return (
            <div key={item.id} className="menu-popup-separator" role="separator" />
          );
        }

        const role = isAdminMenuCheckable(item)
          ? item.role
          : (item.role ?? 'menuitem');
        const hasSubmenu = Boolean(item.children && item.children.length > 0);

        return (
          <button
            key={item.id}
            type="button"
            role={role}
            className={cn(
              'menu-popup-item',
              isAdminMenuCheckable(item) && item.checked && 'is-checked',
              item.disabled && 'is-disabled',
              hasSubmenu && 'has-submenu',
            )}
            disabled={item.disabled}
            aria-checked={
              role === 'menuitemradio' || role === 'menuitemcheckbox'
                ? Boolean(item.checked)
                : undefined
            }
            aria-haspopup={hasSubmenu ? 'menu' : undefined}
            onClick={() => activate(item)}
          >
            <LeadingGutter mode={gutterMode} item={item} />
            <span className="menu-popup-label">
              <MenuLabel text={item.label} accessKey={item.accessKey} />
            </span>
            {hasSubmenu ? (
              <span className="menu-popup-submenu-marker" aria-hidden>
                ▶
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
