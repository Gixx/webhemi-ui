import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from './PaneWindowShell';
import { ScrollableRegion } from './ScrollableRegion';

export type IconPanelWindowProps = Omit<PaneWindowShellProps, 'children'> & {
  /** Left info column (gradient). Hidden content when `infoUnselected`. */
  info?: ReactNode;
  infoUnselected?: boolean;
  /** Icon grid (`.panel.icon-list`). */
  children: ReactNode;
  /** Default height for the scrollable pane so rails can appear. */
  paneHeight?: number | string;
};

/**
 * Control-panel style window: info + icon list inside a scrollable field-border pane.
 * Status bar is expected by convention (pass `statusBar`).
 */
export function IconPanelWindow({
  info,
  infoUnselected = false,
  children,
  className,
  paneHeight = 280,
  resizable = true,
  ...shell
}: IconPanelWindowProps) {
  const paneStyle: CSSProperties = {
    height: typeof paneHeight === 'number' ? `${paneHeight}px` : paneHeight,
  };

  return (
    <PaneWindowShell
      className={cn('w-window-xl', className)}
      resizable={resizable}
      {...shell}
    >
      <ScrollableRegion
        className="window-pane icon-panel-layout field-border"
        style={paneStyle}
      >
        <div className={cn('panel info', infoUnselected && 'unselected')}>{info}</div>
        <div className="panel icon-list">{children}</div>
      </ScrollableRegion>
    </PaneWindowShell>
  );
}
