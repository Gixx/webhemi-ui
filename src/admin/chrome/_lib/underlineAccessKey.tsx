import type { ReactNode } from 'react';

/** Underline the first case-insensitive occurrence of `key` in plain text; keep original letter case. */
export function underlineAccessKey(text: string, key: string): ReactNode {
  if (!key) {
    return text;
  }
  const index = text.toLowerCase().indexOf(key.toLowerCase());
  if (index === -1) {
    return text;
  }
  const end = index + key.length;
  return (
    <>
      {text.slice(0, index)}
      <u>{text.slice(index, end)}</u>
      {text.slice(end)}
    </>
  );
}
