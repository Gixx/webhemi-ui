import {
  useCallback,
  useEffect,
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
  RoleFormDialog,
  type RoleFormSavePayload,
} from './RoleFormDialog';

export type RolesWindowRole = {
  id: number;
  name: string;
  label: string;
  description: string;
  protected: boolean;
  permissionIds: number[];
  permissionCount: number;
};

export type RolesWindowPermissionOption = {
  id: number;
  name: string;
  label: string;
};

export type RolesWindowProps = {
  roles?: RolesWindowRole[];
  /** Permission checklist options for the role form. */
  permissions?: RolesWindowPermissionOption[];
  /**
   * Prefer selecting this role once it appears in `roles` (deep link `?id=`).
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
  onSave?: (payload: RoleFormSavePayload) => void;
  onDelete?: (role: RolesWindowRole) => void;
  /** Opens Permissions window from the role form Add… button. */
  onAddPermission?: () => void;
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
      roleId?: number;
      name: string;
      label: string;
      description: string;
      permissionIds: number[];
      title?: string;
    };

type AlertState = { title: string; message: string } | null;
type ConfirmDeleteState = { role: RolesWindowRole } | null;

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
 * Roles admin window: list + New/Edit/Delete/Cancel.
 * Protected system roles (Admin, Site Admin) cannot be edited or deleted.
 */
export function RolesWindow({
  roles = [],
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
  onAddPermission,
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
  width = 640,
  tableMinHeight,
}: RolesWindowProps) {
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
    if (roles.some((row) => row.id === preferSelectedId)) {
      setSelectedId(preferSelectedId);
      appliedPreferIdRef.current = preferSelectedId;
    }
  }, [preferSelectedId, roles]);

  useEffect(() => {
    if (error) {
      showErrorAlert(error);
    }
  }, [error, showErrorAlert]);

  useEffect(() => {
    const message = formatSaveErrors(formError, fieldErrors);
    if (message) {
      setShowFormErrors(true);
      showErrorAlert(message);
    }
  }, [formError, fieldErrors, showErrorAlert]);

  useEffect(() => {
    if (wasSavingRef.current && !saving && form.open && !formError) {
      const hasFieldError =
        Boolean(fieldErrors?.name) ||
        Boolean(fieldErrors?.label) ||
        Boolean(fieldErrors?.description);
      if (!hasFieldError) {
        closeForm();
      }
    }
    wasSavingRef.current = saving;
  }, [saving, form.open, formError, fieldErrors]);

  const selected = roles.find((row) => row.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const selectedProtected = Boolean(selected?.protected);
  const busy = loading || saving || deleting;
  const canSave = Boolean(onSave);

  const selectRole = (id: number) => {
    onClearStatusMessage?.();
    setSelectedId(id);
  };

  const openNew = () => {
    if (!canEdit || !onSave) {
      return;
    }
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      name: '',
      label: '',
      description: '',
      permissionIds: [],
    });
  };

  const openEdit = (role: RolesWindowRole | null = selected) => {
    if (!canEdit || !onSave || !role || role.protected) {
      return;
    }
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'edit',
      roleId: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      permissionIds: [...role.permissionIds],
    });
  };

  const handleDelete = () => {
    if (!canEdit || !onDelete || !selected || selected.protected) {
      return;
    }
    setConfirmDelete({ role: selected });
    if (confirmSoundKeyRef.current !== String(selected.id)) {
      confirmSoundKeyRef.current = String(selected.id);
      playAdminSound('chord', errorSoundUrl);
    }
  };

  const confirmDeleteRole = () => {
    if (!confirmDelete || !onDelete) {
      return;
    }
    const role = confirmDelete.role;
    closeDeleteConfirm();
    onDelete(role);
  };

  const handleFormSave = (payload: RoleFormSavePayload) => {
    onSave?.(payload);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  const statusLeft = loading
    ? 'Loading…'
    : `${roles.length} role${roles.length === 1 ? '' : 's'}`;
  const statusMid =
    statusMessage ??
    (selected
      ? selected.label
      : canEdit
        ? 'Select a role, or choose New.'
        : '');

  return (
    <HeadingPanelWindow
      className={cn('roles-window', className)}
      style={{ width, minHeight: 420, ...style }}
      inactive={inactive}
      resizable={resizable}
      title="Roles"
      titleIcon="roles"
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
          System roles are locked. Custom roles may attach permissions.
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
              disabled={busy || !hasSelection || selectedProtected || !canSave}
              onClick={() => openEdit()}
            >
              Edit
            </Button>
            <Button
              type="button"
              accessKey="d"
              disabled={busy || !hasSelection || selectedProtected || !onDelete}
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
          {loading && roles.length === 0 ? (
            <p style={{ margin: 8 }}>Loading roles…</p>
          ) : roles.length === 0 ? (
            <p style={{ margin: 8 }}>No roles yet.</p>
          ) : (
            <Table aria-label="Roles">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Label</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Protected</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    highlighted={selectedId === role.id}
                    onClick={() => selectRole(role.id)}
                    onDoubleClick={() => openEdit(role)}
                  >
                    <td>{role.name}</td>
                    <td>{role.label}</td>
                    <td>
                      {role.description
                        ? truncateWithEllipsis(role.description)
                        : '—'}
                    </td>
                    <td>{role.permissionCount}</td>
                    <td>{role.protected ? 'Yes' : 'No'}</td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </SunkenPanel>

        {form.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <RoleFormDialog
              key={`${form.mode}-${form.roleId ?? 'new'}`}
              mode={form.mode}
              initial={{
                roleId: form.roleId,
                name: form.name,
                label: form.label,
                description: form.description,
                permissionIds: form.permissionIds,
                title: form.title,
              }}
              permissions={permissions}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={handleFormSave}
              onError={showErrorAlert}
              onClose={closeForm}
              onAddPermission={onAddPermission}
            />
          </DesktopModal>
        ) : null}

        {confirmDelete ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="question"
              title="Confirm"
              message={`Delete role “${confirmDelete.role.name}”? This cannot be undone.`}
              onClose={closeDeleteConfirm}
              onConfirm={confirmDeleteRole}
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
