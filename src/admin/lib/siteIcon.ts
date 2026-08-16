import { MAIN_SITE_SLUG } from '../components/HostsWindow/hostFormAccess';

/** Default desktop / title-bar glyph when the site has no custom favicon. */
export type SiteGlyphKind = 'site' | 'site-main';

export function siteGlyphKind(slug?: string | null): SiteGlyphKind {
  return slug === MAIN_SITE_SLUG ? 'site-main' : 'site';
}

/** Admin API URL for a site’s favicon media blob (undefined → use default glyph). */
export function siteFaviconFileUrl(
  siteId: number,
  faviconMediaId: number | null | undefined,
  apiBaseUrl = '/admin/api',
): string | undefined {
  if (faviconMediaId == null || faviconMediaId <= 0) {
    return undefined;
  }
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/sites/${siteId}/media/${faviconMediaId}/file`;
}
