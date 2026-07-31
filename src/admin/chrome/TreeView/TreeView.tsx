import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

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

export type TreeToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> & {
  /** When true, shows the collapse ([-]) glyph. */
  expanded?: boolean;
};

/**
 * Expand/collapse control for a tree branch.
 * Place as the first child of `<summary>`; click only this — not the whole row —
 * to toggle. Pair with `onClick={(e) => e.preventDefault()}` on `<summary>` so
 * the label can be selected independently (Win98 Explorer behavior).
 */
export function TreeToggle({
  className,
  expanded = false,
  'aria-label': ariaLabel,
  ...rest
}: TreeToggleProps) {
  return (
    <button
      type="button"
      className={cn('tree-toggle', className)}
      aria-expanded={expanded}
      aria-label={ariaLabel ?? (expanded ? 'Collapse' : 'Expand')}
      {...rest}
    />
  );
}
