import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export type GroupBoxProps = HTMLAttributes<HTMLFieldSetElement> & {
  legend?: ReactNode;
  /** Convention: one or more {@link FieldRow} children only. */
  children: ReactNode;
};

/** Chrome `fieldset` / `legend` group box. Contains FieldRows, not bare controls. */
export function GroupBox({ legend, className, children, ...rest }: GroupBoxProps) {
  return (
    <fieldset className={cn(className)} {...rest}>
      {legend != null ? <legend>{legend}</legend> : null}
      {children}
    </fieldset>
  );
}
