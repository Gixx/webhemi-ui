import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { underlineAccessKey } from './underlineAccessKey';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Chrome `.default` — primary Enter action */
  isDefault?: boolean;
  loading?: boolean;
  children?: ReactNode;
  /**
   * Keyboard access key. Sets the native `accesskey` attribute. When `children` is a
   * plain string, underlines the first case-insensitive match (e.g. `o` + `"OK"` → `<u>O</u>K`).
   * React-tree children are left unchanged.
   */
  accessKey?: string;
};

/** Retro OS chrome button — class contract from owned chrome SCSS. */
export function Button({
  isDefault = false,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  accessKey,
  ...rest
}: ButtonProps) {
  const content =
    loading || !accessKey || typeof children !== 'string'
      ? children
      : underlineAccessKey(children, accessKey);

  return (
    <button
      type={type}
      className={cn(isDefault && 'default', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      accessKey={accessKey || undefined}
      {...rest}
    >
      {loading ? '…' : content}
    </button>
  );
}

export function VerticalBar({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('vertical-bar', className)} {...rest} />;
}
