import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 98.css `.default` — primary Enter action */
  isDefault?: boolean;
  loading?: boolean;
  children?: ReactNode;
};

/** Win98 chrome button — class contract from owned chrome SCSS. */
export function Button({
  isDefault = false,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(isDefault && 'default', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}

export function VerticalBar({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('vertical-bar', className)} {...rest} />;
}
