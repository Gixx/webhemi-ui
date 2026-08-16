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
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type UserFormMode = 'new' | 'edit';

export type UserFormSiteAssignment = {
  siteId: number;
  roleId: number;
};

export type UserFormValues = {
  email: string;
  password?: string;
  displayName?: string;
  telephone?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  roleIds: number[];
  siteAssignments: UserFormSiteAssignment[];
};

export type UserFormSavePayload = UserFormValues & {
  mode: UserFormMode;
  userId?: number;
};

export type UserFormRoleOption = {
  id: number;
  name: string;
  label: string;
};

export type UserFormSiteOption = {
  id: number;
  name: string;
};

export type UserFormDialogProps = {
  mode: UserFormMode;
  initial?: Partial<UserFormValues> & {
    userId?: number;
    title?: string;
  };
  /** Catalog for global role assignment (Site Admin filtered out). */
  roles?: UserFormRoleOption[];
  /** Sites available for siteAssignments. */
  sites?: UserFormSiteOption[];
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
  saving?: boolean;
  /** View-only (user.view without edit). */
  readOnly?: boolean;
  /** Editing the signed-in user — General tab redirects to My Account. */
  isSelf?: boolean;
  onSave: (payload: UserFormSavePayload) => void;
  onError?: (message: string) => void;
  onClose: () => void;
  /** Opens My Account (self General tab). */
  onOpenMyAccount?: () => void;
  /** Opens Roles window (optional). */
  onAddRole?: () => void;
  className?: string;
};

type FormTab = 'general' | 'roles' | 'sites';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * New / Edit User modal: General + Roles + Sites tabs.
 * Self edit: General shows My Account redirect. Others/New: profile fields + password.
 * Global roles exclude ROLE_SITE_ADMIN; site roles exclude ROLE_ADMIN.
 */
