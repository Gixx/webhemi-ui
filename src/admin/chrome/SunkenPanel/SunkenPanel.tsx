import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { Scrollable } from '../Scrollable';

export type SunkenPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, host uses Retro OS custom scrollbar (`.scrollable` + viewport). */
  scrollable?: boolean;
  children?: ReactNode;
};

export function SunkenPanel({
  scrollable = false,
  className,
  children,
  ...rest
}: SunkenPanelProps) {
  if (scrollable) {
    return (
      <Scrollable className={cn('sunken-panel', className)} {...rest}>
        {children}
      </Scrollable>
    );
  }

  // Same viewport wrapper as scrollable (padding / min-height live on `.scrollable-viewport`).
  return (
    <div className={cn('sunken-panel', className)} {...rest}>
      <div className="scrollable-viewport">{children}</div>
    </div>
  );
}
