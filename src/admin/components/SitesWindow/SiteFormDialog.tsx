import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  Select,
  SunkenPanel,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableRow,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';
import { MAIN_SITE_SLUG } from '../HostsWindow/HostFormDialog';

export type SiteFormHostStatus = 'pending' | 'verified';

export type SiteFormHostOption = {
  id: number;
  host: string;
  /** Site currently owning this host, if any. */
  siteId?: number | null;
  /** Display name of the owning site (when bound). */
  siteName?: string | null;
  /** Ownership verification (pending → verified); assign when verified + unassigned. */
  status: SiteFormHostStatus;
  surface?: 'admin' | 'site';
  enabled?: boolean;
  protected?: boolean;
};

export type SiteFormMode = 'new' | 'edit';

export type SiteFormValues = {
  name: string;
  slug: string;
  enabled: boolean;
};

export type SiteFormSavePayload = SiteFormValues & {
  mode: SiteFormMode;
  siteId?: number;
};

export type SiteFormDialogProps = {
  mode: SiteFormMode;
  /** Prefilled when `mode === 'edit'`. */
  initial?: Partial<SiteFormValues> & {
    siteId?: number;
    title?: string;
    protected?: boolean;
  };
  /** All hosts; the Hosts tab lists only those assigned to this site. */
  hosts?: SiteFormHostOption[];
  /**
   * Configured install access mode. `null` = unknown — treat unassigning
   * the admin host as risky when domain may be active.
   */
  adminAccess?: 'path' | 'domain' | null;
  /** Marks invalid fields (no inline text — use {@link onError} / MessageDialog). */
  fieldErrors?: Partial<Record<'name' | 'slug', string>>;
  saving?: boolean;
  /** True while an unassign request is in flight. */
  unassigning?: boolean;
  /** True while an assign request is in flight. */
  assigning?: boolean;
  onSave: (payload: SiteFormSavePayload) => void;
  /** Validation / user-facing errors (caller shows MessageDialog + sound). */
  onError?: (message: string) => void;
  onClose: () => void;
  /**
   * Opens Hosts window → Add (Phase 6 Hosts).
   * When omitted, the Add button stays disabled.
   */
  onAddHost?: () => void;
  /** Assign a verified, unassigned host to this site. */
  onAssignHost?: (hostId: number) => void;
  /** Unassign selected host from this site (does not delete the host). */
  onUnassignHost?: (hostId: number) => void;
  /**
   * When set, called instead of {@link onUnassignHost} if unassign would force
   * access.admin domain→path. Parent shows a sibling alert modal.
   */
  onAccessModeResetUnassign?: (hostId: number) => void;
  className?: string;
};

type FormTab = 'general' | 'hosts';

/**
 * New / Edit Site modal: General + Hosts tabs (nested `.window` tabpanel — not a shell window).
 */
