import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  const inputId = id ?? `wh-cb-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'wh-ui inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--wh-color-ink)]',
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="size-4 accent-[var(--wh-color-accent)]"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
