import { useRef, type HTMLAttributes, type ReactNode, type TableHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { useTableView } from './useTableView';

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Enables row click highlight via {@link useTableView} */
  interactive?: boolean;
  children: ReactNode;
};

export function Table({ interactive = false, className, children, ...rest }: TableProps) {
  const ref = useRef<HTMLTableElement>(null);
  useTableView(ref, interactive);

  return (
    <table ref={ref} className={cn(interactive && 'interactive', className)} {...rest}>
      {children}
    </table>
  );
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  highlighted?: boolean;
  children: ReactNode;
};

export function TableRow({ highlighted = false, className, children, ...rest }: TableRowProps) {
  return (
    <tr className={cn(highlighted && 'highlighted', className)} {...rest}>
      {children}
    </tr>
  );
}