export function SiteFormDialog({
  mode,
  initial,
  hosts = [],
  adminAccess = null,
  fieldErrors,
  saving = false,
  unassigning = false,
  assigning = false,
  onSave,
  onError,
  onClose,
  onAddHost,
  onAssignHost,
  onUnassignHost,
  onAccessModeResetUnassign,
  className,
}: SiteFormDialogProps) {
  const nameId = useId();
  const slugId = useId();
  const enabledId = useId();
  const assignSelectId = useId();
  const [tab, setTab] = useState<FormTab>('general');
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null);
  const [assignHostId, setAssignHostId] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<Partial<Record<'name' | 'slug', string>>>(
    {},
  );

  const assignedHosts = useMemo(() => {
    if (initial?.siteId == null) {
      return [];
    }
    return hosts.filter((host) => host.siteId === initial.siteId);
  }, [hosts, initial?.siteId]);

  const assignableHosts = useMemo(
    () =>
      hosts.filter(
        (host) => host.status === 'verified' && (host.siteId == null || host.siteId === undefined),
      ),
    [hosts],
  );

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  useEffect(() => {
    if (
      selectedHostId != null &&
      !assignedHosts.some((host) => host.id === selectedHostId)
    ) {
      setSelectedHostId(null);
    }
  }, [assignedHosts, selectedHostId]);

  useEffect(() => {
    if (
      assignHostId != null &&
      !assignableHosts.some((host) => host.id === assignHostId)
    ) {
      setAssignHostId(null);
    }
  }, [assignableHosts, assignHostId]);

  const errors = { ...localErrors, ...fieldErrors };
  const title =
    mode === 'new'
      ? 'New Site'
      : `${initial?.title ?? initial?.name ?? 'Site'} Properties`;
  const busy = saving || unassigning || assigning;
  const siteProtected = Boolean(initial?.protected);
  const canRemove =
    Boolean(onUnassignHost) &&
    selectedHostId != null &&
    initial?.siteId != null &&
    !busy &&
    !assignedHosts.find((host) => host.id === selectedHostId)?.protected;
  const canAssign =
    Boolean(onAssignHost) &&
    assignHostId != null &&
    initial?.siteId != null &&
    !busy;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    const nextName = name.trim();
    const nextSlug = slug.trim().toLowerCase();
    const nextLocal: Partial<Record<'name' | 'slug', string>> = {};
    if (!nextName) {
      nextLocal.name = 'Name is required.';
    }
    if (!nextSlug) {
      nextLocal.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nextSlug)) {
      nextLocal.slug = 'Use lowercase letters, digits, and hyphens.';
    }

    setLocalErrors(nextLocal);
    if (Object.keys(nextLocal).length > 0) {
      setTab('general');
      onError?.(Object.values(nextLocal).join('\n'));
      return;
    }

    onSave({
      mode,
      siteId: initial?.siteId,
      name: nextName,
      slug: nextSlug,
      enabled,
    });
  };

  const handleRemove = () => {
    if (!canRemove || selectedHostId == null) {
      return;
    }
    const selected = assignedHosts.find((host) => host.id === selectedHostId);
    const losesDomainAdmin =
      adminAccess !== 'path' &&
      selected?.surface === 'admin' &&
      selected.enabled !== false &&
      selected.status === 'verified' &&
      (initial?.slug === MAIN_SITE_SLUG || slug.trim().toLowerCase() === MAIN_SITE_SLUG);

    if (losesDomainAdmin && onAccessModeResetUnassign) {
      onAccessModeResetUnassign(selectedHostId);
      return;
    }
    onUnassignHost?.(selectedHostId);
  };

  const handleAssign = () => {
    if (!canAssign || assignHostId == null) {
      return;
    }
    onAssignHost?.(assignHostId);
  };

  return (
    <PaneWindowShell
      className={cn('site-form-dialog', className)}
      width={480}
      title={title}
      titleIcon="sites"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="site-form-dialog-form" onSubmit={handleSubmit} noValidate>
        <TabList>
          <Tab
            selected={tab === 'general'}
            href="#site-form-general"
            onClick={(event) => {
              event.preventDefault();
              setTab('general');
            }}
          >
            General
          </Tab>
          <Tab
            selected={tab === 'hosts'}
            href="#site-form-hosts"
            onClick={(event) => {
              event.preventDefault();
              setTab('hosts');
            }}
          >
            Hosts
          </Tab>
        </TabList>

        <TabPanel>
          <WindowBody>
            {tab === 'general' ? (
              <>
                <FieldRow>
                  <TextBox
                    id={nameId}
                    label="Name:"
                    accessKey="n"
                    value={name}
                    disabled={busy}
                    aria-invalid={Boolean(errors.name) || undefined}
                    onChange={(event) => setName(event.target.value)}
                  />
                </FieldRow>
                <FieldRow>
                  <TextBox
                    id={slugId}
                    label="Slug:"
                    accessKey="s"
                    value={slug}
                    disabled={busy || siteProtected}
                    title={
                      siteProtected
                        ? 'Protected system site slug cannot be changed'
                        : undefined
                    }
                    aria-invalid={Boolean(errors.slug) || undefined}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                </FieldRow>
                <FieldRow>
                  <Checkbox
                    id={enabledId}
                    label="Enabled"
                    accessKey="e"
                    checked={enabled}
                    disabled={busy || siteProtected}
                    title={
                      siteProtected
                        ? 'Protected system site cannot be disabled'
                        : undefined
                    }
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0, marginBottom: 8 }}>
                  {initial?.siteId == null
                    ? 'Save the site first, then assign verified hosts here or from Hosts.'
                    : 'Assigned hosts below. Assign only verified, unassigned hosts; Remove unassigns without deleting.'}
                </p>
                <SunkenPanel
                  scrollable
                  tone="white"
                  className="site-form-host-list"
                >
                  {assignedHosts.length === 0 ? (
                    <p style={{ margin: 8 }}>
                      {initial?.siteId == null
                        ? 'No hosts until this site is saved.'
                        : 'No hosts assigned.'}
                    </p>
                  ) : (
                    <Table aria-label="Assigned hosts">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedHosts.map((row) => (
                          <TableRow
                            key={row.id}
                            highlighted={selectedHostId === row.id}
                            onClick={() =>
                              setSelectedHostId((current) =>
                                current === row.id ? null : row.id,
                              )
                            }
                          >
                            <td>{row.host}</td>
                            <td>{row.status}</td>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </SunkenPanel>
                {initial?.siteId != null ? (
                  <FieldRow style={{ marginTop: 8 }}>
                    <Select
                      id={assignSelectId}
                      label="Assign:"
                      accessKey="i"
                      value={assignHostId != null ? String(assignHostId) : ''}
                      disabled={busy || !onAssignHost || assignableHosts.length === 0}
                      title={
                        assignableHosts.length === 0
                          ? 'No verified, unassigned hosts available'
                          : 'Verified hosts not bound to a site'
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        setAssignHostId(value === '' ? null : Number(value));
                      }}
                    >
                      <option value="">
                        {assignableHosts.length === 0
                          ? 'None available'
                          : 'Select a host…'}
                      </option>
                      {assignableHosts.map((host) => (
                        <option key={host.id} value={host.id}>
                          {host.host}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      accessKey="g"
                      disabled={!canAssign}
                      title="Assign selected verified host to this site"
                      onClick={handleAssign}
                    >
                      Assign
                    </Button>
                  </FieldRow>
                ) : null}
                <FieldRow className="justify-end" style={{ marginTop: 8 }}>
                  <Button
                    type="button"
                    accessKey="a"
                    disabled={busy || !onAddHost}
                    title={
                      onAddHost
                        ? 'Add a new host'
                        : 'Opens Hosts → Add (coming soon)'
                    }
                    onClick={onAddHost}
                  >
                    Add…
                  </Button>
                  <Button
                    type="button"
                    accessKey="r"
                    disabled={!canRemove}
                    title={
                      assignedHosts.find((host) => host.id === selectedHostId)
                        ?.protected
                        ? 'Protected system host cannot be unassigned'
                        : 'Unassign selected host from this site'
                    }
                    onClick={handleRemove}
                  >
                    Remove
                  </Button>
                </FieldRow>
              </>
            )}
          </WindowBody>
        </TabPanel>

        <FieldRow className="justify-end site-form-dialog-actions">
          <Button type="submit" isDefault accessKey="o" loading={saving}>
            OK
          </Button>
          <Button type="button" accessKey="c" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      </form>
    </PaneWindowShell>
  );
}
