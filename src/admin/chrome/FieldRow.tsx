import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { applyAccessKeyToControl, applyAccessKeyToLabel } from './underlineAccessKey';

export type FieldRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'accessKey'> & {
  /**
   * Keyboard access key for this row’s form control (not the wrapper `div`).
   * Underlines the first case-insensitive match in plain `<label>` text and sets
   * `accessKey` on the first `input` / `select` / `textarea` (or TextBox / Select / TextArea).
   * Button-only rows: ignore — each Button owns its own key.
   */
  accessKey?: string;
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

export function FieldRow({
  stacked = false,
  className,
  children,
  accessKey,
  ...rest
}: FieldRowProps) {
  let content = children;
  if (accessKey) {
    content = applyAccessKeyToLabel(content, accessKey);
    content = applyAccessKeyToControl(content, accessKey);
  }

  return (
    <div className={cn(stacked ? 'field-row-stacked' : 'field-row', className)} {...rest}>
      {content}
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
