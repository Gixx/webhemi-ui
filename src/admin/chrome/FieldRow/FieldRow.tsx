import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export type FieldRowProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Horizontal group of recommended children: Button, TextBox, TextArea,
   * Checkbox, Radio, Select, Slider. Sibling FieldRows stack vertically.
   * Not for GroupBox (GroupBox parents FieldRows).
   */
  children: ReactNode;
};

/** Chrome `.field-row` — lays children in a horizontal row. */
export function FieldRow({ className, children, ...rest }: FieldRowProps) {
  return (
    <div className={cn('field-row', className)} {...rest}>
      {children}
    </div>
  );
}
