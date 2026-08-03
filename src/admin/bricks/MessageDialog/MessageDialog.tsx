import { Button, FieldRow, TitleBarControl, TitleBarControls } from '../../chrome';
import { DialogWindow, type DialogWindowType } from '../DialogWindow';
import { cn } from '../../../lib/cn';

export type MessageDialogProps = {
  type?: Exclude<DialogWindowType, 'none'>;
  title?: string;
  message: string;
  onClose: () => void;
  className?: string;
  /** Override OK label. */
  okLabel?: string;
};

const DEFAULT_TITLES: Record<Exclude<DialogWindowType, 'none'>, string> = {
  info: 'WebHemi',
  question: 'Confirm',
  warning: 'Warning',
  error: 'Error',
};

/**
 * Classic Win98 message box (icon + message + OK). Pair with {@link DesktopModal}.
 * Sound is played by the caller when opening (once).
 */
export function MessageDialog({
  type = 'error',
  title,
  message,
  onClose,
  className,
  okLabel = 'OK',
}: MessageDialogProps) {
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
          <Button type="button" isDefault accessKey="o" onClick={onClose}>
            {okLabel}
          </Button>
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
