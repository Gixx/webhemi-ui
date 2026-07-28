import { useEffect, type RefObject } from 'react';
import { attachCustomScrollbar } from './attachCustomScrollbar';

/**
 * Mount Retro OS custom scrollbar chrome on a host/viewport pair.
 * Safe to call when refs are not yet populated (no-op until both exist).
 */
export function useCustomScrollbar(
  hostRef: RefObject<HTMLElement | null>,
  viewportRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const host = hostRef.current;
    const viewport = viewportRef.current;
    if (!host || !viewport) {
      return;
    }
    return attachCustomScrollbar(host, viewport);
  }, [hostRef, viewportRef]);
}
