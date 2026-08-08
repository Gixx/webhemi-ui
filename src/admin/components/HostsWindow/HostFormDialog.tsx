import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  Select,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type HostFormSiteOption = {
  id: number;
  name: string;
  slug?: string;
};

export type HostFormSurface = 'admin' | 'site';

/** Main site slug — must match PHP `Site::MAIN_SLUG`. */
export const MAIN_SITE_SLUG = 'main';

export type HostFormMode = 'new' | 'edit';

export type HostFormValues = {
  host: string;
  siteId: number | null;
  surface: HostFormSurface;
  enabled: boolean;
};

export type HostFormSavePayload = HostFormValues & {
  mode: HostFormMode;
  hostId?: number;
};

export type HostFormDialogProps = {
  mode: HostFormMode;
  /** Prefilled when `mode === 'edit'`. */
  initial?: Partial<HostFormValues> & {
    hostId?: number;
    title?: string;
    /** Ownership verification — pending hosts cannot be assigned to a site. */
    verification?: 'pending' | 'verified';
    /** Primary www host — site/surface/enabled locked. */
    protected?: boolean;
  };
  /** Sites available for the Site select. */
  sites?: HostFormSiteOption[];
  /**
   * Id of the host that currently has surface=admin (if any).
   * Used to lock Surface when another admin host already exists.
   */
  adminSurfaceHostId?: number | null;
  /**
   * Configured install access mode. `null` = unknown — treat losing
   * the healthy admin host as risky when domain may be active.
   */
  adminAccess?: 'path' | 'domain' | null;
  fieldErrors?: Partial<Record<'host' | 'siteId' | 'surface' | 'enabled', string>>;
  saving?: boolean;
  onSave: (payload: HostFormSavePayload) => void;
  /**
   * When set, called instead of {@link onSave} if the edit would force
   * access.admin domain→path. Parent must show a sibling `DesktopModal`
   * alert (nested modals inside this form do not stack correctly).
   */
  onAccessModeResetConfirm?: (payload: HostFormSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  className?: string;
};

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

/**
 * New / Edit Host modal (nested `.window` — not a shell window).
 */
export function HostFormDialog({
  mode,
  initial,
  sites = [],
  adminSurfaceHostId = null,
  adminAccess = null,
  fieldErrors,
  saving = false,
  onSave,
  onAccessModeResetConfirm,
  onError,
  onClose,
  className,
}: HostFormDialogProps) {
  const hostId = useId();
  const siteSelectId = useId();
  const surfaceId = useId();
  const enabledId = useId();
  const [host, setHost] = useState(initial?.host ?? '');
  const [siteId, setSiteId] = useState<number | null>(initial?.siteId ?? null);
  const [surface, setSurface] = useState<HostFormSurface>(initial?.surface ?? 'site');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'host', string>>
  >({});

  const selectedSite = sites.find((site) => site.id === siteId);
  const hostProtected = Boolean(initial?.protected);
  const siteSelectLocked =
    mode === 'new' ||
    hostProtected ||
    (mode === 'edit' && initial?.verification === 'pending');
  const isMainSelected =
    siteId != null && selectedSite?.slug === MAIN_SITE_SLUG;
  const otherAdminExists =
    adminSurfaceHostId != null && adminSurfaceHostId !== initial?.hostId;
  const surfaceSelectable =
    mode === 'edit' &&
    !hostProtected &&
    !siteSelectLocked &&
    siteId != null &&
    isMainSelected &&
    !otherAdminExists;

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  useEffect(() => {
    if (!surfaceSelectable && surface !== 'site') {
      setSurface('site');
    }
  }, [surfaceSelectable, surface]);

  const errors = { ...localErrors, ...fieldErrors };
  const title =
    mode === 'new'
      ? 'New Host'
      : `${initial?.title ?? initial?.host ?? 'Host'} Properties`;

  const surfaceTitle = (() => {
    if (mode === 'new') {
      return 'Admin surface is set after the host is assigned to the Main site';
    }
    if (hostProtected) {
      return 'Protected system host must keep the site surface';
    }
    if (siteSelectLocked) {
      return 'Verify ownership before assigning a site';
    }
    if (siteId == null) {
      return 'Assign a site before choosing surface';
    }
    if (!isMainSelected) {
      return 'Admin surface is only available on the Main site';
    }
    if (otherAdminExists) {
      return 'Another host already uses the admin surface';
    }
    return undefined;
  })();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextHost = host.trim().toLowerCase();
    const nextLocal: Partial<Record<'host', string>> = {};
    if (!nextHost) {
      nextLocal.host = 'Hostname is required.';
    } else if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(nextHost)) {
      nextLocal.host = 'Use a valid domain name.';
    }

    const nextSurface: HostFormSurface = surfaceSelectable ? surface : 'site';

    setLocalErrors(nextLocal);
    if (Object.keys(nextLocal).length > 0) {
      onError?.(Object.values(nextLocal).join('\n'));
      return;
    }

    const payload: HostFormSavePayload = {
      mode,
      hostId: initial?.hostId,
      host: nextHost,
      // New hosts stay unassigned; assign after verify.
      siteId: mode === 'new' ? null : siteId,
      surface: mode === 'new' ? 'site' : nextSurface,
      enabled,
    };

    if (
      onAccessModeResetConfirm &&
      wouldLoseDomainAdmin({
        mode,
        adminAccess,
        initial,
        sites,
        nextSurface: payload.surface,
        nextEnabled: payload.enabled,
        nextSiteId: payload.siteId,
        nextHost: payload.host,
      })
    ) {
      onAccessModeResetConfirm(payload);
      return;
    }

    onSave(payload);
  };

  return (
    <PaneWindowShell
      className={cn('host-form-dialog', 'site-form-dialog', className)}
      width={420}
      title={title}
      titleIcon="hosts"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="site-form-dialog-form" onSubmit={handleSubmit} noValidate>
        <WindowBody>
          <FieldRow>
            <TextBox
              id={hostId}
              label="Host:"
              accessKey="h"
              value={host}
              disabled={saving}
              aria-invalid={Boolean(errors.host) || undefined}
              onChange={(event) => setHost(event.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <Select
              id={siteSelectId}
              label="Site:"
              accessKey="s"
              value={siteId != null ? String(siteId) : ''}
              disabled={saving || siteSelectLocked}
              title={
                mode === 'new'
                  ? 'Assign a site after ownership is verified'
                  : hostProtected
                    ? 'Protected system host stays on the Main site'
                    : siteSelectLocked
                      ? 'Verify ownership before assigning a site'
                      : undefined
              }
              aria-invalid={Boolean(errors.siteId) || undefined}
              onChange={(event) => {
                const value = event.target.value;
                setSiteId(value === '' ? null : Number(value));
              }}
            >
              <option value="">None</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </FieldRow>
          <FieldRow>
            <Select
              id={surfaceId}
              label="Surface:"
              accessKey="u"
              value={surfaceSelectable ? surface : 'site'}
              disabled={saving || !surfaceSelectable}
              title={surfaceTitle}
              aria-invalid={Boolean(errors.surface) || undefined}
              onChange={(event) =>
                setSurface(event.target.value as HostFormSurface)
              }
            >
              <option value="site">site</option>
              {surfaceSelectable ? <option value="admin">admin</option> : null}
            </Select>
          </FieldRow>
          <FieldRow>
            <Checkbox
              id={enabledId}
              label="Enabled"
              accessKey="e"
              checked={enabled}
              disabled={saving || hostProtected}
              title={
                hostProtected
                  ? 'Protected system host cannot be disabled'
                  : undefined
              }
              aria-invalid={Boolean(errors.enabled) || undefined}
              onChange={(event) => setEnabled(event.target.checked)}
            />
          </FieldRow>
        </WindowBody>

        <FieldRow className="justify-end site-form-dialog-actions">
          <Button type="submit" isDefault accessKey="o" loading={saving}>
            OK
          </Button>
          <Button type="button" accessKey="c" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      </form>
    </PaneWindowShell>
  );
}
