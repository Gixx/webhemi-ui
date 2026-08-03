import { playAdminSound } from '../lib/playAdminSound';

/** Classic Win98-ish caption flash count (active ↔ inactive pairs). */
export const OWNED_MODAL_FLASH_COUNT = 3;
export const OWNED_MODAL_FLASH_INTERVAL_MS = 120;

const flashTimers = new WeakMap<HTMLElement, number>();

function findOuterTitleBar(modalHost: HTMLElement): HTMLElement | null {
  const direct = modalHost.querySelector(':scope > .window > .title-bar');
  if (direct instanceof HTMLElement) {
    return direct;
  }
  const nested = modalHost.querySelector('.title-bar');
  return nested instanceof HTMLElement ? nested : null;
}

function escapeAttr(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Topmost owned floating modal on the desktop (optional filter by shell window id).
 */
export function findTopOwnedFloatingModal(
  dashboard: HTMLElement | null | undefined,
  ownerWindowId?: string | null,
): HTMLElement | null {
  if (!dashboard) {
    return null;
  }
  const selector = ownerWindowId
    ? `.floating-modal.desktop-owned-modal[data-owner-window="${escapeAttr(ownerWindowId)}"]`
    : '.floating-modal.desktop-owned-modal';
  const nodes = dashboard.querySelectorAll(selector);
  const last = nodes[nodes.length - 1];
  return last instanceof HTMLElement ? last : null;
}

/** @deprecated Prefer {@link findTopOwnedFloatingModal}. */
export function findTopFloatingModal(
  dashboard: HTMLElement | null | undefined,
): HTMLElement | null {
  return findTopOwnedFloatingModal(dashboard);
}

export type FlashOwnedModalOptions = {
  /** Digested `asset('admin/sounds/ding.mp3')`; Storybook uses package static path. */
  dingSoundUrl?: string | null;
  /** When false, only flash the caption (no Default Beep). Default true. */
  playSound?: boolean;
  flashCount?: number;
  intervalMs?: number;
};

/**
 * Win32-style attention when the user clicks a blocked owner:
 * title-bar active/inactive flicker + Default Beep (`ding`).
 * Chord remains reserved for error-dialog open.
 */
export function flashOwnedModalAttention(
  modalHost: HTMLElement | null | undefined,
  options: FlashOwnedModalOptions = {},
): void {
  if (!modalHost) {
    return;
  }
  const titleBar = findOuterTitleBar(modalHost);
  if (!titleBar) {
    return;
  }

  const prev = flashTimers.get(titleBar);
  if (prev != null) {
    window.clearTimeout(prev);
    flashTimers.delete(titleBar);
  }

  if (options.playSound !== false) {
    playAdminSound('ding', options.dingSoundUrl);
  }

  const flashCount = options.flashCount ?? OWNED_MODAL_FLASH_COUNT;
  const intervalMs = options.intervalMs ?? OWNED_MODAL_FLASH_INTERVAL_MS;
  const totalSteps = Math.max(1, flashCount) * 2;
  let step = 0;

  const finish = () => {
    titleBar.classList.remove('inactive');
    flashTimers.delete(titleBar);
  };

  const tick = () => {
    const inactive = step % 2 === 0;
    titleBar.classList.toggle('inactive', inactive);
    step += 1;
    if (step >= totalSteps) {
      finish();
      return;
    }
    const id = window.setTimeout(tick, intervalMs);
    flashTimers.set(titleBar, id);
  };

  tick();
}
