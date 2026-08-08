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

/**
 * Absolute http(s) URL for admin host switches (path ↔ domain login).
 */
export function isSafeHttpUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function assignSafeAppPath(href: string, fallback: string): void {
  const target = isSafeAppPath(href) ? href : fallback;
  window.location.assign(target);
}

export function assignSafeNavigationUrl(href: string, fallback: string): void {
  if (isSafeAppPath(href) || isSafeHttpUrl(href)) {
    window.location.assign(href);
    return;
  }
  window.location.assign(isSafeAppPath(fallback) || isSafeHttpUrl(fallback) ? fallback : '/admin/login');
}
