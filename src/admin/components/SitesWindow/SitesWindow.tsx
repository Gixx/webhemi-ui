import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Button,
  FieldRow,
  StatusBar,
  StatusBarField,
  SunkenPanel,
  Table,
  TableRow,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { DesktopModal } from '../../bricks/DesktopModal';
import { HeadingPanelWindow } from '../../bricks/HeadingPanelWindow';
import { MessageDialog } from '../../bricks/MessageDialog';
import { ACCESS_MODE_RESET_WARNING } from '../../lib/accessModeResetWarning';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import {
  SiteFormDialog,
  type SiteFormHostOption,
  type SiteFormSavePayload,
} from './SiteFormDialog';

export type SitesWindowSite = {
  id: number;
  slug: string;
  name: string;
  enabled: boolean;
  /** Installer/seed Main site — not deletable/disableable; slug locked. */
  protected?: boolean;
  hostCount: number;
};

/** @deprecated Prefer {@link SiteFormSavePayload} via `onSave`. */
export type SitesWindowCreatePayload = {
  name: string;
  slug: string;
};

export type SitesWindowProps = {
  sites?: SitesWindowSite[];
  /** Hosts available for assignment in New/Edit (props until Hosts API). */
  hosts?: SiteFormHostOption[];
  /**
   * Prefer selecting this site once it appears in `sites` (deep link `?id=`).
   * Applied once per id; user can change selection afterward.
   */
  preferSelectedId?: number | null;
  /**
   * Configured install access mode — escalates unassign when removing the
   * admin host under domain mode.
   */
  adminAccess?: 'path' | 'domain' | null;
  canEdit?: boolean;
  loading?: boolean;
  /** Window-level load error — Error MessageDialog + chord. */
  error?: string | null;
  /** Field errors from the last save attempt (MessageDialog + aria-invalid). */
  fieldErrors?: Partial<Record<'name' | 'slug', string>>;
  /** Save / assign / unassign error message (MessageDialog + chord). */
  formError?: string | null;
  /** Transient success / status copy for the middle status-bar field. */
  statusMessage?: string | null;
  /** Called when the window clears a success message (e.g. selection change). */
  onClearStatusMessage?: () => void;
  /** Submit spinner on OK in the form dialog. */
  saving?: boolean;
  /** True while delete request is in flight. */
  deleting?: boolean;
  onSave?: (payload: SiteFormSavePayload) => void;
  /** @deprecated Use `onSave` with `mode: 'new'`. */
  onCreate?: (payload: SitesWindowCreatePayload) => void;
  onDelete?: (site: SitesWindowSite) => void;
  /** Opens Hosts → Add from the form dialog. */
  onAddHost?: () => void;
  /** Assign a verified, unassigned host to the site being edited. */
  onAssignHost?: (hostId: number, siteId: number) => void;
  /** Unassign a host from the site being edited. */
  onUnassignHost?: (hostId: number) => void;
  unassigning?: boolean;
  assigning?: boolean;
  /** Digested chord URL from Twig; Storybook uses package static path. */
  errorSoundUrl?: string;
  /** Digested ding URL — blocked-owner attention (Default Beep). */
  dingSoundUrl?: string;
  /** Called when the Error MessageDialog is dismissed (e.g. redirect after session expiry). */
  onAlertClose?: () => void;
  /** Defaults to `onClose` when omitted. */
  onCancel?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  /** Requires `resizable` (default true). */
  onMaximize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
  maximized?: boolean;
  /**
   * Window may be resized / maximized (default true).
   * When false, Maximize/Restore is not shown.
   */
  resizable?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
  /** Optional floor for standalone Storybook; omit in the shell so resize can shrink. */
  tableMinHeight?: number;
};

type FormState =
  | { open: false }
  | {
      open: true;
      mode: 'new' | 'edit';
      siteId?: number;
      name: string;
      slug: string;
      enabled: boolean;
      protected?: boolean;
      title?: string;
    };

