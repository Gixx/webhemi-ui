import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../../../lib/cn';
import {
  clampDesktopPosition,
  DRAG_THRESHOLD_PX,
  getDesktopWorkSize,
} from '../../shell/geometry';

export type FloatingModalProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Element used for centering and drag clamp (defaults to `parentElement`).
   * Pass `.dashboard` when the modal is portaled onto the desktop.
   */
  boundsEl?: HTMLElement | null;
  /** Optional ref to the floating root (callback or object). */
  rootRef?: Ref<HTMLDivElement | null>;
  /** Owning shell window id (`data-shell-window`) for z-order / flash targeting. */
  'data-owner-window'?: string;
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  active: boolean;
};

function findOuterTitleBar(host: HTMLElement): HTMLElement | null {
  const win = host.querySelector(':scope > .window');
  if (!(win instanceof HTMLElement)) {
    return null;
  }
  const titleBar = win.querySelector(':scope > .title-bar');
  return titleBar instanceof HTMLElement ? titleBar : null;
}

function workSize(bounds: HTMLElement): { width: number; height: number } {
  if (bounds.classList.contains('dashboard') && bounds.querySelector('#toolbar')) {
    return getDesktopWorkSize(bounds);
  }
  return { width: bounds.clientWidth, height: bounds.clientHeight };
}

function clampModalPosition(
  bounds: HTMLElement,
  width: number,
  height: number,
  left: number,
  top: number,
): { left: number; top: number } {
  if (bounds.classList.contains('dashboard') && bounds.querySelector('#toolbar')) {
    return clampDesktopPosition(bounds, width, height, left, top);
  }
  const maxLeft = Math.max(0, bounds.clientWidth - width);
  const maxTop = Math.max(0, bounds.clientHeight - height);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

function assignRef(ref: Ref<HTMLDivElement | null> | undefined, node: HTMLDivElement | null) {
  if (!ref) {
    return;
  }
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  ref.current = node;
}

/**
 * Positions a nested product `.window` and enables title-bar drag.
 * Not a shell window (`data-shell-window` stays off).
 */
export function FloatingModal({
  children,
  className,
  style,
  boundsEl,
  rootRef,
  'data-owner-window': dataOwnerWindow,
}: FloatingModalProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const setRoot = (node: HTMLDivElement | null) => {
    nodeRef.current = node;
    assignRef(rootRef, node);
  };

  useLayoutEffect(() => {
    const root = nodeRef.current;
    const bounds = boundsEl ?? root?.parentElement;
    if (!root || !bounds) {
      return;
    }
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const work = workSize(bounds);
    const left = Math.max(0, Math.floor((work.width - width) / 2));
    const top = Math.max(0, Math.floor((work.height - height) / 2));
    setPos(clampModalPosition(bounds, width, height, left, top));
  }, [boundsEl]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const session = dragRef.current;
      const root = nodeRef.current;
      const bounds = boundsEl ?? root?.parentElement;
      if (!session || session.pointerId !== event.pointerId || !root || !bounds) {
        return;
      }
      const dx = event.clientX - session.startX;
      const dy = event.clientY - session.startY;
      if (!session.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
          return;
        }
        session.active = true;
      }
      setPos(
        clampModalPosition(
          bounds,
          root.offsetWidth,
          root.offsetHeight,
          session.originLeft + dx,
          session.originTop + dy,
        ),
      );
    };

    const onUp = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }
      dragRef.current = null;
      const root = nodeRef.current;
      if (root && typeof root.releasePointerCapture === 'function') {
        try {
          root.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [boundsEl]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !nodeRef.current || pos == null) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (target.closest('.title-bar-controls')) {
      return;
    }
    const titleBar = findOuterTitleBar(nodeRef.current);
    if (!titleBar || !titleBar.contains(target)) {
      return;
    }

    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: pos.left,
      originTop: pos.top,
      active: false,
    };
    try {
      nodeRef.current.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers may reject capture.
    }
  };

  const mergedStyle: CSSProperties = {
    ...style,
    ...(pos
      ? { left: pos.left, top: pos.top, visibility: 'visible' }
      : { visibility: 'hidden' }),
  };

  return (
    <div
      ref={setRoot}
      className={cn('floating-modal', className)}
      style={mergedStyle}
      data-owner-window={dataOwnerWindow}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  );
}
