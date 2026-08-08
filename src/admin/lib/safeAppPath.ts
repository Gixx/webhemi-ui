/**
 * Relative same-origin app path only (blocks open redirects / javascript: URLs).
 */
export function isSafeAppPath(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return false;
  }
  // Reject scheme-like prefixes (javascript:, data:, http:, …)
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return false;
  }
  return true;
}

export function assignSafeAppPath(href: string, fallback: string): void {
  const target = isSafeAppPath(href) ? href : fallback;
  window.location.assign(target);
}
