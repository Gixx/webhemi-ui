import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { Scrollable } from '../Scrollable';

/** Panel face color under `[data-wh-theme="admin"]`. */
export type SunkenPanelTone = 'system' | 'white';

export type SunkenPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, host uses Retro OS custom scrollbar (`.scrollable` + viewport). */
  scrollable?: boolean;
  /**
   * Interior face: `system` (silver, default) or `white`.
   * Tables still force a white face via CSS when present.
   */
  tone?: SunkenPanelTone;
  children?: ReactNode;
};

export function SunkenPanel({
  scrollable = false,
  tone = 'system',
  className,
  children,
  ...rest
}: SunkenPanelProps) {
  const panelClassName = cn(
    'sunken-panel',
    tone === 'white' && 'sunken-panel-white',
    className,
  );

  if (scrollable) {
    return (
      <Scrollable className={panelClassName} {...rest}>
        {children}
      </Scrollable>
    );
  }

  // Same viewport wrapper as scrollable (padding / min-height live on `.scrollable-viewport`).
  return (
    <div className={panelClassName} {...rest}>
      <div className="scrollable-viewport">{children}</div>
    </div>
  );
}
