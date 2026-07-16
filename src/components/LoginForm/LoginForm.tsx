import type { FormEvent } from 'react';
import { Button } from '../Button/Button';
import { FormField } from '../FormField/FormField';
import { Input } from '../Input/Input';
import { Checkbox } from '../Checkbox/Checkbox';
import { Alert } from '../Alert/Alert';
import { cn } from '../../lib/cn';

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
    <div
      className={cn(
        'wh-ui mx-auto w-full max-w-md rounded-[var(--wh-radius-md)] border border-[var(--wh-color-line)] bg-[var(--wh-color-surface)] p-8 shadow-sm',
        className,
      )}
    >
      <div className="mb-6 text-center">
        <p className="font-[family-name:var(--wh-font-display)] text-3xl text-[var(--wh-color-ink)]">
          WebHemi
        </p>
        <p className="mt-1 text-sm text-[var(--wh-color-muted)]">Sign in to the control panel</p>
      </div>

      {error ? (
        <Alert tone="danger" title="Sign-in failed" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form action={action} method={method} onSubmit={handleSubmit}>
        {csrfToken ? <input type="hidden" name={csrfFieldName} value={csrfToken} /> : null}
        <FormField label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={emailDefault}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        <div className="mb-6">
          <Checkbox name="remember" label="Remember me" />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
