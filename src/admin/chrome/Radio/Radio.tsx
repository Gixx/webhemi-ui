import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

/**
 * Radio with 98-compatible adjacency: `input` immediately before `label`, wrapped in `.field-box`.
 * Wrap in {@link FieldRow} for form-row layout.
 */
export function Radio({
  id,
  label,
  className,
  boxClassName,
  accessKey,
  ...rest
}: RadioProps) {
  if (!id) {
    throw new Error('Radio requires an id so the label can use htmlFor');
  }

  const caption =
    accessKey && (typeof label === 'string' || typeof label === 'number')
      ? underlineAccessKey(String(label), accessKey)
      : label;

  const control = (
    <input
      id={id}
      type="radio"
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

Radio.displayName = 'Radio';
