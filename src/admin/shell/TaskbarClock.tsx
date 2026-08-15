import { useEffect, useState } from 'react';

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Chromatic capture browser sets this UA (same check as `chromatic/isChromatic`).
 * Freeze the tray clock so every push does not diff on wall-clock time.
 */
function isChromaticCapture(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    /Chromatic/.test(window.navigator.userAgent) ||
    /chromatic=true/.test(window.location.href)
  );
}

/** Matches the established Chromatic baseline tray time. */
const CHROMATIC_FIXED_CLOCK = '21:30';

/** Taskbar tray clock — updates once per second (fixed under Chromatic). */
export function TaskbarClock() {
  const [label, setLabel] = useState(() =>
    isChromaticCapture() ? CHROMATIC_FIXED_CLOCK : formatClock(new Date()),
  );

  useEffect(() => {
    if (isChromaticCapture()) {
      setLabel(CHROMATIC_FIXED_CLOCK);
      return;
    }
    const tick = () => setLabel(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="sunken-panel clock" aria-live="polite">
      {label}
    </div>
  );
}
