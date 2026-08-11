import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/cn';
import {
  findTopOwnedFloatingModal,
  flashOwnedModalAttention,
} from '../../lib/flashOwnedModalAttention';
import { FloatingModal } from '../FloatingModal';

export type DesktopModalLayer = 'default' | 'alert';

export type DesktopModalProps = {
  children: ReactNode;
  /** Higher layers sit above default modals (e.g. error over a form). */
  layer?: DesktopModalLayer;
  className?: string;
  /** Digested `ding.mp3` for blocked-owner attention (MessageBeep). */
  dingSoundUrl?: string | null;
};

type DesktopModalContextValue = {
  /** Floating root of the parent modal (block target for nested modals). */
  floatingRoot: HTMLElement | null;
};

const DesktopModalContext = createContext<DesktopModalContextValue | null>(null);

/**
 * Share the owner shell window's z-index (not ownerZ+1).
 * Shell activate uses nextZ = topZ+1; if the modal sat at ownerZ+1 it tied with
 * the newly raised window and won via later DOM order — appearing always-on-top.
 * Same z as the owner: later DOM keeps the dialog above its owner, while any
 * window with a strictly higher z stacks above the dialog. Nested alerts rely on
 * portal mount order (alert after form) at the same z.
 * Unowned modals (no shell ancestor) use topShellZ+1 instead.
 */

function findDashboard(from?: HTMLElement | null): HTMLElement | null {
  const closest = from?.closest('.dashboard');
  if (closest instanceof HTMLElement) {
    return closest;
  }
  const el = document.querySelector('.dashboard');
  return el instanceof HTMLElement ? el : null;
}

/** Shell host from AdminDesktop (`DesktopWindow`). */
function findOwnerShellWindow(from: HTMLElement | null): HTMLElement | null {
  if (!from) {
    return null;
  }
  const host = from.closest('[data-shell-window], .desktop-window');
  return host instanceof HTMLElement ? host : null;
}

function ownerWindowId(owner: HTMLElement | null): string | null {
  if (!owner) {
    return null;
  }
  return owner.getAttribute('data-shell-window') || owner.id || null;
}

function readElementZIndex(el: HTMLElement): number {
  const inline = el.style.zIndex;
  if (inline !== '') {
    const parsed = Number.parseInt(inline, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  const computed = Number.parseInt(getComputedStyle(el).zIndex, 10);
  return Number.isNaN(computed) ? 0 : computed;
}

/** Highest z among shell windows on the dashboard (for Start-menu / unowned modals). */
function topShellWindowZ(dashboard: HTMLElement): number {
  const nodes = dashboard.querySelectorAll('[data-shell-window], .desktop-window');
  let top = 0;
  nodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      top = Math.max(top, readElementZIndex(node));
    }
  });
  return top;
}

function findHostBlockTarget(anchor: HTMLElement | null): HTMLElement | null {
  if (!anchor) {
    return null;
  }
  const host = anchor.closest(
    '.sites-window, .hosts-window, .settings-window, .permissions-window, .roles-window, .users-window, .site-file-explorer, .login-host, [data-shell-window], .desktop-window',
  );
  return host instanceof HTMLElement ? host : null;
}

