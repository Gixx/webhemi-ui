import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--wh-color-accent)] text-white hover:brightness-110 border-transparent',
  secondary:
    'bg-[var(--wh-color-surface)] text-[var(--wh-color-ink)] border-[var(--wh-color-line)] hover:border-[var(--wh-color-accent)]',
  ghost:
    'bg-transparent text-[var(--wh-color-ink-soft)] border-transparent hover:bg-[var(--wh-color-surface)]',
  danger:
    'bg-[var(--wh-color-danger)] text-white border-transparent hover:brightness-110',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'wh-ui inline-flex items-center justify-center gap-2 rounded-[var(--wh-radius-sm)] border font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span aria-hidden="true">…</span> : null}
      {children}
    </button>
  );
}
