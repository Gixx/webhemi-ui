import type { ReactNode } from 'react';
import { Label } from '../Label/Label';
import { cn } from '../../lib/cn';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('wh-ui mb-4', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-sm text-[var(--wh-color-muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-sm text-[var(--wh-color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
