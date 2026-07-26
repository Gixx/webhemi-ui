import { useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useCustomScrollbar } from './useCustomScrollbar';

export type ScrollableProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Optional className for the inner `.scrollable-viewport`. */
  viewportClassName?: string;
};

/**
 * Scroll host with Retro OS custom scrollbar chrome.
 * Prefer composing via {@link SunkenPanel}/{@link FieldBorder} `scrollable` prop when
 * those surfaces are the host; use this directly for layout hosts (e.g. window panes).
 *
 * Structure:
 *   .scrollable[.has-custom-scrollbar]
 *     .scrollable-viewport
 *       {children}
 *     .sb.sb-y / .sb.sb-x / .sb.sb-corner  (mounted by effect)
 */
export function Scrollable({
  className,
  children,
  viewportClassName,
  ...rest
}: ScrollableProps) {
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
