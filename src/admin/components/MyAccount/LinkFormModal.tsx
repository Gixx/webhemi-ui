import { useId, useState, type FormEvent } from 'react';
import {
  Button,
  FieldRow,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';

export type UserLinkDraft = {
  id?: number;
  name: string;
  url: string;
};

export type LinkFormModalProps = {
  mode: 'add' | 'edit';
  initial?: UserLinkDraft;
  onSave: (link: UserLinkDraft) => void;
  onClose: () => void;
  onError?: (message: string) => void;
};

export function LinkFormModal({
  mode,
  initial,
  onSave,
  onClose,
  onError,
}: LinkFormModalProps) {
  const nameId = useId();
  const urlId = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextName = name.trim();
    const nextUrl = url.trim();
    if (!nextName) {
      onError?.('Link name is required.');
      return;
    }
    if (!nextUrl) {
      onError?.('Link URL is required.');
      return;
    }
    try {
      // Throws on invalid absolute URL.
      // eslint-disable-next-line no-new
      new URL(nextUrl);
    } catch {
      onError?.('Link URL must be a valid URL (include https://).');
      return;
    }
    onSave({ id: initial?.id, name: nextName, url: nextUrl });
  };

  return (
    <PaneWindowShell
      className="link-form-dialog"
      width={360}
      title={mode === 'add' ? 'Add Link' : 'Edit Link'}
      titleIcon="external-link"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <WindowBody>
          <FieldRow>
            <TextBox
              id={nameId}
              label="Name:"
              accessKey="n"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </FieldRow>
          <FieldRow>
            <TextBox
              id={urlId}
              label="URL:"
              accessKey="u"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FieldRow>
          <FieldRow className="justify-end" style={{ marginTop: 12 }}>
            <Button type="submit" isDefault accessKey="k">
              OK
            </Button>
            <Button type="button" accessKey="a" onClick={onClose}>
              Cancel
            </Button>
          </FieldRow>
        </WindowBody>
      </form>
    </PaneWindowShell>
  );
}
