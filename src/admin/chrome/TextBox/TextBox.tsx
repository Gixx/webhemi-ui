import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox, type FieldLabelPosition } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type { FieldLabelPosition };

export type TextBoxProps = InputHTMLAttributes<HTMLInputElement> & {
  /** When set, wraps control + caption in `.field-box` (requires `id`). */
  label?: ReactNode;
  /** Caption placement when `label` is set. Default `before`. */
  labelPosition?: FieldLabelPosition;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

/** Single-line text / password / email / … — chrome styles the element itself. */
export function TextBox({
  className,
  type = 'text',
  label,
  labelPosition = 'before',
  boxClassName,
  accessKey,
  id,
  ...rest
}: TextBoxProps) {
  const control = (
    <input
      id={id}
      type={type}
      className={cn(className)}
      accessKey={accessKey || undefined}
      {...rest}
    />
  );

  if (label == null) {
    return control;
  }

  if (!id) {
    throw new Error('TextBox requires an id when label is set');
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

TextBox.displayName = 'TextBox';
