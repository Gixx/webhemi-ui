import type { ReactNode } from 'react';
import { Alert, type AlertTone } from '../Alert/Alert';

export type FlashMap = Record<string, string[]>;

function toneForFlash(key: string): AlertTone {
  if (key === 'success') {
    return 'success';
  }
  if (key === 'warning') {
    return 'warning';
  }
  if (key === 'info') {
    return 'info';
  }
  return 'danger';
}

export function FlashList({ flashes }: { flashes?: FlashMap }): ReactNode {
  if (!flashes) {
    return null;
  }

  return Object.entries(flashes).flatMap(([tone, messages]) =>
    messages.map((message, index) => (
      <Alert key={`${tone}-${index}`} tone={toneForFlash(tone)} className="mb-4">
        {message}
      </Alert>
    )),
  );
}
