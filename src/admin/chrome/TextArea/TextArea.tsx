import type { ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox, type FieldLabelPosition } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type { FieldLabelPosition };

/** CSS `resize` axis — Win98 fields are not user-resizable by default. */
export type TextAreaResizable = 'none' | 'vertical' | 'horizontal' | 'both';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** User resize handle. Default `none`. */
  resizable?: TextAreaResizable;
  /** When set, wraps control + caption in `.field-box` (requires `id`). */
  label?: ReactNode;
  /** Caption placement when `label` is set. Default `before`. */
  labelPosition?: FieldLabelPosition;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

/** Multiline text — chrome styles the element itself. */
export function TextArea({
  className,
  resizable = 'none',
  style,
  label,
  labelPosition = 'before',
  boxClassName,
  accessKey,
  id,
  ...rest
}: TextAreaProps) {
  const control = (
    <textarea
      id={id}
      className={cn(className)}
      style={{ ...style, resize: resizable }}
      accessKey={accessKey || undefined}
      {...rest}
    />
  );

  if (label == null) {
    return control;
  }

  if (!id) {
    throw new Error('TextArea requires an id when label is set');
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

TextArea.displayName = 'TextArea';
