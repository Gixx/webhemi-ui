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
import {
  ACCESS_MODE_RESET_WARNING,
  DELETE_ADMIN_HOST_ACCESS_RESET_WARNING,
} from '../../lib/accessModeResetWarning';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import {
  HostFormDialog,
  type HostFormSavePayload,
  type HostFormSiteOption,
  type HostFormSurface,
} from './HostFormDialog';

export type HostsWindowHost = {
  id: number;
  host: string;
  siteId: number | null;
  siteSlug: string | null;
  siteName: string | null;
  surface: HostFormSurface;
  verification: 'pending' | 'verified';
  enabled: boolean;
  /** Primary www (site-surface) host — not deletable/disableable. */
  protected?: boolean;
};

export type HostsWindowProps = {
  hosts?: HostsWindowHost[];
  /** Sites for the New/Edit Site select. */
  sites?: HostFormSiteOption[];
  /**
   * Prefer selecting this host once it appears in `hosts` (deep link `?id=`).
   * Applied once per id; user can change selection afterward.
   */
  preferSelectedId?: number | null;
  /**
   * Configured install access mode (`access.admin`).
   * `null` = unknown (e.g. settings not loaded) — treat admin-surface delete as risky.
   * When `domain`, deleting the admin-surface host shows an escalated confirm
   * (path fallback + re-login).
   */
  adminAccess?: 'path' | 'domain' | null;
  canEdit?: boolean;
  loading?: boolean;
  /** Window-level load error — Error MessageDialog + chord. */
  error?: string | null;
  fieldErrors?: Partial<Record<'host' | 'siteId' | 'surface' | 'enabled', string>>;
  /** Save error message (MessageDialog + chord). */
  formError?: string | null;
  /** Transient success / status copy for the middle status-bar field. */
  statusMessage?: string | null;
  /** Called when the window clears a success message (e.g. selection change). */
  onClearStatusMessage?: () => void;
  saving?: boolean;
  /** True while delete request is in flight. */
  deleting?: boolean;
  /** True while ownership verify request is in flight. */
  verifying?: boolean;
  onSave?: (payload: HostFormSavePayload) => void;
  /** Run ownership probe for a pending host (`host.verify`). */
  onVerify?: (host: HostsWindowHost) => void;
  onDelete?: (host: HostsWindowHost) => void;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
  /** Called when the Error MessageDialog is dismissed (e.g. redirect after session expiry). */
  onAlertClose?: () => void;
  /** Clear sticky save/API form errors (open/close form, dismiss alert). */
  onClearFormError?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
  maximized?: boolean;
  resizable?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
  tableMinHeight?: number;
};

type FormState =
  | { open: false }
  | {
      open: true;
      mode: 'new' | 'edit';
      hostId?: number;
      host: string;
      siteId: number | null;
      surface: HostFormSurface;
      enabled: boolean;
      verification?: 'pending' | 'verified';
      protected?: boolean;
      title?: string;
    };

type AlertState = { title: string; message: string } | null;
type ConfirmDeleteState = {
  host: HostsWindowHost;
  resetsAccessMode: boolean;
} | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors:
    | Partial<Record<'host' | 'siteId' | 'surface' | 'enabled', string>>
    | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.host,
    fieldErrors?.siteId,
    fieldErrors?.surface,
    fieldErrors?.enabled,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Hosts admin window: list + New/Edit/Verify/Delete/Cancel.
 */
