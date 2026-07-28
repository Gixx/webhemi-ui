import type { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={cn(className)} {...rest}>
      {children}
    </select>
  );
}
