import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'wh-ui mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--wh-color-line)] pb-4',
        className,
      )}
    >
      <div>
        <h1 className="font-[family-name:var(--wh-font-display)] text-3xl tracking-tight text-[var(--wh-color-ink)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[var(--wh-color-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
