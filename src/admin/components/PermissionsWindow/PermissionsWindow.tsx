import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
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
import { truncateWithEllipsis } from '../../lib/truncateWithEllipsis';
import { cn } from '../../../lib/cn';
import {
  PermissionFormDialog,
  type PermissionFormSavePayload,
} from './PermissionFormDialog';

export type PermissionsWindowPermission = {
  id: number;
  name: string;
  label: string;
  description: string;
};

export type PermissionsWindowProps = {
  permissions?: PermissionsWindowPermission[];
  /**
   * Prefer selecting this permission once it appears in `permissions` (deep link `?id=`).
   * Applied once per id; user can change selection afterward.
   */
  preferSelectedId?: number | null;
  canEdit?: boolean;
  loading?: boolean;
  /** Window-level load error — Error MessageDialog + chord. */
  error?: string | null;
  /** Field errors from the last save attempt (MessageDialog + aria-invalid). */
  fieldErrors?: Partial<Record<'name' | 'label' | 'description', string>>;
  /** Save error message (MessageDialog + chord). */
  formError?: string | null;
  /** Transient success / status copy for the middle status-bar field. */
  statusMessage?: string | null;
  onClearStatusMessage?: () => void;
  saving?: boolean;
  deleting?: boolean;
  onSave?: (payload: PermissionFormSavePayload) => void;
  onDelete?: (permission: PermissionsWindowPermission) => void;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
  onAlertClose?: () => void;
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
      permissionId?: number;
      name: string;
      label: string;
      description: string;
      title?: string;
    };

type AlertState = { title: string; message: string } | null;
type ConfirmDeleteState = { permission: PermissionsWindowPermission } | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors: Partial<Record<'name' | 'label' | 'description', string>> | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.name,
    fieldErrors?.label,
    fieldErrors?.description,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Permissions admin window: list + New/Edit/Delete/Cancel.
 */
export function PermissionsWindow({
  permissions = [],
  preferSelectedId = null,
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
  onDelete,
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
}: PermissionsWindowProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ open: false });
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  const wasSavingRef = useRef(false);
  const alertSoundKeyRef = useRef<string | null>(null);
  const confirmSoundKeyRef = useRef<string | null>(null);
  const appliedPreferIdRef = useRef<number | null>(null);

  const showErrorAlert = useCallback(
    (message: string, title = 'Error') => {
      const key = `${title}\0${message}`;
      setAlert({ title, message });
      if (alertSoundKeyRef.current !== key) {
        alertSoundKeyRef.current = key;
        playAdminSound('chord', errorSoundUrl);
      }
    },
    [errorSoundUrl],
  );

  const closeAlert = useCallback(() => {
    setAlert(null);
    alertSoundKeyRef.current = null;
    onAlertClose?.();
  }, [onAlertClose]);

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDelete(null);
    confirmSoundKeyRef.current = null;
  }, []);

  const closeForm = () => {
    setForm({ open: false });
    setShowFormErrors(false);
  };

  useEffect(() => {
    if (preferSelectedId == null) {
      appliedPreferIdRef.current = null;
      return;
    }
    if (appliedPreferIdRef.current === preferSelectedId) {
      return;
    }
    if (permissions.some((row) => row.id === preferSelectedId)) {
      setSelectedId(preferSelectedId);
      appliedPreferIdRef.current = preferSelectedId;
    }
  }, [preferSelectedId, permissions]);

  useEffect(() => {
    if (selectedId != null && !permissions.some((row) => row.id === selectedId)) {
      setSelectedId(null);
    }
  }, [permissions, selectedId]);

  useEffect(() => {
    if (
      confirmDelete != null &&
      !permissions.some((row) => row.id === confirmDelete.permission.id)
    ) {
      closeDeleteConfirm();
    }
  }, [permissions, confirmDelete, closeDeleteConfirm]);

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

  useLayoutEffect(() => {
    if (!error || loading) {
      return;
    }
    showErrorAlert(error);
  }, [error, loading, showErrorAlert]);

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

  const busy = loading || saving || deleting;
  const selected = permissions.find((row) => row.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const canSave = Boolean(onSave);

  const selectPermission = (id: number) => {
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
      label: '',
      description: '',
    });
  };

  const openEdit = (permission?: PermissionsWindowPermission) => {
    const target = permission ?? selected;
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
      permissionId: target.id,
      name: target.name,
      label: target.label,
      description: target.description,
      title: target.name,
    });
  };

  const handleFormSave = (payload: PermissionFormSavePayload) => {
    if (!onSave) {
      return;
    }
    setShowFormErrors(true);
    onSave(payload);
  };

  const handleDelete = () => {
    if (!canEdit || !selected || !onDelete || busy) {
      return;
    }
    const key = `delete\0${selected.id}`;
    setConfirmDelete({ permission: selected });
    if (confirmSoundKeyRef.current !== key) {
      confirmSoundKeyRef.current = key;
      playAdminSound('chord', errorSoundUrl);
    }
  };

  const confirmDeletePermission = () => {
    if (!confirmDelete || !onDelete) {
      return;
    }
    const target = confirmDelete.permission;
    closeDeleteConfirm();
    onDelete(target);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  const statusLeft = loading
    ? 'Loading…'
    : `${permissions.length} permission${permissions.length === 1 ? '' : 's'}`;
  const statusMid =
    statusMessage ??
    (selected
      ? selected.label
      : canEdit
        ? 'Select a permission, or choose New.'
        : '');

  return (
    <HeadingPanelWindow
      className={cn('permissions-window', className)}
      style={{ width, minHeight: 420, ...style }}
      inactive={inactive}
      resizable={resizable}
      title="Permissions"
      titleIcon="permissions"
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
          Permission codes used by roles. Empty at seed — add rows for testing.
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
          {loading && permissions.length === 0 ? (
            <p style={{ margin: 8 }}>Loading permissions…</p>
          ) : permissions.length === 0 ? (
            <p style={{ margin: 8 }}>No permissions yet.</p>
          ) : (
            <Table aria-label="Permissions">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Label</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <TableRow
                    key={permission.id}
                    highlighted={selectedId === permission.id}
                    onClick={() => selectPermission(permission.id)}
                    onDoubleClick={() => openEdit(permission)}
                  >
                    <td>{permission.name}</td>
                    <td>{permission.label}</td>
                    <td>
                      {permission.description
                        ? truncateWithEllipsis(permission.description)
                        : '—'}
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </SunkenPanel>

        {form.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <PermissionFormDialog
              key={`${form.mode}-${form.permissionId ?? 'new'}`}
              mode={form.mode}
              initial={{
                permissionId: form.permissionId,
                name: form.name,
                label: form.label,
                description: form.description,
                title: form.title,
              }}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={handleFormSave}
              onError={showErrorAlert}
              onClose={closeForm}
            />
          </DesktopModal>
        ) : null}

        {confirmDelete ? (
          <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="question"
              title="Confirm"
              message={`Delete permission “${confirmDelete.permission.name}”? This cannot be undone.`}
              onClose={closeDeleteConfirm}
              onConfirm={confirmDeletePermission}
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