function escapeAttr(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function findTopDefaultOwnedModal(
  dashboard: HTMLElement,
  ownerId: string | null,
): HTMLElement | null {
  const selector = ownerId
    ? `.floating-modal.desktop-owned-modal[data-owner-window="${escapeAttr(ownerId)}"]:not(.is-alert)`
    : '.floating-modal.desktop-owned-modal:not(.is-alert)';
  const nodes = dashboard.querySelectorAll(selector);
  const last = nodes[nodes.length - 1];
  return last instanceof HTMLElement ? last : null;
}

/**
 * Owned modal: blocks the opener, portaled onto `.dashboard` for free drag.
 * z-index matches the owner shell window (not +1), so activating another window
 * (nextZ = top+1) can stack above the dialog; nested alerts use DOM order.
 * Unowned modals (e.g. Start → My Account) use topShellZ+1 so they open above
 * every shell window.
 */
export function DesktopModal({
  children,
  layer = 'default',
  className,
  dingSoundUrl,
}: DesktopModalProps) {
  const parentModal = useContext(DesktopModalContext);
  const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);
  const [dashboard, setDashboard] = useState<HTMLElement | null>(null);
  const [blockTarget, setBlockTarget] = useState<HTMLElement | null>(null);
  const [floatingRoot, setFloatingRoot] = useState<HTMLElement | null>(null);
  const [modalZIndex, setModalZIndex] = useState<number | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const desk = findDashboard(anchor);
    const owner = findOwnerShellWindow(anchor);
    const id = ownerWindowId(owner);
    setDashboard(desk);
    setOwnerId(id);

    if (parentModal?.floatingRoot) {
      setBlockTarget(parentModal.floatingRoot);
      return;
    }
    if (layer === 'alert' && desk) {
      const previous = findTopDefaultOwnedModal(desk, id);
      if (previous) {
        setBlockTarget(previous);
        return;
      }
    }
    setBlockTarget(findHostBlockTarget(anchor));
  }, [parentModal, layer, anchor, floatingRoot]);

  useLayoutEffect(() => {
    const owner = findOwnerShellWindow(anchor);
    const desk = findDashboard(anchor);

    if (owner) {
      const sync = () => {
        setModalZIndex(readElementZIndex(owner));
      };
      sync();

      const observer = new MutationObserver(sync);
      observer.observe(owner, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
      return () => observer.disconnect();
    }

    // No owner shell (Start menu / desktop-level dialog): stay above all windows.
    if (!desk) {
      setModalZIndex(null);
      return;
    }

    const syncUnowned = () => {
      setModalZIndex(topShellWindowZ(desk) + 1);
    };
    syncUnowned();

    const observer = new MutationObserver(syncUnowned);
    const watchShell = (node: Element) => {
      if (
        node instanceof HTMLElement &&
        (node.hasAttribute('data-shell-window') ||
          node.classList.contains('desktop-window'))
      ) {
        observer.observe(node, {
          attributes: true,
          attributeFilter: ['style', 'class'],
        });
      }
    };
    desk.querySelectorAll('[data-shell-window], .desktop-window').forEach(watchShell);
    const childObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            watchShell(node);
          }
        });
      }
      syncUnowned();
    });
    childObserver.observe(desk, { childList: true });
    return () => {
      observer.disconnect();
      childObserver.disconnect();
    };
  }, [anchor, layer]);

  const contextValue = useMemo<DesktopModalContextValue>(
    () => ({ floatingRoot }),
    [floatingRoot],
  );

  const onBlockedPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const desk = dashboard ?? findDashboard(anchor);
      const top =
        findTopOwnedFloatingModal(desk, ownerId) ?? floatingRoot;
      flashOwnedModalAttention(top, { dingSoundUrl });
    },
    [anchor, dashboard, dingSoundUrl, floatingRoot, ownerId],
  );

  const modalClassName = cn(
    'desktop-owned-modal',
    layer === 'alert' && 'is-alert',
    className,
  );

  const modal = (
    <DesktopModalContext.Provider value={contextValue}>
      <FloatingModal
        boundsEl={dashboard}
        rootRef={setFloatingRoot}
        className={modalClassName}
        style={modalZIndex != null ? { zIndex: modalZIndex } : undefined}
        data-owner-window={ownerId ?? undefined}
      >
        {children}
      </FloatingModal>
    </DesktopModalContext.Provider>
  );

  const blocker = (
    <div
      className="modal-blocker"
      aria-hidden
      onPointerDown={onBlockedPointerDown}
    />
  );

  if (dashboard == null) {
    return (
      <>
        <span ref={setAnchor} className="desktop-modal-anchor" hidden />
        <div
          className={cn(
            'desktop-modal-layer',
            'is-local',
            layer === 'alert' && 'is-alert',
          )}
        >
          {blocker}
          {modal}
        </div>
      </>
    );
  }

  return (
    <>
      <span ref={setAnchor} className="desktop-modal-anchor" hidden />
      {blockTarget != null ? createPortal(blocker, blockTarget) : null}
      {createPortal(modal, dashboard)}
    </>
  );
}
