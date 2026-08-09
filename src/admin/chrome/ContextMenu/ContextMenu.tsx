import type { CSSProperties } from 'react';
import { cn } from '../../../lib/cn';
import { MenuPopup, type MenuPopupProps } from '../MenuPopup';

export type ContextMenuProps = MenuPopupProps & {
  /** When false, render nothing (product open state). Default true. */
  open?: boolean;
  /** Viewport / offset parent coordinates (Storybook: absolute inside a relative host). */
  left?: number;
  top?: number;
  /** `fixed` for desktop overlay; `absolute` for story hosts. Default `absolute`. */
  position?: 'absolute' | 'fixed';
};

/**
 * Positioned context-menu shell around {@link MenuPopup}.
 * Product wiring (`onContextMenu`, dismiss) is a later slice.
 */
export function ContextMenu({
  open = true,
  left = 0,
  top = 0,
  position = 'absolute',
  className,
  style,
  ...popupProps
}: ContextMenuProps) {
  if (!open) {
    return null;
  }

  const positioned: CSSProperties = {
    position,
    left,
    top,
    zIndex: 40,
    ...style,
  };

  return (
    <MenuPopup
      {...popupProps}
      className={cn('context-menu', className)}
      style={positioned}
    />
  );
}
