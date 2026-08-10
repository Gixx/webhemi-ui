import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  Button,
  FieldRow,
  TextArea,
  TextBox,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type PermissionFormMode = 'new' | 'edit';

export type PermissionFormValues = {
  name: string;
  label: string;
  description: string;
};

export type PermissionFormSavePayload = PermissionFormValues & {
  mode: PermissionFormMode;
  permissionId?: number;
};

export type PermissionFormDialogProps = {
  mode: PermissionFormMode;
  initial?: Partial<PermissionFormValues> & {
    permissionId?: number;
    title?: string;
  };
  fieldErrors?: Partial<Record<'name' | 'label' | 'description', string>>;
  saving?: boolean;
  onSave: (payload: PermissionFormSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  className?: string;
};

/**
 * New / Edit Permission modal (nested `.window` — not a shell window).
 */
export function PermissionFormDialog({
  mode,
  initial,
  fieldErrors,
  saving = false,
  onSave,
  onError,
  onClose,
  className,
}: PermissionFormDialogProps) {
  const nameId = useId();
  const labelId = useId();
  const descriptionId = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'name' | 'label' | 'description', string>>
  >({});

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  const mergedErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const title =
    initial?.title ??
    (mode === 'edit' ? `Edit Permission — ${initial?.name ?? ''}` : 'New Permission');

  const validate = (): boolean => {
    const next: Partial<Record<'name' | 'label', string>> = {};
    const trimmedName = name.trim().toLowerCase();
    const trimmedLabel = label.trim();
    if (!trimmedName) {
      next.name = 'Name is required.';
    } else if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(trimmedName)) {
      next.name =
        'Name must be lowercase letters, digits, dots, underscores, or hyphens.';
    }
    if (!trimmedLabel) {
      next.label = 'Label is required.';
    }
    setLocalErrors(next);
    if (Object.keys(next).length > 0) {
      onError?.(Object.values(next).join('\n'));
      return false;
    }
    return true;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving || !validate()) {
      return;
    }
    onSave({
      mode,
      permissionId: initial?.permissionId,
      name: name.trim().toLowerCase(),
      label: label.trim(),
      description: description.trim(),
    });
  };

  return (
    <PaneWindowShell
      className={cn('permission-form-dialog', className)}
      width={420}
      title={title}
      titleIcon="permissions"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="permission-form-dialog-form" onSubmit={handleSubmit} noValidate>
        <FieldRow>
          <TextBox
            id={nameId}
            label="Name:"
            accessKey="n"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(mergedErrors.name) || undefined}
            disabled={saving}
            autoFocus
          />
        </FieldRow>
        <FieldRow>
          <TextBox
            id={labelId}
            label="Label:"
            accessKey="l"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            aria-invalid={Boolean(mergedErrors.label) || undefined}
            disabled={saving}
          />
        </FieldRow>
        <FieldRow>
          <TextArea
            id={descriptionId}
            label="Description:"
            accessKey="d"
            rows={4}
            resizable="vertical"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={Boolean(mergedErrors.description) || undefined}
            disabled={saving}
          />
        </FieldRow>
        <FieldRow className="justify-end">
          <Button type="submit" isDefault accessKey="o" disabled={saving}>
            OK
          </Button>
          <Button type="button" accessKey="c" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      </form>
    </PaneWindowShell>
  );
}
