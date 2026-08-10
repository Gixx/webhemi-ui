import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  FieldRow,
  Select,
  SunkenPanel,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableRow,
  TextArea,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type RoleFormMode = 'new' | 'edit';

export type RoleFormValues = {
  name: string;
  label: string;
  description: string;
  permissionIds: number[];
};

export type RoleFormSavePayload = RoleFormValues & {
  mode: RoleFormMode;
  roleId?: number;
};

export type RoleFormPermissionOption = {
  id: number;
  name: string;
  label: string;
};

export type RoleFormDialogProps = {
  mode: RoleFormMode;
  initial?: Partial<RoleFormValues> & {
    roleId?: number;
    title?: string;
  };
  /** Full permission catalog (assigned + available). */
  permissions?: RoleFormPermissionOption[];
  fieldErrors?: Partial<Record<'name' | 'label' | 'description' | 'permissionIds', string>>;
  saving?: boolean;
  onSave: (payload: RoleFormSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  /**
   * Opens Permissions window → New (optional).
   * When omitted, the Add button stays disabled.
   */
  onAddPermission?: () => void;
  className?: string;
};

type FormTab = 'general' | 'permissions';

const NAME_PATTERN = /^ROLE_[A-Z0-9]+(?:_[A-Z0-9]+)*$/;

/**
 * New / Edit Role modal: General + Permissions tabs (nested `.window` — not a shell window).
 * Permissions tab mirrors Site Hosts: assigned table + Assign dropdown + Remove.
 */
export function RoleFormDialog({
  mode,
  initial,
  permissions = [],
  fieldErrors,
  saving = false,
  onSave,
  onError,
  onClose,
  onAddPermission,
  className,
}: RoleFormDialogProps) {
  const nameId = useId();
  const labelId = useId();
  const descriptionId = useId();
  const assignSelectId = useId();
  const [tab, setTab] = useState<FormTab>('general');
  const [name, setName] = useState(initial?.name ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [permissionIds, setPermissionIds] = useState<number[]>(
    initial?.permissionIds ?? [],
  );
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(
    null,
  );
  const [assignPermissionId, setAssignPermissionId] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'name' | 'label', string>>
  >({});

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  useEffect(() => {
    if (
      selectedPermissionId != null &&
      !permissionIds.includes(selectedPermissionId)
    ) {
      setSelectedPermissionId(null);
    }
  }, [permissionIds, selectedPermissionId]);

  useEffect(() => {
    if (
      assignPermissionId != null &&
      permissionIds.includes(assignPermissionId)
    ) {
      setAssignPermissionId(null);
    }
  }, [permissionIds, assignPermissionId]);

  const mergedErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const title =
    initial?.title ??
    (mode === 'edit' ? `Edit Role — ${initial?.name ?? ''}` : 'New Role');

  const assignedPermissions = useMemo(
    () =>
      permissionIds
        .map((id) => permissions.find((row) => row.id === id))
        .filter((row): row is RoleFormPermissionOption => row != null),
    [permissionIds, permissions],
  );

  const assignablePermissions = useMemo(
    () => permissions.filter((row) => !permissionIds.includes(row.id)),
    [permissions, permissionIds],
  );

  const busy = saving;
  const canAssign =
    !busy && assignPermissionId != null && assignablePermissions.length > 0;
  const canRemove =
    !busy &&
    selectedPermissionId != null &&
    permissionIds.includes(selectedPermissionId);

  const validate = (): boolean => {
    const next: Partial<Record<'name' | 'label', string>> = {};
    const trimmedName = name.trim().toUpperCase();
    const trimmedLabel = label.trim();
    if (!trimmedName) {
      next.name = 'Name is required.';
    } else if (!NAME_PATTERN.test(trimmedName)) {
      next.name =
        'Name must look like ROLE_CUSTOM_NAME (uppercase letters, digits, underscores).';
    } else if (trimmedName === 'ROLE_ADMIN' || trimmedName === 'ROLE_SITE_ADMIN') {
      next.name = 'System role names are reserved.';
    }
    if (!trimmedLabel) {
      next.label = 'Label is required.';
    }
    setLocalErrors(next);
    if (Object.keys(next).length > 0) {
      setTab('general');
      onError?.(Object.values(next).join('\n'));
      return false;
    }
    return true;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving || !validate()) {
      return;
    }
    onSave({
      mode,
      roleId: initial?.roleId,
      name: name.trim().toUpperCase(),
      label: label.trim(),
      description: description.trim(),
      permissionIds: [...permissionIds],
    });
  };

  const handleAssign = () => {
    if (!canAssign || assignPermissionId == null) {
      return;
    }
    const id = assignPermissionId;
    setPermissionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAssignPermissionId(null);
    setSelectedPermissionId(id);
  };

  const handleRemove = () => {
    if (!canRemove || selectedPermissionId == null) {
      return;
    }
    const id = selectedPermissionId;
    setPermissionIds((prev) => prev.filter((row) => row !== id));
    setSelectedPermissionId(null);
  };

  return (
    <PaneWindowShell
      className={cn('role-form-dialog', className)}
      width={480}
      title={title}
      titleIcon="roles"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="role-form-dialog-form" onSubmit={handleSubmit} noValidate>
        <TabList>
          <Tab
            selected={tab === 'general'}
            href="#role-form-general"
            onClick={(event) => {
              event.preventDefault();
              setTab('general');
            }}
          >
            General
          </Tab>
          <Tab
            selected={tab === 'permissions'}
            href="#role-form-permissions"
            onClick={(event) => {
              event.preventDefault();
              setTab('permissions');
            }}
          >
            Permissions
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
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.name) || undefined}
                    disabled={busy}
                    autoFocus
                  />
                </FieldRow>
                <FieldRow>
                  <TextBox
                    id={labelId}
                    label="Label:"
                    accessKey="l"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.label) || undefined}
                    disabled={busy}
                  />
                </FieldRow>
                <FieldRow>
                  <TextArea
                    id={descriptionId}
                    label="Description:"
                    accessKey="d"
                    rows={4}
                    resizable="vertical"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.description) || undefined}
                    disabled={busy}
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0, marginBottom: 8 }}>
                  Assigned permissions below. Assign from the catalog; Remove
                  detaches without deleting the permission.
                </p>
                <SunkenPanel
                  scrollable
                  tone="white"
                  className="role-form-permission-list"
                >
                  {assignedPermissions.length === 0 ? (
                    <p style={{ margin: 8 }}>No permissions assigned.</p>
                  ) : (
                    <Table aria-label="Assigned permissions">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedPermissions.map((row) => (
                          <TableRow
                            key={row.id}
                            highlighted={selectedPermissionId === row.id}
                            onClick={() =>
                              setSelectedPermissionId((current) =>
                                current === row.id ? null : row.id,
                              )
                            }
                          >
                            <td>{row.name}</td>
                            <td>{row.label}</td>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </SunkenPanel>
                <FieldRow style={{ marginTop: 8 }}>
                  <Select
                    id={assignSelectId}
                    label="Assign:"
                    accessKey="i"
                    value={
                      assignPermissionId != null ? String(assignPermissionId) : ''
                    }
                    disabled={busy || assignablePermissions.length === 0}
                    title={
                      assignablePermissions.length === 0
                        ? 'No unassigned permissions available'
                        : 'Permissions not yet attached to this role'
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setAssignPermissionId(value === '' ? null : Number(value));
                    }}
                  >
                    <option value="">
                      {assignablePermissions.length === 0
                        ? 'None available'
                        : 'Select a permission…'}
                    </option>
                    {assignablePermissions.map((permission) => (
                      <option key={permission.id} value={permission.id}>
                        {permission.label} ({permission.name})
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    accessKey="g"
                    disabled={!canAssign}
                    title="Assign selected permission to this role"
                    onClick={handleAssign}
                  >
                    Assign
                  </Button>
                </FieldRow>
                <FieldRow className="justify-end" style={{ marginTop: 8 }}>
                  <Button
                    type="button"
                    accessKey="a"
                    disabled={busy || !onAddPermission}
                    title={
                      onAddPermission
                        ? 'Add a new permission'
                        : 'Opens Permissions → New (coming soon)'
                    }
                    onClick={onAddPermission}
                  >
                    Add…
                  </Button>
                  <Button
                    type="button"
                    accessKey="r"
                    disabled={!canRemove}
                    title="Remove selected permission from this role"
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