type AlertState = { title: string; message: string } | null;
type ConfirmDeleteState = { site: SitesWindowSite } | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors: Partial<Record<'name' | 'slug', string>> | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.name,
    fieldErrors?.slug,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Sites admin window: list + New/Edit/Delete/Cancel.
 * New/Edit open a tabbed SiteFormDialog (General + Hosts).
 */
export function SitesWindow({
  sites = [],
  hosts = [],
  preferSelectedId = null,
  adminAccess = null,
  canEdit = false,
  loading = false,
  error = null,
  fieldErrors,
  formError = null,
  statusMessage = null,
  onClearStatusMessage,
  saving = false,
  deleting = false,
  onSave,
  onCreate,
  onDelete,
  onAddHost,
  onAssignHost,
  onUnassignHost,
  unassigning = false,
  assigning = false,
  errorSoundUrl,
  dingSoundUrl,
  onAlertClose,
  onCancel,
  onClose,
  onMinimize,
  onMaximize,
  onActivate,
  inactive = false,
  maximized = false,
  resizable = true,
  className,
  style,
  width = 560,
  tableMinHeight,
}: SitesWindowProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ open: false });
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  const [pendingAccessResetUnassign, setPendingAccessResetUnassign] = useState<
    number | null
  >(null);
  const wasSavingRef = useRef(false);
  const alertSoundKeyRef = useRef<string | null>(null);
  const confirmSoundKeyRef = useRef<string | null>(null);
  const accessResetSoundKeyRef = useRef<string | null>(null);
  const appliedPreferIdRef = useRef<number | null>(null);

  const showErrorAlert = useCallback(
    (message: string, title = 'Error') => {
      const key = `${title}\0${message}`;
      setAlert({ title, message });
      if (alertSoundKeyRef.current === key) {
        return;
      }
      alertSoundKeyRef.current = key;
      playAdminSound('chord', errorSoundUrl);
    },
    [errorSoundUrl],
  );

  const closeAlert = useCallback(() => {
    setAlert(null);
    alertSoundKeyRef.current = null;
    onAlertClose?.();
  }, [onAlertClose]);

  const openDeleteConfirm = useCallback(
    (site: SitesWindowSite) => {
      const key = `delete\0${site.id}`;
      setConfirmDelete({ site });
      if (confirmSoundKeyRef.current === key) {
        return;
      }
      confirmSoundKeyRef.current = key;
      playAdminSound('ding', dingSoundUrl);
    },
    [dingSoundUrl],
  );

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDelete(null);
    confirmSoundKeyRef.current = null;
  }, []);

  const openAccessResetUnassign = useCallback(
    (hostId: number) => {
      const key = `access-reset-unassign\0${hostId}`;
      setPendingAccessResetUnassign(hostId);
      if (accessResetSoundKeyRef.current === key) {
        return;
      }
      accessResetSoundKeyRef.current = key;
      playAdminSound('chord', errorSoundUrl);
    },
    [errorSoundUrl],
  );

  const closeAccessResetUnassign = useCallback(() => {
    setPendingAccessResetUnassign(null);
    accessResetSoundKeyRef.current = null;
  }, []);

  const confirmAccessResetUnassign = useCallback(() => {
    if (pendingAccessResetUnassign == null || !onUnassignHost) {
      closeAccessResetUnassign();
      return;
    }
    const hostId = pendingAccessResetUnassign;
    closeAccessResetUnassign();
    onUnassignHost(hostId);
  }, [pendingAccessResetUnassign, closeAccessResetUnassign, onUnassignHost]);

  useEffect(() => {
    if (preferSelectedId == null) {
      appliedPreferIdRef.current = null;
      return;
    }
    if (appliedPreferIdRef.current === preferSelectedId) {
      return;
    }
    if (sites.some((site) => site.id === preferSelectedId)) {
      setSelectedId(preferSelectedId);
      appliedPreferIdRef.current = preferSelectedId;
    }
  }, [preferSelectedId, sites]);

  useEffect(() => {
    if (selectedId != null && !sites.some((site) => site.id === selectedId)) {
      setSelectedId(null);
    }
  }, [sites, selectedId]);

  useEffect(() => {
    if (
      confirmDelete != null &&
      !sites.some((site) => site.id === confirmDelete.site.id)
    ) {
      closeDeleteConfirm();
    }
  }, [sites, confirmDelete, closeDeleteConfirm]);

  // Close the form after success; API errors open MessageDialog via formError effect.
  useEffect(() => {
    const hadErrors =
      Boolean(formError) ||
      Boolean(fieldErrors && Object.keys(fieldErrors).length > 0);
    if (wasSavingRef.current && !saving && form.open && !hadErrors) {
      setForm({ open: false });
      setShowFormErrors(false);
    }
    wasSavingRef.current = saving;
  }, [saving, form.open, formError, fieldErrors]);

  // Load failures → Error MessageDialog + chord before paint (Chromatic/play-safe).
  useLayoutEffect(() => {
    if (!error || loading) {
      return;
    }
    showErrorAlert(error);
  }, [error, loading, showErrorAlert]);

  // Save / assign / unassign / API form errors (form open or closed).
  useEffect(() => {
    if (!formError && !(form.open && showFormErrors)) {
      return;
    }
    const message = formatSaveErrors(
      formError,
      form.open && showFormErrors ? fieldErrors : undefined,
    );
    if (!message) {
      return;
    }
    showErrorAlert(message);
  }, [formError, fieldErrors, form.open, showFormErrors, showErrorAlert]);

  const busy = loading || saving || unassigning || assigning || deleting;
  const selected = sites.find((site) => site.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const canSave = Boolean(onSave || onCreate);

  const selectSite = (id: number) => {
    onClearStatusMessage?.();
    setSelectedId((current) => (current === id ? null : id));
  };

  const openNew = () => {
    if (!canEdit || busy) {
      return;
    }
    onClearStatusMessage?.();
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      name: '',
      slug: '',
      enabled: true,
    });
  };

  const openEdit = (site?: SitesWindowSite) => {
    const target = site ?? selected;
    if (!canEdit || !target || busy || !canSave) {
      return;
    }
    if (selectedId !== target.id) {
      onClearStatusMessage?.();
    }
    setSelectedId(target.id);
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'edit',
      siteId: target.id,
      name: target.name,
      slug: target.slug,
      enabled: target.enabled,
      protected: target.protected,
      title: target.name,
    });
  };

  const closeForm = () => {
    setShowFormErrors(false);
    setForm({ open: false });
    closeAccessResetUnassign();
  };

  const handleFormSave = (payload: SiteFormSavePayload) => {
    setShowFormErrors(true);
    if (onSave) {
      onSave(payload);
      return;
    }
    if (payload.mode === 'new' && onCreate) {
      onCreate({ name: payload.name, slug: payload.slug });
      setForm({ open: false });
    }
  };

  const handleDelete = () => {
    if (!canEdit || !selected || !onDelete || busy || selected.protected) {
      return;
    }
    openDeleteConfirm(selected);
  };

  const confirmDeleteSite = () => {
    if (!confirmDelete || !onDelete) {
      return;
    }
    const target = confirmDelete.site;
    closeDeleteConfirm();
    onDelete(target);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  const statusLeft = loading
    ? 'Loading…'
    : `${sites.length} site${sites.length === 1 ? '' : 's'}`;
  const statusMid =
    statusMessage ??
    (selected
      ? selected.name
      : canEdit
        ? 'Select a site, or choose New.'
        : '');

  return (
    <HeadingPanelWindow
      className={cn('sites-window', className)}
      style={{ width, minHeight: 420, ...style }}
      inactive={inactive}
      resizable={resizable}
      title="Sites"
      titleIcon="sites"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" onClick={onMinimize} />
          {resizable ? (
            <TitleBarControl
              action={maximized ? 'Restore' : 'Maximize'}
              onClick={onMaximize}
            />
          ) : null}
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
      onMouseDown={onActivate}
      heading={
        <p style={{ margin: 0 }}>
          Multi-tenant sites bound to one or more hostnames.
        </p>
      }
      actions={
        canEdit ? (
          <FieldRow className="justify-end">
            <Button
              type="button"
              isDefault
              accessKey="n"
              disabled={busy || !canSave}
              onClick={openNew}
            >
              New
            </Button>
            <Button
              type="button"
              accessKey="e"
              disabled={busy || !hasSelection || !canSave}
              onClick={() => openEdit()}
            >
              Edit
            </Button>
            <Button
              type="button"
              accessKey="d"
              disabled={
                busy || !hasSelection || !onDelete || Boolean(selected?.protected)
              }
              title={
                selected?.protected
                  ? 'Protected system site cannot be deleted'
                  : undefined
              }
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button type="button" accessKey="c" disabled={busy} onClick={handleCancel}>
              Cancel
            </Button>
          </FieldRow>
        ) : (
          <FieldRow className="justify-end">
            <Button type="button" accessKey="c" onClick={handleCancel}>
              Cancel
            </Button>
          </FieldRow>
        )
      }
      statusBar={
        <StatusBar>
          <StatusBarField>{statusLeft}</StatusBarField>
          <StatusBarField className="description">{statusMid}</StatusBarField>
          <StatusBarField />
        </StatusBar>
      }
    >
      <>
        <SunkenPanel
          scrollable
          tone="white"
          style={tableMinHeight != null ? { minHeight: tableMinHeight } : undefined}
        >
          {loading && sites.length === 0 ? (
            <p style={{ margin: 8 }}>Loading sites…</p>
          ) : sites.length === 0 ? (
            <p style={{ margin: 8 }}>No sites yet.</p>
          ) : (
            <Table aria-label="Sites">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Hosts</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <TableRow
                    key={site.id}
                    highlighted={selectedId === site.id}
                    onClick={() => selectSite(site.id)}
                    onDoubleClick={() => openEdit(site)}
                  >
                    <td>{site.name}</td>
                    <td>{site.slug}</td>
                    <td>{site.hostCount}</td>
                    <td>{site.enabled ? 'Enabled' : 'Disabled'}</td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </SunkenPanel>

        {form.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <SiteFormDialog
              key={`${form.mode}-${form.siteId ?? 'new'}`}
              mode={form.mode}
              initial={{
                siteId: form.siteId,
                name: form.name,
                slug: form.slug,
                enabled: form.enabled,
                protected: form.protected,
                title: form.title,
              }}
              hosts={hosts}
              adminAccess={adminAccess}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              unassigning={unassigning}
              assigning={assigning}
              onSave={handleFormSave}
              onError={showErrorAlert}
              onClose={closeForm}
              onAddHost={onAddHost}
              onAssignHost={
                onAssignHost && form.open && form.siteId != null
                  ? (hostId) => onAssignHost(hostId, form.siteId as number)
                  : undefined
              }
              onUnassignHost={onUnassignHost}
              onAccessModeResetUnassign={openAccessResetUnassign}
            />
          </DesktopModal>
        ) : null}

        {pendingAccessResetUnassign != null ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="warning"
              title="Warning"
              message={ACCESS_MODE_RESET_WARNING}
              confirmLabel="OK"
              cancelLabel="Cancel"
              onClose={closeAccessResetUnassign}
              onConfirm={confirmAccessResetUnassign}
            />
          </DesktopModal>
        ) : null}

        {confirmDelete ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="question"
              title="Confirm"
              message={`Delete site “${confirmDelete.site.name}”? This cannot be undone.`}
              onClose={closeDeleteConfirm}
              onConfirm={confirmDeleteSite}
            />
          </DesktopModal>
        ) : null}

        {alert ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="error"
              title={alert.title}
              message={alert.message}
              onClose={closeAlert}
            />
          </DesktopModal>
        ) : null}
      </>
    </HeadingPanelWindow>
  );
}
