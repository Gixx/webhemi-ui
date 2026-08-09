import type { ReactNode } from 'react';
import { cn } from '../../../../lib/cn';

export interface SiteHeaderProps {
  siteName: string;
  navItems?: Array<{ label: string; href: string; active?: boolean }>;
  actions?: ReactNode;
  className?: string;
}

/** Public-site header for the Default frontend theme. */
export function SiteHeader({ siteName, navItems = [], actions, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'wh-ui border-b border-[var(--wh-color-line)] bg-[var(--wh-color-surface)]',
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <a
          href="/"
          className="font-[family-name:var(--wh-font-display)] text-2xl text-[var(--wh-color-ink)] no-underline"
        >
          {siteName}
        </a>
        <nav className="flex flex-1 items-center gap-4" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={`${item.label}:${item.href}`}
              href={item.href}
              className={cn(
                'text-sm no-underline',
                item.active
                  ? 'font-semibold text-[var(--wh-color-accent)]'
                  : 'text-[var(--wh-color-muted)] hover:text-[var(--wh-color-ink)]',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
