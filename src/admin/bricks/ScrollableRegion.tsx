import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useCustomScrollbar } from './useCustomScrollbar';

export type ScrollableRegionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Optional style / className for the inner `.scrollable-viewport`. */
  viewportClassName?: string;
};

/**
 * Scroll host with Win98 custom scrollbar chrome (admin98 scrollbar.js port).
 *
 * Structure:
 *   .scrollable[.has-custom-scrollbar]
 *     .scrollable-viewport
 *       {children}
 *     .sb.sb-y / .sb.sb-x / .sb.sb-corner  (mounted by effect)
 */
export function ScrollableRegion({
  className,
  children,
  viewportClassName,
  ...rest
}: ScrollableRegionProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  useCustomScrollbar(hostRef, viewportRef);

  return (
    <div ref={hostRef} className={cn('scrollable', className)} {...rest}>
      <div ref={viewportRef} className={cn('scrollable-viewport', viewportClassName)}>
        {children}
      </div>
    </div>
  );
}
