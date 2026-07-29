import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox, type FieldLabelPosition } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type { FieldLabelPosition };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  /** When set, wraps control + caption in `.field-box` (requires `id`). */
  label?: ReactNode;
  /** Caption placement when `label` is set. Default `before`. */
  labelPosition?: FieldLabelPosition;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

export function Select({
  className,
  children,
  label,
  labelPosition = 'before',
  boxClassName,
  accessKey,
  id,
  ...rest
}: SelectProps) {
  const control = (
    <select
      id={id}
      className={cn(className)}
      accessKey={accessKey || undefined}
      {...rest}
    >
      {children}
    </select>
  );

  if (label == null) {
    return control;
  }

  if (!id) {
    throw new Error('Select requires an id when label is set');
  }

  const caption =
    accessKey && (typeof label === 'string' || typeof label === 'number')
      ? underlineAccessKey(String(label), accessKey)
      : label;

  return renderFieldBox({
    id,
    label: caption,
    control,
    labelPosition,
    boxClassName,
  });
}

Select.displayName = 'Select';
