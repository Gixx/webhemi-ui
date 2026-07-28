import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import dialogErrorUrl from '../../assets/icons/dialog_error.svg';
import dialogInfoUrl from '../../assets/icons/dialog_info.svg';
import dialogQuestionUrl from '../../assets/icons/dialog_question.svg';
import dialogWarningUrl from '../../assets/icons/dialog_warning.svg';
import { PaneWindowShell, type PaneWindowShellProps } from '../_lib/PaneWindowShell';

export type DialogWindowType = 'none' | 'info' | 'question' | 'warning' | 'error';

const DIALOG_ICONS: Record<Exclude<DialogWindowType, 'none'>, string> = {
  info: dialogInfoUrl,
  question: dialogQuestionUrl,
  warning: dialogWarningUrl,
  error: dialogErrorUrl,
};

export type DialogWindowProps = Omit<PaneWindowShellProps, 'children' | 'type'> & {
  /** Optional top banner (image). */
  banner?: ReactNode;
  /**
   * Message-box glyph beside the content. `none` (default) = no icon.
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
  const iconSrc = type === 'none' ? null : DIALOG_ICONS[type];

  return (
    <PaneWindowShell className={cn('w-window-sm', className)} {...shell}>
      <div className="window-pane dialog-panel-layout">
        {banner ? <div className="panel banner">{banner}</div> : null}
        <div className={cn('panel', iconSrc && 'dialog-typed')}>
          {iconSrc ? (
            <>
              <img className="dialog-icon" src={iconSrc} alt="" width={32} height={32} />
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
