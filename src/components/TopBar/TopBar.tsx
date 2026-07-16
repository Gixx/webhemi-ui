import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TopBarProps {
  title?: string;
  userLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function TopBar({ title, userLabel, actions, className }: TopBarProps) {
  return (
    <div
      className={cn(
        'wh-ui flex items-center justify-between gap-4 border-b border-[var(--wh-color-line)] bg-[var(--wh-color-surface)] px-6 py-3',
        className,
      )}
    >
      <p className="text-sm font-medium text-[var(--wh-color-muted)]">{title ?? 'Control panel'}</p>
      <div className="flex items-center gap-3">
        {actions}
        {userLabel ? (
          <span className="rounded-[var(--wh-radius-sm)] bg-[var(--wh-color-canvas)] px-3 py-1 text-sm">
            {userLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
