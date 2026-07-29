import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { renderFieldBox, type FieldLabelPosition } from '../_lib/fieldBox';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type { FieldLabelPosition };

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Chrome `.has-box-indicator` */
  boxIndicator?: boolean;
  /** When set, wraps control + caption in `.field-box` (requires `id`). */
  label?: ReactNode;
  /** Caption placement when `label` is set. Default `before`. */
  labelPosition?: FieldLabelPosition;
  /** Extra class(es) on the `.field-box` wrapper. */
  boxClassName?: string;
};

export function Slider({
  boxIndicator,
  className,
  label,
  labelPosition = 'before',
  boxClassName,
  accessKey,
  id,
  ...rest
}: SliderProps) {
  const control = (
    <input
      id={id}
      type="range"
      className={cn(boxIndicator && 'has-box-indicator', className)}
      accessKey={accessKey || undefined}
      {...rest}
    />
  );

  if (label == null) {
    return control;
  }

  if (!id) {
    throw new Error('Slider requires an id when label is set');
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

Slider.displayName = 'Slider';
