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

/** Main site slug — must match PHP `HostAdminSurfaceRules::MAIN_SLUG`. */
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
  };
  /** Sites available for the Site select. */
  sites?: HostFormSiteOption[];
  fieldErrors?: Partial<Record<'host' | 'siteId' | 'surface' | 'enabled', string>>;
  saving?: boolean;
  onSave: (payload: HostFormSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  className?: string;
};

/**
 * New / Edit Host modal (nested `.window` — not a shell window).
 */
export function HostFormDialog({
  mode,
  initial,
  sites = [],
  fieldErrors,
  saving = false,
  onSave,
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
  const surfaceLockedToSite =
    siteId != null && selectedSite?.slug !== MAIN_SITE_SLUG;

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  useEffect(() => {
    if (surfaceLockedToSite && surface !== 'site') {
      setSurface('site');
    }
  }, [surfaceLockedToSite, surface]);

  const errors = { ...localErrors, ...fieldErrors };
  const title =
    mode === 'new'
      ? 'New Host'
      : `${initial?.title ?? initial?.host ?? 'Host'} Properties`;
  const siteSelectLocked =
    mode === 'new' || (mode === 'edit' && initial?.verification === 'pending');

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

    const nextSurface: HostFormSurface = surfaceLockedToSite ? 'site' : surface;

    setLocalErrors(nextLocal);
    if (Object.keys(nextLocal).length > 0) {
      onError?.(Object.values(nextLocal).join('\n'));
      return;
    }

    onSave({
      mode,
      hostId: initial?.hostId,
      host: nextHost,
      // New hosts stay unassigned; assign after verify.
      siteId: mode === 'new' ? null : siteId,
      surface: nextSurface,
      enabled,
    });
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
              value={surfaceLockedToSite ? 'site' : surface}
              disabled={saving || surfaceLockedToSite}
              title={
                surfaceLockedToSite
                  ? 'Admin surface is only available on the Main site'
                  : undefined
              }
              aria-invalid={Boolean(errors.surface) || undefined}
              onChange={(event) =>
                setSurface(event.target.value as HostFormSurface)
              }
            >
              <option value="site">site</option>
              {!surfaceLockedToSite ? <option value="admin">admin</option> : null}
            </Select>
          </FieldRow>
          <FieldRow>
            <Checkbox
              id={enabledId}
              label="Enabled"
              accessKey="e"
              checked={enabled}
              disabled={saving}
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
