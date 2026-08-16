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
  GroupBox,
  SunkenPanel,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableRow,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { DesktopModal } from '../../bricks/DesktopModal';
import { HeadingPanelWindow } from '../../bricks/HeadingPanelWindow';
import { MessageDialog } from '../../bricks/MessageDialog';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import type { AdminApiUserCapabilities } from '../../api';
import {
  UserFormDialog,
  type UserFormSavePayload,
  type UserFormRoleOption,
  type UserFormSiteOption,
} from './UserFormDialog';
import {
  SetPasswordDialog,
  type SetPasswordMode,
  type SetPasswordSavePayload,
} from './SetPasswordDialog';

export type UsersWindowUser = {
  id: number;
  email: string;
  displayName?: string | null;
  telephone?: string | null;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  roleIds: number[];
  roles: { id: number; name: string; label: string }[];
  siteAssignments: {
    id: number;
    siteId: number;
    siteName: string;
    roleId: number;
    roleName: string;
    roleLabel: string;
  }[];
  roleCount: number;
  siteAssignmentCount: number;
};

const DEFAULT_CAPABILITIES: AdminApiUserCapabilities = {
  listUsers: false,
  viewUser: false,
  createUser: false,
  editUser: false,
  deleteUser: false,
};

export type UsersWindowProps = {
  users?: UsersWindowUser[];
  roles?: UserFormRoleOption[];
  sites?: UserFormSiteOption[];
  preferSelectedId?: number | null;
  /** Signed-in user id (self sorting / password mode). */
  currentUserId?: number | null;
  capabilities?: AdminApiUserCapabilities;
  /** @deprecated Prefer capabilities.editUser */
  canEdit?: boolean;
  loading?: boolean;
  error?: string | null;
  fieldErrors?: Partial<
    Record<
      | 'email'
      | 'password'
      | 'displayName'
      | 'telephone'
      | 'address'
      | 'zip'
      | 'city'
      | 'country'
      | 'roleIds'
      | 'siteAssignments',
      string
    >
  >;
  formError?: string | null;
  passwordFieldErrors?: Partial<
    Record<'currentPassword' | 'password' | 'confirmPassword', string>
  >;
  passwordFormError?: string | null;
  /** Kept for AdminDesktop flash helpers; Users window has no status bar. */
  statusMessage?: string | null;
  onClearStatusMessage?: () => void;
  saving?: boolean;
  deleting?: boolean;
  settingPassword?: boolean;
  onSave?: (payload: UserFormSavePayload) => void;
  onDelete?: (user: UsersWindowUser) => void;
  onSetPassword?: (payload: SetPasswordSavePayload) => void;
  onAddRole?: () => void;
  /** Opens My Account when editing self from Change Settings. */
  onOpenMyAccount?: () => void;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
  onAlertClose?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
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
      readOnly: boolean;
      isSelf: boolean;
      userId?: number;
      email: string;
      password: string;
      displayName: string;
      telephone: string;
      address: string;
      zip: string;
      city: string;
      country: string;
      roleIds: number[];
      siteAssignments: { siteId: number; roleId: number }[];
      title?: string;
    };

type PasswordState =
  | { open: false }
  | { open: true; userId: number; email: string; mode: SetPasswordMode };

type AlertState = { title: string; message: string } | null;
type ConfirmDeleteState = { user: UsersWindowUser } | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors:
    | Partial<
        Record<
          | 'email'
          | 'password'
          | 'displayName'
          | 'telephone'
          | 'address'
          | 'zip'
          | 'city'
          | 'country'
          | 'roleIds'
          | 'siteAssignments',
          string
        >
      >
    | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.email,
    fieldErrors?.password,
    fieldErrors?.displayName,
    fieldErrors?.telephone,
    fieldErrors?.address,
    fieldErrors?.zip,
    fieldErrors?.city,
    fieldErrors?.country,
    fieldErrors?.roleIds,
    fieldErrors?.siteAssignments,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

