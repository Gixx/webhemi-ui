import { useId, useState } from 'react';
import { Button, FieldRow, TextBox, TitleBarControl, TitleBarControls } from '../../chrome';
import type { TitleBarIconKind } from '../_lib/titleBarIcon';
import { DesktopModal } from '../DesktopModal';
import { DialogWindow } from '../DialogWindow';

export type ExplorerPromptDialogProps = {
  title: string;
  label: string;
  /** Title-bar glyph; New Folder/Rename folder → folder, New Page/Rename page → file-document. */
  titleIcon?: TitleBarIconKind;
  initialValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/** Small name prompt (New Folder / New Page / Rename). */
export function ExplorerPromptDialog({
  title,
  label,
  titleIcon = 'folder',
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
        className="explorer-prompt-dialog"
        title={title}
        titleIcon={titleIcon}
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Close" onClick={onCancel} />
          </TitleBarControls>
        }
        actions={
          <FieldRow className="justify-end">
            <Button type="button" onClick={submit}>
              {confirmLabel}
            </Button>
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          </FieldRow>
        }
      >
        <FieldRow>
          <TextBox
            id={inputId}
            label={label}
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
