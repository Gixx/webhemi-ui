import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import {
  clampDesktopPosition,
  DRAG_THRESHOLD_PX,
  findShellTitleBar,
} from './geometry';
import {
  computeResizeBounds,
  RESIZE_CURSORS,
  RESIZE_EDGES,
  type ResizeEdge,
  type ShellBounds,
} from './resize';

export type DesktopWindowProps = Omit<HTMLAttributes<HTMLDivElement>, 'onMove'> & {
  /** Stable shell id (`control-panel`, `site-{n}`). */
  windowId: string;
  left: number;
  top: number;
  zIndex: number;
  width?: number;
  height?: number;
  maximized?: boolean;
  /** Update registry position while dragging. */
  onPositionChange?: (left: number, top: number) => void;
  /** Update registry bounds while resizing. */
  onBoundsChange?: (bounds: ShellBounds) => void;
  /** Raise / focus this window. */
  onActivate?: () => void;
  /** Title-bar Maximize / Restore / dblclick (ignored when `resizable` is false). */
  onToggleMaximize?: () => void;
  /** When true, title-bar drag is disabled. */
  dragDisabled?: boolean;
  /**
   * Mount edge handles (default true).
   * When false, Maximize / Restore must not be offered (dblclick is no-op).
   */
  resizable?: boolean;
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

type ResizeSession = {
  pointerId: number;
  edge: ResizeEdge;
  startX: number;
  startY: number;
  start: ShellBounds;
};

/**
 * Absolutely positioned shell-window host on the desktop.
 * Title-bar drag + edge resize; nested dialogs are ignored.
 */
export function DesktopWindow({
  windowId,
  left,
  top,
  zIndex,
  width,
  height,
  maximized = false,
  onPositionChange,
  onBoundsChange,
  onActivate,
  onToggleMaximize,
  dragDisabled = false,
  resizable = true,
  className,
  children,
  style,
  onPointerDown,
  ...rest
}: DesktopWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const resizeRef = useRef<ResizeSession | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const dragDisabledRef = useRef(dragDisabled);
  const maximizedRef = useRef(maximized);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    dragDisabledRef.current = dragDisabled;
  }, [dragDisabled]);

  useEffect(() => {
    maximizedRef.current = maximized;
  }, [maximized]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const node = rootRef.current;
      if (!node) {
        return;
      }

      const resize = resizeRef.current;
      if (resize && event.pointerId === resize.pointerId) {
        const dashboard = node.closest('.dashboard');
        const change = onBoundsChangeRef.current;
        if (!(dashboard instanceof HTMLElement) || !change) {
          return;
        }
        const next = computeResizeBounds(dashboard, resize.edge, resize.start, {
          clientX: event.clientX,
          clientY: event.clientY,
          startX: resize.startX,
          startY: resize.startY,
        });
        change(next);
        event.preventDefault();
        return;
      }

      const session = dragRef.current;
      if (!session || event.pointerId !== session.pointerId) {
        return;
      }
      if (dragDisabledRef.current || maximizedRef.current) {
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
        try {
          if (typeof node.setPointerCapture === 'function') {
            node.setPointerCapture(session.pointerId);
          }
        } catch {
          // Synthetic pointer sequences (Chromatic) may reject capture.
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
      const node = rootRef.current;
      const resize = resizeRef.current;
      if (resize && event.pointerId === resize.pointerId) {
        if (
          node &&
          typeof node.releasePointerCapture === 'function' &&
          node.hasPointerCapture?.(resize.pointerId)
        ) {
          node.releasePointerCapture(resize.pointerId);
        }
        node?.classList.remove('is-resizing');
        document.documentElement.classList.remove('is-window-resizing');
        document.documentElement.style.removeProperty('cursor');
        resizeRef.current = null;
        return;
      }

      const session = dragRef.current;
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

  const startResize = (edge: ResizeEdge, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onBoundsChange || maximized || event.button !== 0 || !rootRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onActivate?.();

    const node = rootRef.current;
    resizeRef.current = {
      pointerId: event.pointerId,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      start: {
        left,
        top,
        width: width ?? node.offsetWidth,
        height: height ?? node.offsetHeight,
      },
    };
    node.classList.add('is-resizing');
    document.documentElement.classList.add('is-window-resizing');
    document.documentElement.style.setProperty(
      'cursor',
      RESIZE_CURSORS[edge],
      'important',
    );
    try {
      if (typeof node.setPointerCapture === 'function') {
        node.setPointerCapture(event.pointerId);
      }
    } catch {
      // Synthetic pointer sequences (Chromatic) may reject capture.
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    onActivate?.();

    if (dragDisabled || maximized || !onPositionChange || event.button !== 0) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element) || !rootRef.current) {
      return;
    }
    if (target.closest('.title-bar-controls') || target.closest('.window-resize-handle')) {
      return;
    }

    const titleBar = findShellTitleBar(rootRef.current);
    if (!titleBar || !titleBar.contains(target)) {
      return;
    }

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

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!resizable || !onToggleMaximize || !rootRef.current) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest('.title-bar-controls')) {
      return;
    }
    const titleBar = findShellTitleBar(rootRef.current);
    if (!titleBar || !titleBar.contains(target)) {
      return;
    }
    event.preventDefault();
    onToggleMaximize();
  };

  const sized = width !== undefined && height !== undefined;
  const mergedStyle: CSSProperties = {
    ...style,
    left,
    top,
    zIndex,
    ...(sized ? { width, height } : null),
  };

  const showHandles = resizable && !maximized && !dragDisabled;

  return (
    <div
      ref={rootRef}
      id={windowId}
      data-shell-window={windowId}
      className={cn(
        'desktop-window',
        sized && 'is-sized',
        maximized && 'is-maximized',
        className,
      )}
      style={mergedStyle}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      {...rest}
    >
      {children}
      {showHandles
        ? RESIZE_EDGES.map((edge) => (
            <div
              key={edge}
              className="window-resize-handle"
              data-edge={edge}
              aria-hidden
              onPointerDown={(event) => startResize(edge, event)}
            />
          ))
        : null}
    </div>
  );
}
