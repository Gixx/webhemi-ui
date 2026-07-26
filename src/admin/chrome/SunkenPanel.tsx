import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SunkenPanelProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function SunkenPanel({ className, children, ...rest }: SunkenPanelProps) {
  return (
    <div className={cn('sunken-panel', className)} {...rest}>
      {children}
    </div>
  );
}

export type FieldBorderProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  children?: ReactNode;
};

export function FieldBorder({ disabled = false, className, children, ...rest }: FieldBorderProps) {
  return (
    <div
      className={cn(disabled ? 'field-border-disabled' : 'field-border', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