function formatPasswordErrors(
  formError: string | null | undefined,
  fieldErrors:
    | Partial<Record<'currentPassword' | 'password' | 'confirmPassword', string>>
    | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.currentPassword,
    fieldErrors?.password,
    fieldErrors?.confirmPassword,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Users window — Win9x User Settings layout (fixed size, not resizable).
 */
export function UsersWindow({
  users = [],
  roles = [],
  sites = [],
  preferSelectedId = null,
  currentUserId = null,
  capabilities,
  canEdit = false,
  loading = false,
  error = null,
  fieldErrors,
  formError = null,
  passwordFieldErrors,
  passwordFormError = null,
  onClearStatusMessage,
  saving = false,
  deleting = false,
  settingPassword = false,
  onSave,
  onDelete,
  onSetPassword,
  onAddRole,
  onOpenMyAccount,
  errorSoundUrl,
  dingSoundUrl,
  onAlertClose,
  onCancel,
  onClose,
  onMinimize,
  onActivate,
  inactive = false,
  className,
  style,
  width = 480,
  tableMinHeight,
}: UsersWindowProps) {
  const caps: AdminApiUserCapabilities = capabilities ?? {
    ...DEFAULT_CAPABILITIES,
    createUser: canEdit,
    editUser: canEdit,
    deleteUser: canEdit,
    viewUser: canEdit,
    listUsers: canEdit,
  };

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ open: false });
  const [passwordDialog, setPasswordDialog] = useState<PasswordState>({
    open: false,
  });
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  const wasSavingRef = useRef(false);
  const wasSettingPasswordRef = useRef(false);
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

  const closePasswordDialog = () => {
    setPasswordDialog({ open: false });
    setShowPasswordErrors(false);
  };

  useEffect(() => {
    if (preferSelectedId == null) {
      appliedPreferIdRef.current = null;
      return;
    }
    if (appliedPreferIdRef.current === preferSelectedId) {
      return;
    }
    if (users.some((row) => row.id === preferSelectedId)) {
      setSelectedId(preferSelectedId);
      appliedPreferIdRef.current = preferSelectedId;
    }
  }, [preferSelectedId, users]);

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
    const message = formatPasswordErrors(passwordFormError, passwordFieldErrors);
    if (message) {
      setShowPasswordErrors(true);
      showErrorAlert(message);
    }
  }, [passwordFormError, passwordFieldErrors, showErrorAlert]);

  useEffect(() => {
    if (wasSavingRef.current && !saving && form.open && !formError) {
      const hasFieldError =
        Boolean(fieldErrors?.email) ||
        Boolean(fieldErrors?.password) ||
        Boolean(fieldErrors?.roleIds) ||
        Boolean(fieldErrors?.siteAssignments);
      if (!hasFieldError) {
        closeForm();
      }
    }
    wasSavingRef.current = saving;
  }, [saving, form.open, formError, fieldErrors]);

  useEffect(() => {
    if (
      wasSettingPasswordRef.current &&
      !settingPassword &&
      passwordDialog.open &&
      !passwordFormError
    ) {
      const hasFieldError =
        Boolean(passwordFieldErrors?.currentPassword) ||
        Boolean(passwordFieldErrors?.password) ||
        Boolean(passwordFieldErrors?.confirmPassword);
      if (!hasFieldError) {
        closePasswordDialog();
      }
    }
    wasSettingPasswordRef.current = settingPassword;
  }, [
    settingPassword,
    passwordDialog.open,
    passwordFormError,
    passwordFieldErrors,
  ]);

  const selected = users.find((row) => row.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const busy = loading || saving || deleting || settingPassword;
  const isSelf =
    selected != null &&
    currentUserId != null &&
    selected.id === currentUserId;
  const canCreate = caps.createUser && Boolean(onSave);
  const canDeleteSelected =
    caps.deleteUser &&
    Boolean(onDelete) &&
    hasSelection &&
    !isSelf;
  const canOpenSettings =
    hasSelection &&
    (isSelf ? caps.editUser : caps.editUser || caps.viewUser);
  const settingsReadOnly =
    hasSelection && !isSelf && !caps.editUser && caps.viewUser;
  const canSetPasswordSelected =
    hasSelection &&
    Boolean(onSetPassword) &&
    (isSelf || caps.editUser);
  const showManageButtons = canCreate || caps.deleteUser;
  const settingsLegend = selected
    ? `Settings for ${selected.email}`
    : 'Settings';
  const listHeight = tableMinHeight ?? 180;

  const selectUser = (id: number) => {
    onClearStatusMessage?.();
    setSelectedId(id);
  };

  const openNew = () => {
    if (!canCreate) {
      return;
    }
    const guestRole = roles.find((row) => row.name === 'ROLE_GUEST');
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      readOnly: false,
      isSelf: false,
      email: '',
      password: '',
      displayName: '',
      telephone: '',
      address: '',
      zip: '',
      city: '',
      country: '',
      roleIds: guestRole ? [guestRole.id] : [],
      siteAssignments: [],
      title: 'New User',
    });
  };

  const openChangeSettings = (user: UsersWindowUser | null = selected) => {
    if (!user) {
      return;
    }
    const self = currentUserId != null && user.id === currentUserId;
    if (self) {
      if (!caps.editUser) {
        return;
      }
    } else if (!caps.editUser && !caps.viewUser) {
      return;
    }
    const readOnly = !caps.editUser;
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'edit',
      readOnly,
      isSelf: self,
      userId: user.id,
      email: user.email,
      password: '',
      displayName: user.displayName ?? '',
      telephone: user.telephone ?? '',
      address: user.address ?? '',
      zip: user.zip ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
      roleIds: [...user.roleIds],
      siteAssignments: user.siteAssignments.map((row) => ({
        siteId: row.siteId,
        roleId: row.roleId,
      })),
      title: readOnly
        ? `User Settings — ${user.displayName?.trim() || user.email}`
        : `Change Settings — ${user.displayName?.trim() || user.email}`,
    });
  };

  const openSetPassword = (user: UsersWindowUser | null = selected) => {
    if (!onSetPassword || !user) {
      return;
    }
    const self =
      currentUserId != null && user.id === currentUserId;
    if (!self && !caps.editUser) {
      return;
    }
    setShowPasswordErrors(false);
    setPasswordDialog({
      open: true,
      userId: user.id,
      email: user.email,
      mode: self ? 'self' : 'other',
    });
  };

  const handleDelete = () => {
    if (!canDeleteSelected || !selected) {
      return;
    }
    setConfirmDelete({ user: selected });
    if (confirmSoundKeyRef.current !== String(selected.id)) {
      confirmSoundKeyRef.current = String(selected.id);
      playAdminSound('chord', errorSoundUrl);
    }
  };

  const confirmDeleteUser = () => {
    if (!confirmDelete || !onDelete) {
      return;
    }
    const user = confirmDelete.user;
    closeDeleteConfirm();
    onDelete(user);
  };

  const handleCancel = () => {
    (onCancel ?? onClose)();
  };

  return (
    <HeadingPanelWindow
      className={cn('users-window', className)}
      style={{ width, minWidth: 480, ...style }}
      inactive={inactive}
      resizable={false}
      title="Users"
      titleIcon="users"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" onClick={onMinimize} />
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
      onMouseDown={onActivate}
      actions={
        <FieldRow className="justify-end">
          <Button type="button" isDefault accessKey="c" onClick={onClose}>
            Close
          </Button>
          <Button type="button" accessKey="a" disabled onClick={handleCancel}>
            Cancel
          </Button>
        </FieldRow>
      }
    >
      <>
        <TabList>
          <Tab
            selected
            href="#users-user-list"
            onClick={(event) => event.preventDefault()}
          >
            User List
          </Tab>
        </TabList>
        <TabPanel>
          <WindowBody>
            <FieldRow className="info-icon-row" style={{ alignItems: 'flex-start' }}>
              <span className="info-icon user-list" aria-hidden />
              <p style={{ margin: 0, flex: '1 1 auto' }}>
                The list below shows all the users set up for this computer.
                Each user can be assigned global roles and per-site roles.
              </p>
            </FieldRow>

            <p style={{ margin: '20px 0 0' }}>Users</p>

            <FieldRow style={{ alignItems: 'stretch', marginTop: 4 }}>
              <SunkenPanel
                scrollable
                tone="white"
                style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  height: listHeight,
                  boxSizing: 'border-box',
                }}
              >
                {loading && users.length === 0 ? (
                  <p style={{ margin: 8 }}>Loading users…</p>
                ) : users.length === 0 ? (
                  <p style={{ margin: 8 }}>No users yet.</p>
                ) : (
                  <Table aria-label="Users" className="users-list-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const name =
                          user.displayName?.trim() || user.email;
                        const roleNames = user.roles
                          .map((role) => role.name)
                          .join(', ');
                        return (
                          <TableRow
                            key={user.id}
                            highlighted={selectedId === user.id}
                            onClick={() => selectUser(user.id)}
                            onDoubleClick={() => openChangeSettings(user)}
                          >
                            <td title={name}>{name}</td>
                            <td title={roleNames}>{roleNames || '—'}</td>
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </SunkenPanel>

              {showManageButtons ? (
                <div
                  className="stack"
                  style={{ flex: '0 0 auto', width: '7.5em', gap: 8 }}
                >
                  {caps.createUser ? (
                    <Button
                      type="button"
                      accessKey="n"
                      disabled={busy || !canCreate}
                      onClick={openNew}
                      style={{ width: '100%' }}
                    >
                      New User…
                    </Button>
                  ) : null}
                  {caps.deleteUser ? (
                    <Button
                      type="button"
                      accessKey="d"
                      disabled={busy || !canDeleteSelected}
                      onClick={handleDelete}
                      style={{ width: '100%' }}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </FieldRow>

            <GroupBox legend={settingsLegend} style={{ marginTop: 20 }}>
              <FieldRow className="info-icon-row" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                <span className="info-icon change-password" aria-hidden />
                <p style={{ margin: 0, flex: '1 1 auto' }}>
                  Use these buttons to specify a password or to change a
                  user&apos;s roles and site assignments.
                </p>
              </FieldRow>
              <FieldRow>
                <Button
                  type="button"
                  accessKey="p"
                  disabled={busy || !canSetPasswordSelected}
                  onClick={() => openSetPassword()}
                >
                  Set Password…
                </Button>
                <Button
                  type="button"
                  accessKey="s"
                  disabled={busy || !canOpenSettings}
                  onClick={() => openChangeSettings()}
                >
                  {settingsReadOnly ? 'View Settings…' : 'Change Settings…'}
                </Button>
              </FieldRow>
            </GroupBox>
          </WindowBody>
        </TabPanel>

        {form.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <UserFormDialog
              key={`${form.mode}-${form.userId ?? 'new'}-${form.readOnly}-${form.isSelf}`}
              mode={form.mode}
              readOnly={form.readOnly}
              isSelf={form.isSelf}
              initial={{
                userId: form.userId,
                email: form.email,
                password: form.password,
                displayName: form.displayName,
                telephone: form.telephone,
                address: form.address,
                zip: form.zip,
                city: form.city,
                country: form.country,
                roleIds: form.roleIds,
                siteAssignments: form.siteAssignments,
                title: form.title,
              }}
              roles={roles}
              sites={sites}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={(payload) => onSave?.(payload)}
              onError={showErrorAlert}
              onClose={closeForm}
              onOpenMyAccount={
                form.isSelf && onOpenMyAccount
                  ? () => {
                      closeForm();
                      onOpenMyAccount();
                    }
                  : undefined
              }
              onAddRole={form.readOnly ? undefined : onAddRole}
            />
          </DesktopModal>
        ) : null}

        {passwordDialog.open ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <SetPasswordDialog
              key={`${passwordDialog.userId}-${passwordDialog.mode}`}
              userId={passwordDialog.userId}
              userEmail={passwordDialog.email}
              mode={passwordDialog.mode}
              fieldErrors={
                showPasswordErrors ? passwordFieldErrors : undefined
              }
              saving={settingPassword}
              onSave={(payload) => onSetPassword?.(payload)}
              onError={showErrorAlert}
              onClose={closePasswordDialog}
            />
          </DesktopModal>
        ) : null}

        {confirmDelete ? (
          <DesktopModal dingSoundUrl={dingSoundUrl}>
            <MessageDialog
              type="question"
              title="Confirm"
              message={`Delete user “${confirmDelete.user.email}”? This cannot be undone.`}
              onClose={closeDeleteConfirm}
              onConfirm={confirmDeleteUser}
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
