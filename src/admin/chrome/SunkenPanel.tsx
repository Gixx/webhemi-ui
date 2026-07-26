import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Scrollable } from './Scrollable';

export type SunkenPanelProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, host uses Retro OS custom scrollbar (`.scrollable` + viewport). */
  scrollable?: boolean;
  children?: ReactNode;
};

export function SunkenPanel({
  scrollable = false,
  className,
  children,
  ...rest
}: SunkenPanelProps) {
  if (scrollable) {
    return (
      <Scrollable className={cn('sunken-panel', className)} {...rest}>
        {children}
      </Scrollable>
    );
  }

  return (
    <div className={cn('sunken-panel', className)} {...rest}>
      {children}
    </div>
  );
}

export type FieldBorderProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  /** When true, host uses Retro OS custom scrollbar (`.scrollable` + viewport). */
  scrollable?: boolean;
  children?: ReactNode;
};

export function FieldBorder({
  disabled = false,
  scrollable = false,
  className,
  children,
  ...rest
}: FieldBorderProps) {
  const borderClass = disabled ? 'field-border-disabled' : 'field-border';

  if (scrollable) {
    return (
      <Scrollable className={cn(borderClass, className)} {...rest}>
        {children}
      </Scrollable>
    );
  }

  return (
    <div className={cn(borderClass, className)} {...rest}>
      {children}
    </div>
  );
}
