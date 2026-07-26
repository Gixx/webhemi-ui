import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type FieldRowProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * `.field-row-stacked` — lay this row’s children vertically (label above control).
   * Default is horizontal (label beside control).
   *
   * Contract: one label + one input/select/textarea per FieldRow.
   * Exception: multiple buttons are allowed in one row (e.g. OK / Cancel).
   * Sibling FieldRows always stack as form rows unless wrapped in {@link FieldColumn}.
   */
  stacked?: boolean;
  children: ReactNode;
};

export function FieldRow({ stacked = false, className, children, ...rest }: FieldRowProps) {
  return (
    <div className={cn(stacked ? 'field-row-stacked' : 'field-row', className)} {...rest}>
      {children}
    </div>
  );
}

export type FieldColumnProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Product `.field-column` — lays sibling FieldRows in a horizontal wrapping row
 * (typical for radio/checkbox groups). Without this wrapper, FieldRows stack vertically.
 */
export function FieldColumn({ className, children, ...rest }: FieldColumnProps) {
  return (
    <div className={cn('field-column', className)} {...rest}>
      {children}
    </div>
  );
}

export type GroupBoxProps = HTMLAttributes<HTMLFieldSetElement> & {
  legend?: ReactNode;
  children: ReactNode;
};

export function GroupBox({ legend, className, children, ...rest }: GroupBoxProps) {
  return (
    <fieldset className={cn(className)} {...rest}>
      {legend != null ? <legend>{legend}</legend> : null}
      {children}
    </fieldset>
  );
}
