import {
  useCallback,
  useEffect,
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

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      onChange(clamp(drag.startWidth + (event.clientX - drag.startX)));
    };

    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      dragRef.current = null;
      setDragging(false);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, clamp, onChange]);

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
    event.currentTarget.setPointerCapture(event.pointerId);
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
      onKeyDown={onKeyDown}
    />
  );
}
