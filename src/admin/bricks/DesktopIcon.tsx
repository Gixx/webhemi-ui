import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

/** CSS icon kinds wired in `product/_desktop.scss`. */
export type DesktopIconKind =
  | 'control-panel'
  | 'site'
  | 'network-neighborhood'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'hosts'
  | 'sites'
  | 'settings'
  | 'themes';

export type DesktopIconProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  kind: DesktopIconKind;
  label: ReactNode;
  href?: string;
  description?: string;
  draggable?: boolean;
  /** Activate (single click / Enter). Double-click also fires this then `onOpen`. */
  onActivate?: () => void;
  /** Open (double-click). */
  onOpen?: () => void;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>;
};

/**
 * Desktop / icon-panel icon: glyph (CSS background) + label. Closed product unit —
 * not a chrome atom.
 */
export function DesktopIcon({
  kind,
  label,
  href = '#',
  description,
  draggable = false,
  onActivate,
  onOpen,
  className,
  linkProps,
  onDoubleClick,
  ...rest
}: DesktopIconProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    linkProps?.onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (href === '#') {
      event.preventDefault();
    }
    onActivate?.();
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    onActivate?.();
    onOpen?.();
  };

  return (
    <div
      className={cn('icon', kind, className)}
      draggable={draggable}
      onDoubleClick={handleDoubleClick}
      {...rest}
    >
      <a
        href={href}
        data-description={description}
        {...linkProps}
        onClick={handleClick}
      >
        <span>{label}</span>
      </a>
    </div>
  );
}
