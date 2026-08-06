import { Button, FieldRow, TitleBarControl, TitleBarControls } from '../../chrome';
import { DialogWindow, type DialogWindowType } from '../DialogWindow';
import { cn } from '../../../lib/cn';

export type MessageDialogProps = {
  type?: Exclude<DialogWindowType, 'none'>;
  title?: string;
  message: string;
  /** Dismiss (OK when no confirm; Cancel/No/Close when confirm). */
  onClose: () => void;
  /**
   * When set, shows Cancel + Confirm (Win98 question box).
   * Confirm runs this; Cancel / title Close call {@link onClose}.
   */
  onConfirm?: () => void;
  className?: string;
  /** OK label when {@link onConfirm} is omitted. */
  okLabel?: string;
  /** Confirm button label when {@link onConfirm} is set. */
  confirmLabel?: string;
  /** Cancel button label when {@link onConfirm} is set. */
  cancelLabel?: string;
};

const DEFAULT_TITLES: Record<Exclude<DialogWindowType, 'none'>, string> = {
  info: 'WebHemi',
  question: 'Confirm',
  warning: 'Warning',
  error: 'Error',
};

/**
 * Classic Win98 message box. Pair with {@link DesktopModal}.
 * Sound is played by the caller when opening (once).
 */
export function MessageDialog({
  type = 'error',
  title,
  message,
  onClose,
  onConfirm,
  className,
  okLabel = 'OK',
  confirmLabel = 'Yes',
  cancelLabel = 'No',
}: MessageDialogProps) {
  const isConfirm = typeof onConfirm === 'function';

  return (
    <DialogWindow
      className={cn('message-dialog', className)}
      type={type}
      title={title ?? DEFAULT_TITLES[type]}
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
      actions={
        <FieldRow className="justify-center">
          {isConfirm ? (
            <>
              <Button type="button" isDefault accessKey="y" onClick={onConfirm}>
                {confirmLabel}
              </Button>
              <Button type="button" accessKey="n" onClick={onClose}>
                {cancelLabel}
              </Button>
            </>
          ) : (
            <Button type="button" isDefault accessKey="o" onClick={onClose}>
              {okLabel}
            </Button>
          )}
        </FieldRow>
      }
    >
      {message.split('\n').map((line, index) => (
        <p key={`${index}-${line}`} style={{ marginTop: 0, marginBottom: 8 }}>
          {line}
        </p>
      ))}
    </DialogWindow>
  );
}
