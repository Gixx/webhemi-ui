/**
 * Win98-style scrollbar chrome for a host that already has a `.scrollable-viewport`
 * (React owns the viewport + children; this only mounts `.sb-*` rails).
 *
 * Port of admin98 `assets/script/scrollbar.js`, adapted for React-owned DOM.
 */

const THUMB_MIN = 17;
const ARROW_STEP = 24;
const REPEAT_DELAY_MS = 400;
const REPEAT_EVERY_MS = 50;

type Axis = 'x' | 'y';

type AxisChrome = {
  root: HTMLDivElement;
  dec: HTMLButtonElement;
  track: HTMLDivElement;
  thumb: HTMLDivElement;
  inc: HTMLButtonElement;
};

type DragState = {
  axis: Axis;
  startPos: number;
  startScroll: number;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  return node;
}

function buildAxis(axis: Axis): AxisChrome {
  const root = el('div', `sb sb-${axis}`);
  root.setAttribute('aria-hidden', 'true');

  const dec = el('button', 'sb-btn sb-dec');
  dec.type = 'button';
  dec.tabIndex = -1;

  const track = el('div', 'sb-track');
  const thumb = el('div', 'sb-thumb');
  track.appendChild(thumb);

  const inc = el('button', 'sb-btn sb-inc');
  inc.type = 'button';
  inc.tabIndex = -1;

  root.append(dec, track, inc);
  return { root, dec, track, thumb, inc };
}

export type DetachCustomScrollbar = () => void;

/**
 * Attach Win98 scrollbar chrome to `host`. Expects `viewport` to already be a
 * child of `host` with class `scrollable-viewport`.
 */
