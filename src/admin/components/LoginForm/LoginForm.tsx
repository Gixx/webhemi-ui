import type { FormEvent } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  TextBox,
  TitleBar,
  TitleBarText,
  Window,
  WindowBody,
} from '../../chrome';
import { cn } from '../../../lib/cn';

export interface LoginFormProps {
  action?: string;
  method?: 'post' | 'get';
  csrfToken?: string;
  csrfFieldName?: string;
  error?: string;
  loading?: boolean;
  emailDefault?: string;
  onSubmit?: (payload: { email: string; password: string; remember: boolean }) => void;
  className?: string;
}

/**
 * Win98 login dialog composed from chrome atoms + product dialog-panel-layout.
 */
export function LoginForm({
  action = '/login',
  method = 'post',
  csrfToken,
  csrfFieldName = '_csrf_token',
  error,
  loading = false,
  emailDefault = '',
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

  return (
    <Window className={cn('w-window-sm', className)}>
      <TitleBar>
        <TitleBarText>Sign in — WebHemi</TitleBarText>
      </TitleBar>
      <WindowBody>
        <form action={action} method={method} onSubmit={handleSubmit}>
          {csrfToken ? <input type="hidden" name={csrfFieldName} value={csrfToken} /> : null}
          <div className="window-pane dialog-panel-layout">
            <div className="panel">
              {error ? (
                <p role="alert" style={{ marginTop: 0, marginBottom: 10, color: '#800000' }}>
                  {error}
                </p>
              ) : null}
              <FieldRow>
                <label htmlFor="email">
                  <u>E</u>mail:
                </label>
                <TextBox
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  defaultValue={emailDefault}
                  required
                  className="w-window-xs"
                />
              </FieldRow>
              <FieldRow>
                <label htmlFor="password">
                  <u>P</u>assword:
                </label>
                <TextBox
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-window-xs"
                />
              </FieldRow>
              <FieldRow>
                <Checkbox id="remember" name="remember" label="Remember me" />
              </FieldRow>
            </div>
            <div className="panel actions">
              <FieldRow className="justify-end">
                <Button type="submit" isDefault loading={loading}>
                  Sign in
                </Button>
              </FieldRow>
            </div>
          </div>
        </form>
      </WindowBody>
    </Window>
  );
}
