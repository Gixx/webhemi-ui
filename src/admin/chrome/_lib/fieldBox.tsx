import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

/** Caption placement for labeled TextBox / TextArea / Select / Slider. */
export type FieldLabelPosition = 'before' | 'above';

export type RenderFieldBoxOptions = {
  id: string;
  /** Caption content (caller applies accessKey underline when needed). */
  label: ReactNode;
  /** The form control element (`id` / `accessKey` already set). */
  control: ReactElement;
  /**
   * Checkbox / Radio: control then label (chrome `input + label`).
   * Default false → label then control.
   */
  controlFirst?: boolean;
  /** Label-first layouts only. Default `before`. Ignored when `controlFirst`. */
  labelPosition?: FieldLabelPosition;
  boxClassName?: string;
};

/**
 * Wrap a label + control pair in `.field-box` without breaking adjacency
 * (no element between `input` and `label` when `controlFirst`).
 */
export function renderFieldBox({
  id,
  label,
  control,
  controlFirst = false,
  labelPosition = 'before',
  boxClassName,
}: RenderFieldBoxOptions): ReactElement {
  const labelEl = <label htmlFor={id}>{label}</label>;
  const above = !controlFirst && labelPosition === 'above';

  return (
    <div
      className={cn(
        'field-box',
        controlFirst && 'field-box-control-first',
        above && 'field-box-above',
        boxClassName,
      )}
    >
      {controlFirst ? (
        <>
          {control}
          {labelEl}
        </>
      ) : (
        <>
          {labelEl}
          {control}
        </>
      )}
    </div>
  );
}
