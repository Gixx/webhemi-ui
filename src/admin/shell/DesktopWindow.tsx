import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import {
  clampDesktopPosition,
  DRAG_THRESHOLD_PX,
  findShellTitleBar,
} from './geometry';

export type DesktopWindowProps = Omit<HTMLAttributes<HTMLDivElement>, 'onMove'> & {
  /** Stable shell id (`control-panel`, `site-{n}`). */
  windowId: string;
  left: number;
  top: number;
  zIndex: number;
  /** Update registry position while dragging. */
  onPositionChange?: (left: number, top: number) => void;
  /** Raise / focus this window. */
  onActivate?: () => void;
  /** When true, title-bar drag is disabled (e.g. maximized — Slice E). */
  dragDisabled?: boolean;
  children: ReactNode;
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
};

/**
 * Absolutely positioned shell-window host on the desktop.
 * Title-bar pointer drag (threshold + clamp); nested dialogs are ignored.
 */
export function DesktopWindow({
  windowId,
  left,
  top,
  zIndex,
  onPositionChange,
  onActivate,
  dragDisabled = false,
  className,
  children,
  style,
  onPointerDown,
  ...rest
}: DesktopWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const dragDisabledRef = useRef(dragDisabled);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    dragDisabledRef.current = dragDisabled;
  }, [dragDisabled]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const session = dragRef.current;
      const node = rootRef.current;
      if (!session || !node || event.pointerId !== session.pointerId) {
        return;
      }
      if (dragDisabledRef.current) {
        return;
      }

      if (!session.active) {
        const dx = event.clientX - session.startX;
        const dy = event.clientY - session.startY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return;
        }
        session.active = true;
        node.classList.add('is-dragging');
        if (typeof node.setPointerCapture === 'function') {
          node.setPointerCapture(session.pointerId);
        }
        event.preventDefault();
      }

      const dashboard = node.closest('.dashboard');
      const change = onPositionChangeRef.current;
      if (!(dashboard instanceof HTMLElement) || !change) {
        return;
      }

      const origin = dashboard.getBoundingClientRect();
      const next = clampDesktopPosition(
        dashboard,
        node.offsetWidth,
        node.offsetHeight,
        event.clientX - origin.left - session.offsetX,
        event.clientY - origin.top - session.offsetY,
      );
      change(next.left, next.top);
    };

    const onUp = (event: PointerEvent) => {
      const session = dragRef.current;
      const node = rootRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }
      if (
        node &&
        typeof node.releasePointerCapture === 'function' &&
        node.hasPointerCapture?.(session.pointerId)
      ) {
        node.releasePointerCapture(session.pointerId);
      }
      node?.classList.remove('is-dragging');
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    onActivate?.();

    if (dragDisabled || !onPositionChange || event.button !== 0) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element) || !rootRef.current) {
      return;
    }
    if (target.closest('.title-bar-controls')) {
      return;
    }

    const titleBar = findShellTitleBar(rootRef.current);
    if (!titleBar || !titleBar.contains(target)) {
      return;
    }

    // Block HTML5 DnD on title-bar (legacy `draggable` on product windows).
    const preventNativeDrag = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
    };
    titleBar.addEventListener('dragstart', preventNativeDrag, { once: true });

    const rect = rootRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      active: false,
    };
  };

  const mergedStyle: CSSProperties = {
    ...style,
    left,
    top,
    zIndex,
  };

  return (
    <div
      ref={rootRef}
      id={windowId}
      data-shell-window={windowId}
      className={cn('desktop-window', className)}
      style={mergedStyle}
      onPointerDown={handlePointerDown}
      {...rest}
    >
      {children}
    </div>
  );
}
