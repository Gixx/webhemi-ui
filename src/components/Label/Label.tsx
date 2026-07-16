import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export function Label({ children, required, className, ...rest }: LabelProps) {
  return (
    <label
      className={cn(
        'wh-ui mb-1 block text-sm font-semibold text-[var(--wh-color-ink-soft)]',
        className,
      )}
      {...rest}
    >
      {children}
      {required ? (
        <span className="ml-1 text-[var(--wh-color-accent-hot)]" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
