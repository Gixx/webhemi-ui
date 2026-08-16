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
  | 'site-main'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'hosts'
  | 'sites'
  | 'settings'
  | 'themes'
  | 'website'
  | 'trash'
  | 'trash-empty'
  | 'folder'
  | 'folder-open'
  | 'folder-documents'
  | 'folder-gallery'
  | 'folder-draft'
  | 'folder-scheduled'
  | 'file-document'
  | 'file-draft'
  | 'file-image'
  | 'file-audio'
  | 'file-video'
  | 'general-app';

/** Label contrast: `light` = white (desktop), `dark` = black (icon panels). */
export type SystemIconLabelTone = 'light' | 'dark';

export type SystemIconProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  kind: SystemIconKind;
  label: ReactNode;
  /** Label text color tone (not inferred from parent CSS). Default: `light`. */
  labelTone?: SystemIconLabelTone;
  /** Override CSS glyph with a custom image URL (e.g. site favicon). */
  iconUrl?: string;
  href?: string;
  draggable?: boolean;
  /** Activate (single click / Enter). Double-click also fires this then `onOpen`. */
  onActivate?: (event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => void;
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
  iconUrl,
  href = '#',
  draggable = false,
  onActivate,
  onOpen,
  className,
  linkProps,
  onDoubleClick,
  style,
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
    onActivate?.(event);
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    onActivate?.(event);
    onOpen?.();
  };

  return (
    <div
      className={cn('icon', kind, `label-tone-${labelTone}`, className)}
      draggable={draggable}
      onDoubleClick={handleDoubleClick}
      style={
        iconUrl ? { ...style, backgroundImage: `url("${iconUrl}")` } : style
      }
      {...rest}
    >
      <a href={href} {...linkProps} onClick={handleClick}>
        <span>{label}</span>
      </a>
    </div>
  );
}
