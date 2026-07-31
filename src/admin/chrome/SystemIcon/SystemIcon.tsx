import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
import { cn } from '../../../lib/cn';

/** CSS icon kinds wired in `chrome/_icon.scss` (`.icon.*`). */
export type SystemIconKind =
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

/** Label contrast: `light` = white (desktop), `dark` = black (icon panels). */
export type SystemIconLabelTone = 'light' | 'dark';

export type SystemIconProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  kind: SystemIconKind;
  label: ReactNode;
  /** Label text color tone (not inferred from parent CSS). Default: `light`. */
  labelTone?: SystemIconLabelTone;
  href?: string;
  draggable?: boolean;
  /** Activate (single click / Enter). Double-click also fires this then `onOpen`. */
  onActivate?: () => void;
  /** Open (double-click). */
  onOpen?: () => void;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>;
};

/**
 * System icon for desktop or icon-panel surfaces: glyph (CSS background) + label.
 * Chrome atom — OS desktop-icon primitive (activate / open).
 * Item metadata (description, dates, …) lives on the parent list/selection model.
 */
export function SystemIcon({
  kind,
  label,
  labelTone = 'light',
  href = '#',
  draggable = false,
  onActivate,
  onOpen,
  className,
  linkProps,
  onDoubleClick,
  ...rest
}: SystemIconProps) {
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
      className={cn('icon', kind, `label-tone-${labelTone}`, className)}
      draggable={draggable}
      onDoubleClick={handleDoubleClick}
      {...rest}
    >
      <a href={href} {...linkProps} onClick={handleClick}>
        <span>{label}</span>
      </a>
    </div>
  );
}
