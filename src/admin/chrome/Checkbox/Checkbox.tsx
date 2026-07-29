import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

/**
 * Checkbox with 98-compatible adjacency: `input` immediately before `label`, wrapped in `.field-box`.
 * Wrap in {@link FieldRow} for form-row layout.
 */
export function Checkbox({
  id,
  label,
  className,
  boxClassName,
  accessKey,
  ...rest
}: CheckboxProps) {
  if (!id) {
    throw new Error('Checkbox requires an id so the label can use htmlFor');
  }

  const caption =
    accessKey && (typeof label === 'string' || typeof label === 'number')
      ? underlineAccessKey(String(label), accessKey)
      : label;

  const control = (
    <input
      id={id}
      type="checkbox"
      className={cn(className)}
      accessKey={accessKey || undefined}
      {...rest}
    />
  );

  return renderFieldBox({
    id,
    label: caption,
    control,
    controlFirst: true,
    boxClassName,
  });
}

Checkbox.displayName = 'Checkbox';