export function UserFormDialog({
  mode,
  initial,
  roles = [],
  sites = [],
  fieldErrors,
  saving = false,
  readOnly = false,
  isSelf = false,
  onSave,
  onError,
  onClose,
  onOpenMyAccount,
  onAddRole,
  className,
}: UserFormDialogProps) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const telId = useId();
  const addressId = useId();
  const zipId = useId();
  const cityId = useId();
  const countryId = useId();
  const assignRoleSelectId = useId();
  const assignSiteSelectId = useId();
  const assignSiteRoleSelectId = useId();
  const [tab, setTab] = useState<FormTab>('general');
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState(initial?.password ?? '');
  const [telephone, setTelephone] = useState(initial?.telephone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [zip, setZip] = useState(initial?.zip ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [roleIds, setRoleIds] = useState<number[]>(initial?.roleIds ?? []);
  const [siteAssignments, setSiteAssignments] = useState<UserFormSiteAssignment[]>(
    initial?.siteAssignments ?? [],
  );
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [assignSiteId, setAssignSiteId] = useState<number | null>(null);
  const [assignSiteRoleId, setAssignSiteRoleId] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<'email' | 'password' | 'displayName' | 'roleIds', string>>
  >({});

  const globalRoleOptions = useMemo(
    () => roles.filter((row) => row.name !== 'ROLE_SITE_ADMIN'),
    [roles],
  );
  const siteRoleOptions = useMemo(
    () => roles.filter((row) => row.name !== 'ROLE_ADMIN'),
    [roles],
  );

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  useEffect(() => {
    if (selectedRoleId != null && !roleIds.includes(selectedRoleId)) {
      setSelectedRoleId(null);
    }
  }, [roleIds, selectedRoleId]);

  useEffect(() => {
    if (assignRoleId != null && roleIds.includes(assignRoleId)) {
      setAssignRoleId(null);
    }
  }, [roleIds, assignRoleId]);

  useEffect(() => {
    if (
      selectedSiteId != null &&
      !siteAssignments.some((row) => row.siteId === selectedSiteId)
    ) {
      setSelectedSiteId(null);
    }
  }, [siteAssignments, selectedSiteId]);

  useEffect(() => {
    if (
      assignSiteId != null &&
      siteAssignments.some((row) => row.siteId === assignSiteId)
    ) {
      setAssignSiteId(null);
    }
  }, [siteAssignments, assignSiteId]);

  const mergedErrors = {
    ...localErrors,
    ...fieldErrors,
  };

  const title =
    initial?.title ??
    (mode === 'edit' ? `Edit User — ${initial?.email ?? ''}` : 'New User');

  const assignedRoles = useMemo(
    () =>
      roleIds
        .map((id) => globalRoleOptions.find((row) => row.id === id))
        .filter((row): row is UserFormRoleOption => row != null),
    [roleIds, globalRoleOptions],
  );

  const assignableRoles = useMemo(
    () => globalRoleOptions.filter((row) => !roleIds.includes(row.id)),
    [globalRoleOptions, roleIds],
  );

  const assignedSites = useMemo(
    () =>
      siteAssignments
        .map((row) => {
          const site = sites.find((entry) => entry.id === row.siteId);
          const role = siteRoleOptions.find((entry) => entry.id === row.roleId);
          if (!site || !role) {
            return null;
          }
          return { siteId: row.siteId, siteName: site.name, role };
        })
        .filter(
          (
            row,
          ): row is {
            siteId: number;
            siteName: string;
            role: UserFormRoleOption;
          } => row != null,
        ),
    [siteAssignments, sites, siteRoleOptions],
  );

  const assignableSites = useMemo(
    () =>
      sites.filter(
        (site) => !siteAssignments.some((row) => row.siteId === site.id),
      ),
    [sites, siteAssignments],
  );

  const busy = saving || readOnly;
  const canAssignRole =
    !busy && !readOnly && assignRoleId != null && assignableRoles.length > 0;
  const canRemoveRole =
    !busy &&
    !readOnly &&
    selectedRoleId != null &&
    roleIds.includes(selectedRoleId) &&
    roleIds.length > 1;
  const canAssignSite =
    !busy &&
    !readOnly &&
    assignSiteId != null &&
    assignSiteRoleId != null &&
    assignableSites.length > 0 &&
    siteRoleOptions.length > 0;
  const canRemoveSite =
    !busy &&
    !readOnly &&
    selectedSiteId != null &&
    siteAssignments.some((row) => row.siteId === selectedSiteId);

  const validate = (): boolean => {
    if (isSelf) {
      setLocalErrors({});
      if (roleIds.length < 1) {
        setTab('roles');
        onError?.('At least one role is required.');
        return false;
      }
      return true;
    }
    const next: Partial<Record<'email' | 'password' | 'displayName' | 'roleIds', string>> = {};
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      next.displayName = 'Name is required.';
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      next.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = 'Email must be a valid email address.';
    }
    if (mode === 'new') {
      if (!password) {
        next.password = 'Password is required.';
      } else if (password.length < 8) {
        next.password = 'Password must be at least 8 characters.';
      }
    }
    if (roleIds.length < 1) {
      next.roleIds = 'At least one role is required.';
    }
    setLocalErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.roleIds && !next.displayName && !next.email && !next.password) {
        setTab('roles');
      } else {
        setTab('general');
      }
      onError?.(Object.values(next).join('\n'));
      return false;
    }
    return true;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || saving || !validate()) {
      return;
    }
    if (isSelf) {
      onSave({
        mode,
        userId: initial?.userId,
        email: (initial?.email ?? email).trim().toLowerCase(),
        roleIds: [...roleIds],
        siteAssignments: siteAssignments.map((row) => ({
          siteId: row.siteId,
          roleId: row.roleId,
        })),
      });
      return;
    }
    onSave({
      mode,
      userId: initial?.userId,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      telephone: telephone.trim(),
      address: address.trim(),
      zip: zip.trim(),
      city: city.trim(),
      country: country.trim(),
      ...(mode === 'new' ? { password } : {}),
      roleIds: [...roleIds],
      siteAssignments: siteAssignments.map((row) => ({
        siteId: row.siteId,
        roleId: row.roleId,
      })),
    });
  };

  const handleAssignRole = () => {
    if (!canAssignRole || assignRoleId == null) {
      return;
    }
    const id = assignRoleId;
    setRoleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAssignRoleId(null);
    setSelectedRoleId(id);
  };

  const handleRemoveRole = () => {
    if (!canRemoveRole || selectedRoleId == null) {
      return;
    }
    const id = selectedRoleId;
    setRoleIds((prev) => prev.filter((row) => row !== id));
    setSelectedRoleId(null);
  };

  const handleAssignSite = () => {
    if (!canAssignSite || assignSiteId == null || assignSiteRoleId == null) {
      return;
    }
    const siteId = assignSiteId;
    const roleId = assignSiteRoleId;
    setSiteAssignments((prev) =>
      prev.some((row) => row.siteId === siteId)
        ? prev
        : [...prev, { siteId, roleId }],
    );
    setAssignSiteId(null);
    setAssignSiteRoleId(null);
    setSelectedSiteId(siteId);
  };

  const handleRemoveSite = () => {
    if (!canRemoveSite || selectedSiteId == null) {
      return;
    }
    const siteId = selectedSiteId;
    setSiteAssignments((prev) => prev.filter((row) => row.siteId !== siteId));
    setSelectedSiteId(null);
  };

  return (
    <PaneWindowShell
      className={cn('user-form-dialog', className)}
      width={520}
      title={title}
      titleIcon="users"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="user-form-dialog-form" onSubmit={handleSubmit} noValidate>
        <TabList>
          <Tab
            selected={tab === 'general'}
            href="#user-form-general"
            onClick={(event) => {
              event.preventDefault();
              setTab('general');
            }}
          >
            General
          </Tab>
          <Tab
            selected={tab === 'roles'}
            href="#user-form-roles"
            onClick={(event) => {
              event.preventDefault();
              setTab('roles');
            }}
          >
            Roles
          </Tab>
          <Tab
            selected={tab === 'sites'}
            href="#user-form-sites"
            onClick={(event) => {
              event.preventDefault();
              setTab('sites');
            }}
          >
            Sites
          </Tab>
        </TabList>

        <TabPanel>
          <WindowBody>
            {tab === 'general' ? (
              isSelf ? (
                <>
                  <FieldRow className="info-icon-row">
                    <span className="info-icon dialog-info" aria-hidden />
                    <p style={{ margin: 0, flex: '1 1 auto' }}>
                      Your personal profile (name, email, avatar, password, and
                      more) is edited in <strong>My Account</strong>. Use the
                      button below to open it. Roles and Sites on the other tabs
                      still apply here.
                    </p>
                  </FieldRow>
                  <FieldRow style={{ marginTop: 12 }}>
                    <Button
                      type="button"
                      accessKey="m"
                      disabled={!onOpenMyAccount}
                      onClick={() => onOpenMyAccount?.()}
                    >
                      My Account…
                    </Button>
                  </FieldRow>
                </>
              ) : (
                <div className="stack user-form-general-fields" style={{ gap: 8 }}>
                  <TextBox
                    id={nameId}
                    label="Name:"
                    accessKey="n"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.displayName) || undefined}
                    disabled={busy}
                    autoFocus
                  />
                  <TextBox
                    id={emailId}
                    label="Email:"
                    accessKey="e"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.email) || undefined}
                    disabled={busy}
                  />
                  {mode === 'new' ? (
                    <TextBox
                      id={passwordId}
                      label="Password:"
                      accessKey="p"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-invalid={Boolean(mergedErrors.password) || undefined}
                      disabled={busy}
                    />
                  ) : null}
                  <TextBox
                    id={telId}
                    label="Telephone:"
                    value={telephone}
                    onChange={(event) => setTelephone(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.telephone) || undefined}
                    disabled={busy}
                  />
                  <TextBox
                    id={addressId}
                    label="Address:"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.address) || undefined}
                    disabled={busy}
                  />
                  <TextBox
                    id={zipId}
                    label="ZIP:"
                    value={zip}
                    onChange={(event) => setZip(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.zip) || undefined}
                    disabled={busy}
                  />
                  <TextBox
                    id={cityId}
                    label="City:"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.city) || undefined}
                    disabled={busy}
                  />
                  <TextBox
                    id={countryId}
                    label="Country:"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    aria-invalid={Boolean(mergedErrors.country) || undefined}
                    disabled={busy}
                  />
                </div>
              )
            ) : tab === 'roles' ? (
              <>
                <p style={{ marginTop: 0, marginBottom: 8 }}>
                  Global roles below. Site Admin is assigned per site on the Sites
                  tab.
                </p>
                <SunkenPanel
                  scrollable
                  tone="white"
                  className="user-form-role-list"
                >
                  {assignedRoles.length === 0 ? (
                    <p style={{ margin: 8 }}>No roles assigned.</p>
                  ) : (
                    <Table aria-label="Assigned roles">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedRoles.map((row) => (
                          <TableRow
                            key={row.id}
                            highlighted={selectedRoleId === row.id}
                            onClick={() =>
                              setSelectedRoleId((current) =>
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
                    id={assignRoleSelectId}
                    label="Assign:"
                    accessKey="i"
                    value={assignRoleId != null ? String(assignRoleId) : ''}
                    disabled={busy || assignableRoles.length === 0}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAssignRoleId(value === '' ? null : Number(value));
                    }}
                  >
                    <option value="">
                      {assignableRoles.length === 0
                        ? 'None available'
                        : 'Select a role…'}
                    </option>
                    {assignableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label} ({role.name})
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    accessKey="g"
                    disabled={!canAssignRole}
                    onClick={handleAssignRole}
                  >
                    Assign
                  </Button>
                </FieldRow>
                <FieldRow className="justify-end" style={{ marginTop: 8 }}>
                  <Button
                    type="button"
                    accessKey="a"
                    disabled={busy || !onAddRole}
                    onClick={onAddRole}
                  >
                    Add…
                  </Button>
                  <Button
                    type="button"
                    accessKey="r"
                    disabled={!canRemoveRole}
                    onClick={handleRemoveRole}
                  >
                    Remove
                  </Button>
                </FieldRow>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0, marginBottom: 8 }}>
                  One role per site. Administrator cannot be used as a site role.
                </p>
                <SunkenPanel
                  scrollable
                  tone="white"
                  className="user-form-site-list"
                >
                  {assignedSites.length === 0 ? (
                    <p style={{ margin: 8 }}>No site assignments.</p>
                  ) : (
                    <Table aria-label="Site assignments">
                      <thead>
                        <tr>
                          <th>Site</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedSites.map((row) => (
                          <TableRow
                            key={row.siteId}
                            highlighted={selectedSiteId === row.siteId}
                            onClick={() =>
                              setSelectedSiteId((current) =>
                                current === row.siteId ? null : row.siteId,
                              )
                            }
                          >
                            <td>{row.siteName}</td>
                            <td>
                              {row.role.label} ({row.role.name})
                            </td>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </SunkenPanel>
                <FieldRow style={{ marginTop: 8 }}>
                  <Select
                    id={assignSiteSelectId}
                    label="Site:"
                    accessKey="s"
                    value={assignSiteId != null ? String(assignSiteId) : ''}
                    disabled={busy || assignableSites.length === 0}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAssignSiteId(value === '' ? null : Number(value));
                    }}
                  >
                    <option value="">
                      {assignableSites.length === 0
                        ? 'None available'
                        : 'Select a site…'}
                    </option>
                    {assignableSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </Select>
                </FieldRow>
                <FieldRow style={{ marginTop: 8 }}>
                  <Select
                    id={assignSiteRoleSelectId}
                    label="Role:"
                    accessKey="l"
                    value={
                      assignSiteRoleId != null ? String(assignSiteRoleId) : ''
                    }
                    disabled={busy || siteRoleOptions.length === 0}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAssignSiteRoleId(value === '' ? null : Number(value));
                    }}
                  >
                    <option value="">
                      {siteRoleOptions.length === 0
                        ? 'None available'
                        : 'Select a role…'}
                    </option>
                    {siteRoleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label} ({role.name})
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    accessKey="g"
                    disabled={!canAssignSite}
                    onClick={handleAssignSite}
                  >
                    Assign
                  </Button>
                </FieldRow>
                <FieldRow className="justify-end" style={{ marginTop: 8 }}>
                  <Button
                    type="button"
                    accessKey="r"
                    disabled={!canRemoveSite}
                    onClick={handleRemoveSite}
                  >
                    Remove
                  </Button>
                </FieldRow>
              </>
            )}
          </WindowBody>
        </TabPanel>

        <FieldRow className="justify-end site-form-dialog-actions">
          {readOnly ? (
            <Button type="button" isDefault accessKey="c" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button type="submit" isDefault accessKey="o" loading={saving}>
                OK
              </Button>
              <Button
                type="button"
                accessKey="c"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </Button>
            </>
          )}
        </FieldRow>
      </form>
    </PaneWindowShell>
  );
}
