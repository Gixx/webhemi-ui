import { useId, useRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { Button } from '../Button';
import { FieldRow } from '../FieldRow';
import { underlineAccessKey } from '../_lib/underlineAccessKey';

export type FileInputProps = {
  /** Displayed path / “No file selected.” */
  value?: string;
  /** Empty-state caption when no file chosen. */
  emptyLabel?: string;
  accept?: string;
  disabled?: boolean;
  browseLabel?: string;
  browseAccessKey?: string;
  /** Optional caption before the path+browse row. */
  label?: ReactNode;
  labelAccessKey?: string;
  className?: string;
  pathClassName?: string;
  onFileChange?: (file: File | null) => void;
  /** Forwarded to the hidden file input (except type/onChange). */
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'accept' | 'disabled'>;
};

/**
 * Retro file picker: readonly path field + Browse… (hidden `<input type="file">`).
 */
export function FileInput({
  value,
  emptyLabel = 'No file selected.',
  accept = 'image/*',
  disabled = false,
  browseLabel = 'Browse…',
  browseAccessKey = 'b',
  label,
  labelAccessKey,
  className,
  pathClassName,
  onFileChange,
  inputProps,
}: FileInputProps) {
  const autoId = useId();
  const inputId = inputProps?.id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value?.trim() ? value : emptyLabel;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange?.(file);
    // Allow re-selecting the same file later.
    event.target.value = '';
  };

  const caption =
    label != null &&
    labelAccessKey &&
    (typeof label === 'string' || typeof label === 'number')
      ? underlineAccessKey(String(label), labelAccessKey)
      : label;

  return (
    <div className={cn('file-input', className)}>
      {caption != null ? (
        <label htmlFor={inputId} className="file-input-label">
          {caption}
        </label>
      ) : null}
      <FieldRow className="file-input-row">
        <input
          type="text"
          readOnly
          tabIndex={-1}
          disabled={disabled}
          value={display}
          aria-label={typeof label === 'string' ? label : 'Selected file'}
          className={cn('file-input-path', pathClassName)}
        />
        <Button
          type="button"
          disabled={disabled}
          accessKey={browseAccessKey}
          onClick={() => inputRef.current?.click()}
        >
          {browseLabel}
        </Button>
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          className="file-input-native"
          onChange={handleChange}
        />
      </FieldRow>
    </div>
  );
}
