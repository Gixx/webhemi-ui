import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--wh-color-line)] text-[var(--wh-color-ink)]',
  success: 'bg-[color-mix(in_srgb,var(--wh-color-success)_18%,white)] text-[var(--wh-color-success)]',
  warning: 'bg-[color-mix(in_srgb,var(--wh-color-warning)_18%,white)] text-[var(--wh-color-warning)]',
  danger: 'bg-[color-mix(in_srgb,var(--wh-color-danger)_18%,white)] text-[var(--wh-color-danger)]',
  accent: 'bg-[color-mix(in_srgb,var(--wh-color-accent)_18%,white)] text-[var(--wh-color-accent)]',
};

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'wh-ui inline-flex items-center rounded-[var(--wh-radius-sm)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
