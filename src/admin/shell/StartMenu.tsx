import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import { assignSafeAppPath, isSafeAppPath } from '../lib/safeAppPath';

export type StartMenuProps = {
  open: boolean;
  onClose: () => void;
  onOpenControlPanel: () => void;
  /** When set, Logout navigates here; otherwise the item is disabled. */
  logoutHref?: string;
};

type StartItem = {
  id: string;
  label: string;
  className: string;
  disabled?: boolean;
  onSelect?: () => void;
};

/**
 * Classic Start menu popup above the taskbar Menu button.
 */
export function StartMenu({
  open,
  onClose,
  onOpenControlPanel,
  logoutHref,
}: StartMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      // Menu button toggle is owned by Taskbar — ignore clicks on it.
      if (target instanceof Element && target.closest('#toolbar > .window-body > button.menu')) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const items: StartItem[] = [
    { id: 'uploads', label: 'Uploads', className: 'uploads', disabled: true },
    {
      id: 'control-panel',
      label: 'Control Panel',
      className: 'control-panel',
      onSelect: () => {
        onOpenControlPanel();
        onClose();
      },
    },
    { id: 'search', label: 'Search', className: 'search', disabled: true },
    { id: 'logs', label: 'Logs', className: 'logs', disabled: true },
    { id: 'about', label: 'About', className: 'about', disabled: true },
    {
      id: 'logout',
      label: 'Logout',
      className: 'logout',
      disabled: !logoutHref || !isSafeAppPath(logoutHref),
      onSelect:
        logoutHref && isSafeAppPath(logoutHref)
          ? () => {
              onClose();
              assignSafeAppPath(logoutHref, '/admin/logout');
            }
          : undefined,
    },
  ];

  return (
    <div
      ref={rootRef}
      className="start-menu"
      id="start-menu"
      hidden={!open}
    >
      <div className="start-menu-banner" aria-hidden="true">
        <span>WebHemi 1.0</span>
      </div>
      <ul className="start-menu-list" role="menu" aria-label="Menu">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} role="none">
            <StartMenuItem item={item} />
          </li>
        ))}
        <li className="separator" role="separator" />
        {items.slice(4).map((item) => (
          <li key={item.id} role="none">
            <StartMenuItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StartMenuItem({ item }: { item: StartItem }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn('start-item', item.className)}
      disabled={item.disabled}
      onClick={() => {
        if (!item.disabled) {
          item.onSelect?.();
        }
      }}
    >
      {item.label}
    </button>
  );
}
