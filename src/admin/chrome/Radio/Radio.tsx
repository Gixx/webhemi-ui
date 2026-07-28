import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

/**
 * Radio with 98-compatible adjacency: `input` immediately before `label`.
 * Wrap in {@link FieldRow} for layout.
 */
export function Radio({ id, label, className, ...rest }: RadioProps) {
  if (!id) {
    throw new Error('Radio requires an id so the label can use htmlFor');
  }

  return (
    <>
      <input id={id} type="radio" className={cn(className)} {...rest} />
      <label htmlFor={id}>{label}</label>
    </>
  );
}
