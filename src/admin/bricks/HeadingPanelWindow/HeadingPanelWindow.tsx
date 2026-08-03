import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';

export type HeadingPanelWindowProps = Omit<PaneWindowShellProps, 'children'> & {
  /** First panel (bleeds under title-bar). Toolbar / intro. */
  heading?: ReactNode;
  /** Main content panel (grows when the window has a definite height). */
  children: ReactNode;
  /**
   * Bottom `.panel.actions` (button row). Prefer a `FieldRow` with
   * `justify-end` / `justify-center` — padding comes from the actions panel.
   */
  actions?: ReactNode;
};

/**
 * Stacked heading layout (`heading-panel-layout`): optional heading, body, actions.
 */
export function HeadingPanelWindow({
  heading,
  children,
  actions,
  className,
  ...shell
}: HeadingPanelWindowProps) {
  return (
    <PaneWindowShell className={cn(className)} {...shell}>
      <div className="window-pane heading-panel-layout">
        {heading != null ? <div className="panel">{heading}</div> : null}
        <div className="panel">{children}</div>
        {actions != null ? <div className="panel actions">{actions}</div> : null}
      </div>
    </PaneWindowShell>
  );
}
