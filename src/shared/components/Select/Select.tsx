import type { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        'wh-ui w-full rounded-[var(--wh-radius-sm)] border bg-[var(--wh-color-surface)] px-3 py-2 text-base outline-none focus:border-[var(--wh-color-accent)] focus:ring-2 focus:ring-[var(--wh-color-accent)]/20',
        invalid
          ? 'border-[var(--wh-color-danger)]'
          : 'border-[var(--wh-color-line)]',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