export function attachCustomScrollbar(
  host: HTMLElement,
  viewport: HTMLElement,
): DetachCustomScrollbar {
  if (host.classList.contains('has-custom-scrollbar')) {
    return () => undefined;
  }

  host.classList.add('has-custom-scrollbar');

  const y = buildAxis('y');
  const x = buildAxis('x');
  const corner = el('div', 'sb sb-corner');
  corner.setAttribute('aria-hidden', 'true');
  y.root.hidden = true;
  x.root.hidden = true;
  corner.hidden = true;
  host.append(y.root, x.root, corner);

  let drag: DragState | null = null;
  let repeatTimer = 0;
  let repeatDelay = 0;
  let raf = 0;

  const needsY = () => viewport.scrollHeight > viewport.clientHeight + 1;
  const needsX = () => viewport.scrollWidth > viewport.clientWidth + 1;

  const update = () => {
    const canScrollY = needsY();
    const canScrollX = needsX();

    host.classList.toggle('sb-show-y', canScrollY);
    host.classList.toggle('sb-show-x', canScrollX);

    y.root.hidden = !canScrollY;
    x.root.hidden = !canScrollX;
    corner.hidden = !(canScrollY && canScrollX);

    if (canScrollY) {
      const view = viewport.clientHeight;
      const size = viewport.scrollHeight;
      const trackSize = y.track.clientHeight;
      const thumbSize = Math.max(THUMB_MIN, Math.round((view / Math.max(size, 1)) * trackSize));
      const maxScroll = Math.max(0, size - view);
      const maxThumb = Math.max(0, trackSize - thumbSize);
      const top = maxScroll === 0 ? 0 : (viewport.scrollTop / maxScroll) * maxThumb;

      y.thumb.hidden = false;
      y.thumb.style.height = `${thumbSize}px`;
      y.thumb.style.transform = `translateY(${top}px)`;
      y.dec.disabled = viewport.scrollTop <= 0;
      y.inc.disabled = viewport.scrollTop >= maxScroll - 1;
    }

    if (canScrollX) {
      const view = viewport.clientWidth;
      const size = viewport.scrollWidth;
      const trackSize = x.track.clientWidth;
      const thumbSize = Math.max(THUMB_MIN, Math.round((view / Math.max(size, 1)) * trackSize));
      const maxScroll = Math.max(0, size - view);
      const maxThumb = Math.max(0, trackSize - thumbSize);
      const left = maxScroll === 0 ? 0 : (viewport.scrollLeft / maxScroll) * maxThumb;

      x.thumb.hidden = false;
      x.thumb.style.width = `${thumbSize}px`;
      x.thumb.style.transform = `translateX(${left}px)`;
      x.dec.disabled = viewport.scrollLeft <= 0;
      x.inc.disabled = viewport.scrollLeft >= maxScroll - 1;
    }
  };

  const scheduleUpdate = () => {
    if (raf) {
      return;
    }
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };

  const scrollByAxis = (axis: Axis, delta: number) => {
    if (axis === 'y') {
      viewport.scrollTop += delta;
    } else {
      viewport.scrollLeft += delta;
    }
    update();
  };

  const stopRepeat = () => {
    window.clearTimeout(repeatDelay);
    window.clearInterval(repeatTimer);
    repeatDelay = 0;
    repeatTimer = 0;
  };

  const startRepeat = (axis: Axis, delta: number) => {
    stopRepeat();
    scrollByAxis(axis, delta);
    repeatDelay = window.setTimeout(() => {
      repeatTimer = window.setInterval(() => scrollByAxis(axis, delta), REPEAT_EVERY_MS);
    }, REPEAT_DELAY_MS);
  };

  const onArrowDown = (
    button: HTMLButtonElement,
    axis: Axis,
    delta: number,
    event: PointerEvent,
  ) => {
    if (event.button !== 0 || button.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    startRepeat(axis, delta);
  };

  const onYDec = (e: PointerEvent) => onArrowDown(y.dec, 'y', -ARROW_STEP, e);
  const onYInc = (e: PointerEvent) => onArrowDown(y.inc, 'y', ARROW_STEP, e);
  const onXDec = (e: PointerEvent) => onArrowDown(x.dec, 'x', -ARROW_STEP, e);
  const onXInc = (e: PointerEvent) => onArrowDown(x.inc, 'x', ARROW_STEP, e);

  y.dec.addEventListener('pointerdown', onYDec);
  y.inc.addEventListener('pointerdown', onYInc);
  x.dec.addEventListener('pointerdown', onXDec);
  x.inc.addEventListener('pointerdown', onXInc);

  const onTrackPointerDown = (axis: Axis, thumb: HTMLDivElement, event: PointerEvent) => {
    if (event.button !== 0 || event.target === thumb || thumb.hidden) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const thumbRect = thumb.getBoundingClientRect();

    if (axis === 'y') {
      const page = viewport.clientHeight;
      if (event.clientY < thumbRect.top) {
        startRepeat('y', -page);
      } else if (event.clientY > thumbRect.bottom) {
        startRepeat('y', page);
      }
    } else {
      const page = viewport.clientWidth;
      if (event.clientX < thumbRect.left) {
        startRepeat('x', -page);
      } else if (event.clientX > thumbRect.right) {
        startRepeat('x', page);
      }
    }
  };

  const onYTrack = (e: PointerEvent) => onTrackPointerDown('y', y.thumb, e);
  const onXTrack = (e: PointerEvent) => onTrackPointerDown('x', x.thumb, e);
  y.track.addEventListener('pointerdown', onYTrack);
  x.track.addEventListener('pointerdown', onXTrack);

  const onThumbDown = (axis: Axis, event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    stopRepeat();

    drag = {
      axis,
      startPos: axis === 'y' ? event.clientY : event.clientX,
      startScroll: axis === 'y' ? viewport.scrollTop : viewport.scrollLeft,
    };

    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onYThumb = (e: PointerEvent) => onThumbDown('y', e);
  const onXThumb = (e: PointerEvent) => onThumbDown('x', e);
  y.thumb.addEventListener('pointerdown', onYThumb);
  x.thumb.addEventListener('pointerdown', onXThumb);

  const onPointerMove = (event: PointerEvent) => {
    if (!drag) {
      return;
    }

    const { axis, startPos, startScroll } = drag;
    if (axis === 'y') {
      const trackSize = y.track.clientHeight;
      const thumbSize = y.thumb.offsetHeight;
      const maxThumb = Math.max(1, trackSize - thumbSize);
      const maxScroll = Math.max(1, viewport.scrollHeight - viewport.clientHeight);
      const delta = event.clientY - startPos;
      viewport.scrollTop = startScroll + (delta / maxThumb) * maxScroll;
    } else {
      const trackSize = x.track.clientWidth;
      const thumbSize = x.thumb.offsetWidth;
      const maxThumb = Math.max(1, trackSize - thumbSize);
      const maxScroll = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
      const delta = event.clientX - startPos;
      viewport.scrollLeft = startScroll + (delta / maxThumb) * maxScroll;
    }
    update();
  };

  const onPointerUp = () => {
    drag = null;
    stopRepeat();
  };

  const stopDeskBubbling = (event: Event) => {
    event.stopPropagation();
  };
  for (const node of [y.root, x.root, corner]) {
    node.addEventListener('pointerdown', stopDeskBubbling);
    node.addEventListener('mousedown', stopDeskBubbling);
  }

  viewport.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', onPointerUp);

  const resizeObserver = new ResizeObserver(scheduleUpdate);
  resizeObserver.observe(host);
  resizeObserver.observe(viewport);

  const mutationObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (
        record.type === 'childList' &&
        Array.from(record.addedNodes)
          .concat(Array.from(record.removedNodes))
          .some(
            (node) =>
              node.nodeType === 1 &&
              ((node as Element).classList?.contains('sb') ||
                (node as Element).classList?.contains('scrollable-viewport')),
          )
      ) {
        continue;
      }
      scheduleUpdate();
      break;
    }
  });
  mutationObserver.observe(viewport, { childList: true, subtree: true, characterData: true });

  requestAnimationFrame(() => {
    update();
    requestAnimationFrame(update);
  });

  return () => {
    stopRepeat();
    if (raf) {
      cancelAnimationFrame(raf);
    }
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('blur', onPointerUp);
    viewport.removeEventListener('scroll', scheduleUpdate);

    y.root.remove();
    x.root.remove();
    corner.remove();
    host.classList.remove('has-custom-scrollbar', 'sb-show-y', 'sb-show-x');
  };
}
