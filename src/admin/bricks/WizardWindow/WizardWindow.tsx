import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';

export type WizardWindowProps = Omit<PaneWindowShellProps, 'children'> & {
  /** Side banner graphic (typically an `<img>`). */
  banner?: ReactNode;
  info: ReactNode;
  actions: ReactNode;
};

/**
 * Setup / wizard window (`wizard-panel-layout`): banner | info, actions below.
 */
export function WizardWindow({
  banner,
  info,
  actions,
  className,
  ...shell
}: WizardWindowProps) {
  return (
    <PaneWindowShell className={cn('w-window-md', className)} {...shell}>
      <div className="window-pane wizard-panel-layout">
        <div className="panel banner">{banner}</div>
        <div className="panel info">{info}</div>
        <div className="panel actions">{actions}</div>
      </div>
    </PaneWindowShell>
  );
}