export function HostsWindow({
  hosts = [],
  sites = [],
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
  verifying = false,
  onSave,
  onVerify,
  onDelete,
  errorSoundUrl,
  dingSoundUrl,
  onAlertClose,
  onClearFormError,
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
  width = 640,
  tableMinHeight,
}: HostsWindowProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ open: false });
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  const [pendingAccessReset, setPendingAccessReset] =
    useState<HostFormSavePayload | null>(null);
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
    onClearFormError?.();
    onAlertClose?.();
  }, [onAlertClose, onClearFormError]);

  const openDeleteConfirm = useCallback(
    (host: HostsWindowHost) => {
      const resetsAccessMode =
        host.surface === 'admin' && adminAccess !== 'path';
      const key = `delete\0${host.id}\0${resetsAccessMode ? 'reset' : 'plain'}`;
      setConfirmDelete({ host, resetsAccessMode });
      if (confirmSoundKeyRef.current === key) {
        return;
      }
      confirmSoundKeyRef.current = key;
      playAdminSound(resetsAccessMode ? 'chord' : 'ding', dingSoundUrl);
    },
    [adminAccess, dingSoundUrl],
  );

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDelete(null);
    confirmSoundKeyRef.current = null;
  }, []);

  const openAccessResetConfirm = useCallback(
    (payload: HostFormSavePayload) => {
      const key = `access-reset\0${payload.hostId ?? 'new'}\0${payload.surface}\0${payload.enabled}\0${payload.siteId}`;
      setPendingAccessReset(payload);
      if (accessResetSoundKeyRef.current === key) {
        return;
      }
      accessResetSoundKeyRef.current = key;
      playAdminSound('chord', errorSoundUrl);
    },
    [errorSoundUrl],
  );

  const closeAccessResetConfirm = useCallback(() => {
    setPendingAccessReset(null);
    accessResetSoundKeyRef.current = null;
  }, []);

  const confirmAccessResetSave = useCallback(() => {
    if (!pendingAccessReset) {
      return;
    }
    const payload = pendingAccessReset;
    closeAccessResetConfirm();
    setShowFormErrors(true);
    onSave?.(payload);
  }, [pendingAccessReset, closeAccessResetConfirm, onSave]);

  useEffect(() => {
    if (preferSelectedId == null) {
      appliedPreferIdRef.current = null;
      return;
    }
    if (appliedPreferIdRef.current === preferSelectedId) {
      return;
    }
    if (hosts.some((row) => row.id === preferSelectedId)) {
      setSelectedId(preferSelectedId);
      appliedPreferIdRef.current = preferSelectedId;
    }
  }, [preferSelectedId, hosts]);

  useEffect(() => {
    if (selectedId != null && !hosts.some((row) => row.id === selectedId)) {
      setSelectedId(null);
    }
  }, [hosts, selectedId]);

  useEffect(() => {
    if (
      confirmDelete != null &&
      !hosts.some((row) => row.id === confirmDelete.host.id)
    ) {
      closeDeleteConfirm();
    }
  }, [hosts, confirmDelete, closeDeleteConfirm]);

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

  // Save / API form errors (form open or closed).
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

  const busy = loading || saving || verifying || deleting;
  const selected = hosts.find((row) => row.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const canSave = Boolean(onSave);
  const canVerifySelected =
    Boolean(onVerify) && selected?.verification === 'pending' && !busy;

  const selectHost = (id: number) => {
    onClearStatusMessage?.();
    onClearFormError?.();
    setSelectedId((current) => (current === id ? null : id));
  };

  const openNew = () => {
    if (!canEdit || busy) {
      return;
    }
    onClearStatusMessage?.();
    onClearFormError?.();
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      host: '',
      siteId: null,
      surface: 'site',
      enabled: true,
    });
  };

  const openEdit = (row?: HostsWindowHost) => {
    const target = row ?? selected;
    if (!canEdit || !target || busy || !canSave) {
      return;
    }
    onClearFormError?.();
    if (selectedId !== target.id) {
      onClearStatusMessage?.();
    }
    setSelectedId(target.id);
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'edit',
      hostId: target.id,
      host: target.host,
      siteId: target.siteId,
      surface: target.surface,
      enabled: target.enabled,
      verification: target.verification,
      protected: target.protected,
      title: target.host,
    });
  };

  const closeForm = () => {
    setShowFormErrors(false);
    setForm({ open: false });
    closeAccessResetConfirm();
    onClearFormError?.();
  };

  const handleFormSave = (payload: HostFormSavePayload) => {
    setShowFormErrors(true);
    onSave?.(payload);
  };

  const handleDelete = () => {
    if (!canEdit || !selected || !onDelete || busy || selected.protected) {
      return;
    }
    openDeleteConfirm(selected);
  };

  const confirmDeleteHost = () => {
    if (!confirmDelete || !onDelete) {
      return;
    }
    const target = confirmDelete.host;
    closeDeleteConfirm();
    onDelete(target);
  };

  const handleVerify = () => {
    if (!canVerifySelected || !selected || !onVerify) {
      return;
    }
    onClearStatusMessage?.();
    onVerify(selected);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  const statusLeft = loading
    ? 'Loading…'
    : `${hosts.length} host${hosts.length === 1 ? '' : 's'}`;
  const statusMid =
    statusMessage ??
    (selected
      ? selected.host
      : canEdit
        ? 'Select a host, or choose New.'
        : '');

  return (
    <HeadingPanelWindow
      className={cn('hosts-window', className)}
      style={{ width, minHeight: 420, ...style }}
      inactive={inactive}
      resizable={resizable}
      title="Hosts"
      titleIcon="hosts"
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
          Domain names bound to sites (admin, site, or API surfaces).
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
              accessKey="v"
              disabled={!canVerifySelected}
              title={
                selected?.verification === 'pending'
                  ? 'Verify hostname ownership'
                  : 'Select a pending host to verify'
              }
              onClick={handleVerify}
            >
              Verify
            </Button>
            <Button
              type="button"
              accessKey="d"
              disabled={
                busy || !hasSelection || !onDelete || Boolean(selected?.protected)
              }
              title={
                selected?.protected
                  ? 'Protected system host cannot be deleted'
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
          {loading && hosts.length === 0 ? (
            <p style={{ margin: 8 }}>Loading hosts…</p>
          ) : hosts.length === 0 ? (
            <p style={{ margin: 8 }}>No hosts yet.</p>
          ) : (
            <Table aria-label="Hosts">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>Site</th>
                  <th>Surface</th>
                  <th>Verification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((row) => (
                  <TableRow
                    key={row.id}
                    highlighted={selectedId === row.id}
                    onClick={() => selectHost(row.id)}
                    onDoubleClick={() => openEdit(row)}
                  >
                    <td>{row.host}</td>
                    <td>{row.siteName?.trim() ? row.siteName : '—'}</td>
                    <td>{row.surface}</td>
                    <td>{row.verification}</td>
                    <td>{row.enabled ? 'Enabled' : 'Disabled'}</td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </SunkenPanel>

        {form.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <HostFormDialog
              key={`${form.mode}-${form.hostId ?? 'new'}`}
              mode={form.mode}
              initial={{
                hostId: form.hostId,
                host: form.host,
                siteId: form.siteId,
                surface: form.surface,
                enabled: form.enabled,
                verification: form.verification,
                protected: form.protected,
                title: form.title,
              }}
              sites={sites}
              adminSurfaceHostId={
                hosts.find((row) => row.surface === 'admin')?.id ?? null
              }
              adminAccess={adminAccess}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={handleFormSave}
              onAccessModeResetConfirm={openAccessResetConfirm}
              onError={showErrorAlert}
              onClose={closeForm}
            />
          </DesktopModal>
        ) : null}

        {pendingAccessReset ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="warning"
              title="Warning"
              message={ACCESS_MODE_RESET_WARNING}
              confirmLabel="OK"
              cancelLabel="Cancel"
              onClose={closeAccessResetConfirm}
              onConfirm={confirmAccessResetSave}
            />
          </DesktopModal>
        ) : null}

        {confirmDelete ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type={confirmDelete.resetsAccessMode ? 'warning' : 'question'}
              title={confirmDelete.resetsAccessMode ? 'Warning' : 'Confirm'}
              message={
                confirmDelete.resetsAccessMode
                  ? `Delete host “${confirmDelete.host.host}”?\n\n${DELETE_ADMIN_HOST_ACCESS_RESET_WARNING}`
                  : `Delete host “${confirmDelete.host.host}”? This cannot be undone.`
              }
              onClose={closeDeleteConfirm}
              onConfirm={confirmDeleteHost}
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
