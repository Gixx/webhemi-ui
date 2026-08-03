import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { cn } from '../../../lib/cn';

export type ExplorerSplitterProps = {
  value: number;
  onChange: (width: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  /** Step for ArrowLeft / ArrowRight when focused. */
  keyboardStep?: number;
};

/**
 * Vertical grip between the tree and content panes (col-resize + keyboard nudge).
 * Pointer move/up are handled on the element (with capture) so resize works
 * without waiting for a document-level useEffect — important for Chromatic.
 */
export function ExplorerSplitter({
  value,
  onChange,
  min = 120,
  max = 480,
  disabled = false,
  className,
  keyboardStep = 8,
}: ExplorerSplitterProps) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(
    null,
  );

  const clamp = useCallback(
    (width: number) => Math.min(max, Math.max(min, Math.round(width))),
    [min, max],
  );

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Synthetic pointer sequences may reject release.
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) {
      return;
    }
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: value,
    };
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer sequences (Chromatic) may reject capture.
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    onChange(clamp(drag.startWidth + (event.clientX - drag.startX)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(clamp(value - keyboardStep));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(clamp(value + keyboardStep));
    } else if (event.key === 'Home') {
      event.preventDefault();
      onChange(min);
    } else if (event.key === 'End') {
      event.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      className={cn('explorer-splitter', dragging && 'is-dragging', className)}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize tree pane"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    />
  );
}
