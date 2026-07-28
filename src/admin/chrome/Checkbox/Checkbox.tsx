import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

/**
 * Checkbox with 98-compatible adjacency: `input` immediately before `label`.
 * Wrap in {@link FieldRow} for layout. Do not wrap input+label in an extra element.
 */
export function Checkbox({ id, label, className, ...rest }: CheckboxProps) {
  if (!id) {
    throw new Error('Checkbox requires an id so the label can use htmlFor');
  }

  return (
    <>
      <input id={id} type="checkbox" className={cn(className)} {...rest} />
      <label htmlFor={id}>{label}</label>
    </>
  );
}
