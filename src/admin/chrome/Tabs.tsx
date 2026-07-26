import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type TabListProps = HTMLAttributes<HTMLMenuElement> & {
  /**
   * `.multirows` — children should be {@link TabRow} groups.
   * Promote the selected tab’s row to the end in app/story state (Win32);
   * {@link selectedIndex} applies only within the last row.
   */
  multirows?: boolean;
  children: ReactNode;
};

/** `menu[role=tablist]` — 98-compatible tab strip. */
export function TabList({ multirows = false, className, children, ...rest }: TabListProps) {
  return (
    <menu role="tablist" className={cn(multirows && 'multirows', className)} {...rest}>
      {children}
    </menu>
  );
}

export type TabRowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * One visual row of tabs inside a `multirows` {@link TabList}.
 * Presentation-only wrapper — tabs stay `li[role=tab]` for a11y/CSS.
 */
export function TabRow({ className, children, ...rest }: TabRowProps) {
  return (
    <div className={cn('tab-row', className)} role="presentation" {...rest}>
      {children}
    </div>
  );
}

export type TabProps = LiHTMLAttributes<HTMLLIElement> & {
  selected?: boolean;
  href?: string;
  children: ReactNode;
};

export function Tab({ selected = false, href = '#', className, children, ...rest }: TabProps) {
  return (
    <li role="tab" aria-selected={selected} className={cn(className)} {...rest}>
      <a href={href}>{children}</a>
    </li>
  );
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Nested tab content shell: `.window[role=tabpanel]`.
 * Not a shell {@link Window} — keep the name separate for product/shell JS.
 */
export function TabPanel({ className, children, ...rest }: TabPanelProps) {
  return (
    <div role="tabpanel" className={cn('window', className)} {...rest}>
      {children}
    </div>
  );
}
