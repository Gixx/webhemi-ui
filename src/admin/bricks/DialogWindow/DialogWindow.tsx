import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';

export type DialogWindowType = 'none' | 'info' | 'question' | 'warning' | 'error';

export type DialogWindowProps = Omit<PaneWindowShellProps, 'children' | 'type'> & {
  /** Optional top banner (image). */
  banner?: ReactNode;
  /**
   * Message-box glyph beside the content. `none` (default) = no icon.
   * Glyph is CSS background (digested via AssetMapper); not an `<img src>`.
   * Actions stay full width; only the content panel is indented.
   */
  type?: DialogWindowType;
  /** Main content panel (form / message). */
  children: ReactNode;
  /** Footer actions panel (buttons). */
  actions?: ReactNode;
};

/**
 * Compact dialog window (`dialog-panel-layout`) — login, alert, message boxes.
 */
export function DialogWindow({
  banner,
  type = 'none',
  children,
  actions,
  className,
  ...shell
}: DialogWindowProps) {
  const typed = type !== 'none';

  return (
    <PaneWindowShell className={cn('w-window-sm', className)} {...shell}>
      <div className="window-pane dialog-panel-layout">
        {banner ? <div className="panel banner">{banner}</div> : null}
        <div className={cn('panel', typed && 'dialog-typed')}>
          {typed ? (
            <>
              <span className={cn('dialog-icon', `dialog-icon--${type}`)} aria-hidden />
              <div className="dialog-body">{children}</div>
            </>
          ) : (
            children
          )}
        </div>
        {actions ? <div className="panel actions">{actions}</div> : null}
      </div>
    </PaneWindowShell>
  );
}
