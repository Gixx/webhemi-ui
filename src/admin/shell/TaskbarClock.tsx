import { useEffect, useState } from 'react';

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Taskbar tray clock — updates once per second. */
export function TaskbarClock() {
  const [label, setLabel] = useState(() => formatClock(new Date()));

  useEffect(() => {
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
