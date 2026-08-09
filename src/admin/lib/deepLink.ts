/**
 * Parse AdminDesktop deep-link query (`?window=` / `?id=`).
 * @see docs/plan/Deep_Links.md
 */

export type AdminDeepLinkWindow =
  | 'sites'
  | 'hosts'
  | 'site'
  | 'control-panel'
  | 'settings';

export type AdminDeepLink = {
  window: AdminDeepLinkWindow;
  /** Positive entity id from `?id=` when valid; otherwise null. */
  id: number | null;
};

const WINDOW_VALUES = new Set<string>([
  'sites',
  'hosts',
  'site',
  'control-panel',
  'settings',
]);

function parsePositiveInt(raw: string | null): number | null {
  if (raw == null || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

/**
 * @param search - `location.search` or equivalent (`?window=sites&id=1` or without `?`).
 */
export function parseAdminDeepLink(search: string): AdminDeepLink | null {
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (!query) {
    return null;
  }

  const params = new URLSearchParams(query);
  const rawWindow = params.get('window')?.trim().toLowerCase() ?? '';
  if (!rawWindow) {
    return null;
  }

  const siteAlias = /^site-(\d+)$/.exec(rawWindow);
  if (siteAlias) {
    return { window: 'site', id: Number(siteAlias[1]) };
  }

  if (!WINDOW_VALUES.has(rawWindow)) {
    return null;
  }

  const id = parsePositiveInt(params.get('id'));
  if (rawWindow === 'site' && id == null) {
    return null;
  }

  return {
    window: rawWindow as AdminDeepLinkWindow,
    id,
  };
}
