import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  /** 0–100 — width of the bar */
  value?: number;
  segmented?: boolean;
};

export function Progress({ value = 0, segmented = false, className, ...rest }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('progress-indicator', segmented && 'segmented', className)} {...rest}>
      <span className="progress-indicator-bar" style={{ width: `${clamped}%` }} />
    </div>
  );
}
