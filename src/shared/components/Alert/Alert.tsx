import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { Icon } from '../Icon/Icon';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

const toneClass: Record<AlertTone, string> = {
  info: 'border-[var(--wh-color-accent)] bg-[color-mix(in_srgb,var(--wh-color-accent)_10%,white)]',
  success: 'border-[var(--wh-color-success)] bg-[color-mix(in_srgb,var(--wh-color-success)_10%,white)]',
  warning: 'border-[var(--wh-color-warning)] bg-[color-mix(in_srgb,var(--wh-color-warning)_10%,white)]',
  danger: 'border-[var(--wh-color-danger)] bg-[color-mix(in_srgb,var(--wh-color-danger)_10%,white)]',
};

export function Alert({ tone = 'info', title, children, className, ...rest }: AlertProps) {
  return (
    <div
      role="status"
      className={cn(
        'wh-ui flex gap-3 rounded-[var(--wh-radius-md)] border-l-4 px-4 py-3',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      <Icon name={tone === 'success' ? 'check' : 'alert'} className="mt-0.5 text-lg" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-sm text-[var(--wh-color-ink-soft)]">{children}</div>
      </div>
    </div>
  );
}
