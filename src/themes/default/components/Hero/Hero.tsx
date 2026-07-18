import type { ReactNode } from 'react';
import { cn } from '../../../../lib/cn';

export interface HeroProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/** Full-bleed hero for the Default frontend theme. */
export function Hero({ title, subtitle, actions, className }: HeroProps) {
  return (
    <section
      className={cn(
        'wh-ui relative overflow-hidden bg-[var(--wh-color-ink)] text-[var(--wh-color-surface)]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, var(--wh-color-accent) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, var(--wh-color-accent-hot) 0%, transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-end gap-4 px-6 pb-16 pt-24">
        <h1 className="max-w-3xl font-[family-name:var(--wh-font-display)] text-5xl leading-tight md:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-xl text-lg text-[var(--wh-color-canvas)]/90">{subtitle}</p>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
