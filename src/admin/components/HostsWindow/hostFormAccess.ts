import type {
  HostFormDialogProps,
  HostFormMode,
  HostFormSiteOption,
  HostFormSurface,
} from './HostFormDialog';

/** Main site slug — must match PHP `Site::MAIN_SLUG`. */
export const MAIN_SITE_SLUG = 'main';

/** Whether saving these values would drop the healthy Main admin host under domain mode. */
export function wouldLoseDomainAdmin(options: {
  mode: HostFormMode;
  adminAccess: 'path' | 'domain' | null;
  initial?: HostFormDialogProps['initial'];
  sites: HostFormSiteOption[];
  nextSurface: HostFormSurface;
  nextEnabled: boolean;
  nextSiteId: number | null;
  nextHost?: string;
}): boolean {
  const {
    mode,
    adminAccess,
    initial,
    sites,
    nextSurface,
    nextEnabled,
    nextSiteId,
    nextHost,
  } = options;
  if (mode !== 'edit' || adminAccess === 'path') {
    return false;
  }
  if (initial?.surface !== 'admin') {
    return false;
  }
  if (initial.enabled === false) {
    return false;
  }
  if (initial.verification === 'pending') {
    return false;
  }
  const initialSite = sites.find((site) => site.id === initial.siteId);
  if (initialSite?.slug !== MAIN_SITE_SLUG) {
    return false;
  }

  if (nextSurface !== 'admin') {
    return true;
  }
  if (!nextEnabled) {
    return true;
  }
  if (nextSiteId == null) {
    return true;
  }
  const nextSite = sites.find((site) => site.id === nextSiteId);
  if (nextSite?.slug !== MAIN_SITE_SLUG) {
    return true;
  }
  // Hostname change reverts verification to pending → admin host no longer healthy.
  if (
    nextHost != null &&
    initial.host != null &&
    nextHost !== initial.host.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}
