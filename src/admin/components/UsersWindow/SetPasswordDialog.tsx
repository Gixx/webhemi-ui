import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  Button,
  FieldRow,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type SetPasswordSavePayload = {
  userId: number;
  /** Present in self mode only. */
  currentPassword?: string;
  password: string;
};

export type SetPasswordFieldKey =
  | 'currentPassword'
  | 'password'
  | 'confirmPassword';

export type SetPasswordMode = 'self' | 'other';

export type SetPasswordDialogProps = {
  userId: number;
  userEmail: string;
  /** self = old+new+confirm; other = new+confirm (admin reset). */
  mode?: SetPasswordMode;
  fieldErrors?: Partial<Record<SetPasswordFieldKey, string>>;
  saving?: boolean;
  onSave: (payload: SetPasswordSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  className?: string;
};

/**
 * Classic Win9x-style password dialog.
 * Self: Current + New + Confirm. Other: New + Confirm only.
 */
export function SetPasswordDialog({
  userId,
  userEmail,
  mode = 'self',
  fieldErrors,
  saving = false,
  onSave,
  onError,
  onClose,
  className,
}: SetPasswordDialogProps) {
  const currentId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<SetPasswordFieldKey, string>>
  >({});

  const requireCurrent = mode === 'self';

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  const mergedErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const busy = saving;

  const validate = (): boolean => {
    const next: Partial<Record<SetPasswordFieldKey, string>> = {};
    if (requireCurrent && !currentPassword) {
      next.currentPassword = 'Current password is required.';
    }
    if (!password) {
      next.password = 'New password is required.';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Confirm the new password.';
    } else if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
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
      userId,
      ...(requireCurrent ? { currentPassword } : {}),
      password,
    });
  };

  return (
    <PaneWindowShell
      className={cn('set-password-dialog', className)}
      width={420}
      title="Set Password"
      titleIcon="users"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <WindowBody>
          <p style={{ marginTop: 0 }}>
            Set a new password for <strong>{userEmail}</strong>.
          </p>
          <FieldRow style={{ alignItems: 'flex-start' }}>
            <div
              className="stack"
              style={{ flex: '1 1 auto', minWidth: 0, gap: 8 }}
            >
              {requireCurrent ? (
                <FieldRow>
                  <TextBox
                    id={currentId}
                    label="Old password:"
                    accessKey="o"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    aria-invalid={
                      Boolean(mergedErrors.currentPassword) || undefined
                    }
                    disabled={busy}
                    autoFocus
                  />
                </FieldRow>
              ) : null}
              <FieldRow>
                <TextBox
                  id={passwordId}
                  label="New password:"
                  accessKey="n"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(mergedErrors.password) || undefined}
                  disabled={busy}
                  autoFocus={!requireCurrent}
                />
              </FieldRow>
              <FieldRow>
                <TextBox
                  id={confirmId}
                  label="Confirm new password:"
                  accessKey="c"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={
                    Boolean(mergedErrors.confirmPassword) || undefined
                  }
                  disabled={busy}
                />
              </FieldRow>
            </div>
            <div
              className="stack"
              style={{ flex: '0 0 auto', width: '5.5em', gap: 8 }}
            >
              <Button
                type="submit"
                isDefault
                accessKey="k"
                loading={saving}
                style={{ width: '100%' }}
              >
                OK
              </Button>
              <Button
                type="button"
                accessKey="a"
                disabled={busy}
                onClick={onClose}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
            </div>
          </FieldRow>
        </WindowBody>
      </form>
    </PaneWindowShell>
  );
}
