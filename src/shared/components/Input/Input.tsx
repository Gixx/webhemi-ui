import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, id, ...rest }: InputProps) {
  return (
    <input
      id={id}
      className={cn(
        'wh-ui w-full rounded-[var(--wh-radius-sm)] border bg-[var(--wh-color-surface)] px-3 py-2 text-base outline-none transition focus:border-[var(--wh-color-accent)] focus:ring-2 focus:ring-[var(--wh-color-accent)]/20',
        invalid
          ? 'border-[var(--wh-color-danger)]'
          : 'border-[var(--wh-color-line)]',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
