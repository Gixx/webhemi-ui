import { useId, useState } from 'react';
import { Button, FieldRow, TextBox, TitleBarControl, TitleBarControls } from '../../chrome';
import { DesktopModal } from '../DesktopModal';
import { DialogWindow } from '../DialogWindow';

export type ExplorerPromptDialogProps = {
  title: string;
  label: string;
  initialValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/** Small name prompt (New Folder / New Page / Rename). */
export function ExplorerPromptDialog({
  title,
  label,
  initialValue = '',
  confirmLabel = 'OK',
  onConfirm,
  onCancel,
}: ExplorerPromptDialogProps) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <DesktopModal>
      <DialogWindow
        title={title}
        titleIcon="folder"
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Close" onClick={onCancel} />
          </TitleBarControls>
        }
        actions={
          <>
            <Button type="button" onClick={submit}>
              {confirmLabel}
            </Button>
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          </>
        }
      >
        <FieldRow>
          <label htmlFor={inputId}>{label}</label>
          <TextBox
            id={inputId}
            value={value}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </FieldRow>
      </DialogWindow>
    </DesktopModal>
  );
}
