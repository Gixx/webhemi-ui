import { LoginForm } from '../LoginForm/LoginForm';

export type LoginPageProps = {
  action: string;
  csrfToken?: string;
  csrfFieldName?: string;
  emailDefault?: string;
  error?: string | null;
};

export function LoginPage({
  action,
  csrfToken,
  csrfFieldName,
  emailDefault,
  error,
}: LoginPageProps) {
  return (
    <LoginForm
      action={action}
      csrfToken={csrfToken}
      csrfFieldName={csrfFieldName}
      emailDefault={emailDefault || ''}
      error={error || undefined}
    />
  );
}
