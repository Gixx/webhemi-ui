import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type TreeViewProps = HTMLAttributes<HTMLUListElement> & {
  children: ReactNode;
};

/** `ul.tree-view` — nested lists / details allowed as children. */
export function TreeView({ className, children, ...rest }: TreeViewProps) {
  return (
    <ul className={cn('tree-view', className)} {...rest}>
      {children}
    </ul>
  );
}
