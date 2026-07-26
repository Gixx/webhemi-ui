import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from './PaneWindowShell';

export type HeadingPanelWindowProps = Omit<PaneWindowShellProps, 'children'> & {
  /** First panel (bleeds into body margins) — typically a graphic / tabs header. */
  heading: ReactNode;
  /** Middle content panel(s). A single node is wrapped in `.panel`; pass `.panel` nodes for multi. */
  children: ReactNode;
  actions?: ReactNode;
  /** When true, wrap `children` in a `.panel` (default). Set false if children already include panels. */
  wrapBody?: boolean;
};

/**
 * Column layout (`heading-panel-layout`) with groove separators between panels.
 */
export function HeadingPanelWindow({
  heading,
  children,
  actions,
  wrapBody = true,
  className,
  ...shell
}: HeadingPanelWindowProps) {
  return (
    <PaneWindowShell className={cn('w-window-lg', className)} {...shell}>
      <div className="window-pane heading-panel-layout">
        <div className="panel">{heading}</div>
        {wrapBody ? <div className="panel">{children}</div> : children}
        {actions ? <div className="panel actions">{actions}</div> : null}
      </div>
    </PaneWindowShell>
  );
}
