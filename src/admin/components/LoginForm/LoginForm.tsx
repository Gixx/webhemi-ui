import type { FormEvent } from 'react';
import { Button, FieldRow, TextBox } from '../../chrome';
import { DialogWindow } from '../../bricks';
import { adminAsset } from '../../lib/assetPaths';
import { cn } from '../../../lib/cn';

export interface LoginFormProps {
  action?: string;
  method?: 'post' | 'get';
  csrfToken?: string;
  csrfFieldName?: string;
  loading?: boolean;
  emailDefault?: string;
  /**
   * Digested AssetMapper URL from Twig (`asset('admin/system/...')`).
   * Storybook falls back to `adminAsset(...)` (staticDirs).
   */
  bannerUrl?: string;
  onSubmit?: (payload: { email: string; password: string; remember: boolean }) => void;
  className?: string;
}

/**
 * Retro OS login dialog composed from DialogWindow + chrome form atoms.
 * Auth errors are shown by the page via MessageDialog (not inline).
 * Native HTML5 validation is off (`noValidate`) so browser tooltips
 * do not break the Retro OS chrome; the backend validates on submit.
 */
export function LoginForm({
  action = '/admin/login',
  method = 'post',
  csrfToken,
  csrfFieldName = '_csrf_token',
  loading = false,
  emailDefault = '',
  bannerUrl,
  onSubmit,
  className,
}: LoginFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!onSubmit) {
      return;
    }
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      remember: data.get('remember') === 'on',
    });
  };

  const bannerSrc = bannerUrl || adminAsset('system/banner-dialog-login.gif');

  return (
    <form
      action={action}
      method={method}
      onSubmit={handleSubmit}
      noValidate
      className={cn(className)}
    >
      {csrfToken ? <input type="hidden" name={csrfFieldName} value={csrfToken} /> : null}
      <DialogWindow
        title="Sign in — WebHemi CMS Admin"
        titleBarControls={null}
        banner={<img alt="" className="dialog-banner" src={bannerSrc} />}
        actions={
          <FieldRow className="justify-end">
            <Button type="submit" isDefault loading={loading}>
              OK
            </Button>
          </FieldRow>
        }
      >
        <FieldRow>
          <TextBox
            id="email"
            name="email"
            type="email"
            label="Email:"
            accessKey="e"
            autoComplete="username"
            defaultValue={emailDefault}
            className="w-window-xs"
          />
        </FieldRow>
        <FieldRow>
          <TextBox
            id="password"
            name="password"
            type="password"
            label="Password:"
            accessKey="p"
            autoComplete="current-password"
            className="w-window-xs"
          />
        </FieldRow>
      </DialogWindow>
    </form>
  );
}
