import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
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
  status: string;
  active: boolean;
};

export type HostsWindowProps = {
  hosts?: HostsWindowHost[];
  /** Sites for the New/Edit Site select. */
  sites?: HostFormSiteOption[];
  canEdit?: boolean;
  loading?: boolean;
  error?: string | null;
  fieldErrors?: Partial<Record<'host' | 'siteId' | 'surface' | 'active', string>>;
  formError?: string | null;
  saving?: boolean;
  onSave?: (payload: HostFormSavePayload) => void;
  onDelete?: (host: HostsWindowHost) => void;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
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
      active: boolean;
      title?: string;
    };

type AlertState = { title: string; message: string } | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors:
    | Partial<Record<'host' | 'siteId' | 'surface' | 'active', string>>
    | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.host,
    fieldErrors?.siteId,
    fieldErrors?.surface,
    fieldErrors?.active,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Hosts admin window: list + New/Edit/Delete/Cancel.
 */
export function HostsWindow({
  hosts = [],
  sites = [],
  canEdit = false,
  loading = false,
  error = null,
  fieldErrors,
  formError = null,
  saving = false,
  onSave,
  onDelete,
  errorSoundUrl,
  dingSoundUrl,
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
  const wasSavingRef = useRef(false);
  const alertSoundKeyRef = useRef<string | null>(null);

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
  }, []);

  useEffect(() => {
    if (selectedId != null && !hosts.some((row) => row.id === selectedId)) {
      setSelectedId(null);
    }
  }, [hosts, selectedId]);

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

  useEffect(() => {
    if (!form.open || !showFormErrors) {
      return;
    }
    const message = formatSaveErrors(formError, fieldErrors);
    if (!message) {
      return;
    }
    showErrorAlert(message);
  }, [formError, fieldErrors, form.open, showFormErrors, showErrorAlert]);

  const busy = loading || saving;
  const selected = hosts.find((row) => row.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const canSave = Boolean(onSave);

  const openNew = () => {
    if (!canEdit || busy) {
      return;
    }
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      host: '',
      siteId: null,
      surface: 'site',
      active: true,
    });
  };

  const openEdit = (row?: HostsWindowHost) => {
    const target = row ?? selected;
    if (!canEdit || !target || busy || !canSave) {
      return;
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
      active: target.active,
      title: target.host,
    });
  };

  const closeForm = () => {
    setShowFormErrors(false);
    setForm({ open: false });
  };

  const handleFormSave = (payload: HostFormSavePayload) => {
    setShowFormErrors(true);
    onSave?.(payload);
  };

  const handleDelete = () => {
    if (!canEdit || !selected || !onDelete || busy) {
      return;
    }
    onDelete(selected);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  const statusLeft = loading
    ? 'Loading…'
    : `${hosts.length} host${hosts.length === 1 ? '' : 's'}`;
  const statusMid =
    error ??
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
              accessKey="d"
              disabled={busy || !hasSelection || !onDelete}
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
                  <th>Status</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((row) => (
                  <TableRow
                    key={row.id}
                    highlighted={selectedId === row.id}
                    onClick={() =>
                      setSelectedId((current) => (current === row.id ? null : row.id))
                    }
                    onDoubleClick={() => openEdit(row)}
                  >
                    <td>{row.host}</td>
                    <td>{row.siteName?.trim() ? row.siteName : '—'}</td>
                    <td>{row.surface}</td>
                    <td>{row.status}</td>
                    <td>{row.active ? 'Yes' : 'No'}</td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </SunkenPanel>

        {error && !loading ? (
          <p role="alert" style={{ marginTop: 10, marginBottom: 0, color: '#800000' }}>
            {error}
          </p>
        ) : null}

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
                active: form.active,
                title: form.title,
              }}
              sites={sites}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={handleFormSave}
              onError={showErrorAlert}
              onClose={closeForm}
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
