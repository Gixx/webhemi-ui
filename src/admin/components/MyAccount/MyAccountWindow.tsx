import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import type { AdminApiClient, AdminApiUserAvatarType, AdminApiUserProfile } from '../../api';
import {
  Button,
  FieldRow,
  FileInput,
  GroupBox,
  Radio,
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
import { DesktopModal } from '../../bricks/DesktopModal';
import { MessageDialog } from '../../bricks/MessageDialog';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { adminAsset } from '../../lib/assetPaths';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import { AvatarCropModal } from './AvatarCropModal';
import { gravatarUrlFromEmail } from './avatarCrop';
import { LinkFormModal, type UserLinkDraft } from './LinkFormModal';

export type MyAccountWindowProps = {
  api: AdminApiClient;
  userId: number;
  /** Digested default avatar SVG (Twig); Storybook uses static /assets/admin/…. */
  defaultAvatarUrl?: string;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
  onClose: () => void;
  onMinimize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
  /** Called after successful save (e.g. refresh desktop email). */
  onSaved?: (profile: AdminApiUserProfile) => void;
  className?: string;
};

type AccountTab = 'personal' | 'security';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Start → My Account: Personal data + Security tabs.
 */
export function MyAccountWindow({
  api,
  userId,
  defaultAvatarUrl = adminAsset('system/avatar_default.svg'),
  errorSoundUrl,
  dingSoundUrl,
  onClose,
  onMinimize,
  onActivate,
  inactive = false,
  onSaved,
  className,
}: MyAccountWindowProps) {
  const [tab, setTab] = useState<AccountTab>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [avatarType, setAvatarType] = useState<AdminApiUserAvatarType>('default');
  const [serverAvatarUrl, setServerAvatarUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<UserLinkDraft[]>([]);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState<number | null>(null);

  const [fileName, setFileName] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingJpeg, setPendingJpeg] = useState<Blob | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [linkForm, setLinkForm] = useState<
    null | { mode: 'add' | 'edit'; index?: number; initial?: UserLinkDraft }
  >(null);

  const ids = {
    name: useId(),
    email: useId(),
    tel: useId(),
    address: useId(),
    zip: useId(),
    city: useId(),
    country: useId(),
    bio: useId(),
    avDefault: useId(),
    avGravatar: useId(),
    avUpload: useId(),
    cur: useId(),
    pw: useId(),
    conf: useId(),
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await api.getMyProfile();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setAlert(result.error.message);
        playAdminSound('chord', errorSoundUrl);
        setLoading(false);
        return;
      }
      const p = result.data;
      setEmail(p.email);
      setDisplayName(p.displayName ?? '');
      setTelephone(p.telephone ?? '');
      setAddress(p.address ?? '');
      setZip(p.zip ?? '');
      setCity(p.city ?? '');
      setCountry(p.country ?? '');
      setBio(p.bio ?? '');
      setAvatarType(p.avatarType);
      setServerAvatarUrl(p.avatarUrl);
      setLinks(p.links.map((l) => ({ id: l.id, name: l.name, url: l.url })));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [api, errorSoundUrl]);

  useEffect(() => {
    return () => {
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
      }
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [tempImageUrl, pendingPreviewUrl]);

  const showError = (message: string) => {
    setAlert(message);
    playAdminSound('chord', errorSoundUrl);
  };

  const previewUrl = useMemo(() => {
    if (avatarType === 'upload' && pendingPreviewUrl) {
      return pendingPreviewUrl;
    }
    if (avatarType === 'upload' && serverAvatarUrl) {
      return serverAvatarUrl;
    }
    if (avatarType === 'gravatar' && EMAIL_PATTERN.test(email.trim())) {
      return gravatarUrlFromEmail(email);
    }
    if (avatarType === 'gravatar') {
      return gravatarUrlFromEmail('preview@example.com');
    }
    return defaultAvatarUrl;
  }, [
    avatarType,
    pendingPreviewUrl,
    serverAvatarUrl,
    email,
    defaultAvatarUrl,
  ]);

  const handleFile = (file: File | null) => {
    if (!file) {
      return;
    }
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
    }
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setFileName(file.name);
    setAvatarType('upload');
    setCropOpen(true);
  };

  const handleCropConfirm = (blob: Blob) => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingJpeg(blob);
    setPendingPreviewUrl(URL.createObjectURL(blob));
    setCropOpen(false);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };

  const validatePersonal = (): string | null => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'A valid email is required.';
    }
    return null;
  };

  const validatePasswordIfAny = (): string | null => {
    if (!password && !confirmPassword) {
      return null;
    }
    if (!currentPassword) {
      return 'Current password is required.';
    }
    if (!password) {
      return 'New password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      return 'Confirm the new password.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleOk = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || loading) {
      return;
    }
    const personalErr = validatePersonal();
    if (personalErr) {
      showError(personalErr);
      setTab('personal');
      return;
    }
    const pwErr = validatePasswordIfAny();
    if (pwErr) {
      showError(pwErr);
      setTab('security');
      return;
    }

    setSaving(true);
    try {
      if (password) {
        const pwResult = await api.setUserPassword(userId, {
          currentPassword,
          password,
          confirmPassword: password,
        });
        if (!pwResult.ok) {
          showError(pwResult.error.message);
          setTab('security');
          return;
        }
      }

      if (avatarType === 'upload' && pendingJpeg) {
        const up = await api.uploadMyAvatar(pendingJpeg);
        if (!up.ok) {
          showError(up.error.message);
          setTab('personal');
          return;
        }
      }

      const patch = await api.updateMyProfile({
        email: email.trim(),
        displayName: displayName.trim() || null,
        telephone: telephone.trim() || null,
        address: address.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        bio: bio.trim() || null,
        avatarType,
        links: links.map((l) => ({ name: l.name, url: l.url })),
      });
      if (!patch.ok) {
        showError(patch.error.message);
        setTab('personal');
        return;
      }
      onSaved?.(patch.data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PaneWindowShell
        className={cn('my-account-window', className)}
        width={520}
        title="My Account"
        titleIcon="my-account"
        inactive={inactive}
        onMouseDown={onActivate}
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Minimize" onClick={onMinimize} />
            <TitleBarControl action="Close" onClick={onClose} />
          </TitleBarControls>
        }
      >
        <form onSubmit={(e) => void handleOk(e)}>
          <TabList>
            <Tab
              selected={tab === 'personal'}
              href="#my-account-personal"
              onClick={(e) => {
                e.preventDefault();
                setTab('personal');
              }}
            >
              Personal data
            </Tab>
            <Tab
              selected={tab === 'security'}
              href="#my-account-security"
              onClick={(e) => {
                e.preventDefault();
                setTab('security');
              }}
            >
              Security
            </Tab>
          </TabList>
          <TabPanel>
            <WindowBody>
              {loading ? (
                <p style={{ margin: 0 }}>Loading…</p>
              ) : tab === 'personal' ? (
                <>
                  <GroupBox legend="Avatar">
                    <FieldRow style={{ alignItems: 'flex-start' }}>
                      <img
                        src={previewUrl}
                        alt=""
                        width={64}
                        height={64}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          border: '1px solid #808080',
                          background: '#fff',
                          flex: '0 0 auto',
                        }}
                      />
                      <div className="stack" style={{ gap: 4, flex: '1 1 auto' }}>
                        <Radio
                          id={ids.avDefault}
                          name="avatar-type"
                          label="Default"
                          checked={avatarType === 'default'}
                          onChange={() => setAvatarType('default')}
                        />
                        <Radio
                          id={ids.avGravatar}
                          name="avatar-type"
                          label="Gravatar"
                          checked={avatarType === 'gravatar'}
                          onChange={() => setAvatarType('gravatar')}
                        />
                        <Radio
                          id={ids.avUpload}
                          name="avatar-type"
                          label="Upload"
                          checked={avatarType === 'upload'}
                          onChange={() => setAvatarType('upload')}
                        />
                        {avatarType === 'upload' ? (
                          <FileInput
                            value={fileName}
                            onFileChange={handleFile}
                            pathClassName="w-window-xs"
                            disabled={saving}
                          />
                        ) : null}
                      </div>
                    </FieldRow>
                  </GroupBox>

                  <GroupBox legend="Personal information" style={{ marginTop: 12 }}>
                    <FieldRow style={{ alignItems: 'flex-start', gap: 12 }}>
                      <div
                        className="stack my-account-fields"
                        style={{ flex: '1 1 50%', minWidth: 0, gap: 8 }}
                      >
                        <TextBox
                          id={ids.name}
                          label="Name:"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.email}
                          label="Email:"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.tel}
                          label="Telephone:"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.address}
                          label="Address:"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.zip}
                          label="ZIP:"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.city}
                          label="City:"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={saving}
                        />
                        <TextBox
                          id={ids.country}
                          label="Country:"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="stack" style={{ flex: '1 1 50%', gap: 8 }}>
                        <TextArea
                          id={ids.bio}
                          label="Bio:"
                          labelPosition="above"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          disabled={saving}
                          rows={6}
                        />
                        <div>
                          <p style={{ margin: '0 0 4px' }}>Links</p>
                          <FieldRow style={{ alignItems: 'stretch' }}>
                            <SunkenPanel
                              scrollable
                              tone="white"
                              style={{
                                flex: '1 1 auto',
                                height: 100,
                                boxSizing: 'border-box',
                              }}
                            >
                              {links.length === 0 ? (
                                <p style={{ margin: 8 }}>No links.</p>
                              ) : (
                                <Table aria-label="Links">
                                  <tbody>
                                    {links.map((link, index) => (
                                      <TableRow
                                        key={`${link.name}-${index}`}
                                        highlighted={selectedLinkIndex === index}
                                        title={link.url}
                                        onClick={() => setSelectedLinkIndex(index)}
                                        onDoubleClick={() =>
                                          setLinkForm({
                                            mode: 'edit',
                                            index,
                                            initial: link,
                                          })
                                        }
                                      >
                                        <td>{link.name}</td>
                                      </TableRow>
                                    ))}
                                  </tbody>
                                </Table>
                              )}
                            </SunkenPanel>
                            <div
                              className="stack"
                              style={{ flex: '0 0 auto', width: '5.5em', gap: 8 }}
                            >
                              <Button
                                type="button"
                                disabled={saving}
                                onClick={() => setLinkForm({ mode: 'add' })}
                                style={{ width: '100%' }}
                              >
                                Add
                              </Button>
                              <Button
                                type="button"
                                disabled={saving || selectedLinkIndex == null}
                                onClick={() => {
                                  if (selectedLinkIndex == null) {
                                    return;
                                  }
                                  setLinkForm({
                                    mode: 'edit',
                                    index: selectedLinkIndex,
                                    initial: links[selectedLinkIndex],
                                  });
                                }}
                                style={{ width: '100%' }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                disabled={saving || selectedLinkIndex == null}
                                onClick={() => {
                                  if (selectedLinkIndex == null) {
                                    return;
                                  }
                                  setLinks((prev) =>
                                    prev.filter((_, i) => i !== selectedLinkIndex),
                                  );
                                  setSelectedLinkIndex(null);
                                }}
                                style={{ width: '100%' }}
                              >
                                Delete
                              </Button>
                            </div>
                          </FieldRow>
                        </div>
                      </div>
                    </FieldRow>
                  </GroupBox>
                </>
              ) : (
                <div
                  className="stack my-account-security-fields"
                  style={{ gap: 8, maxWidth: 360, width: '100%' }}
                >
                  <TextBox
                    id={ids.cur}
                    label="Old password:"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={saving}
                    autoFocus
                  />
                  <TextBox
                    id={ids.pw}
                    label="New password:"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saving}
                  />
                  <TextBox
                    id={ids.conf}
                    label="Confirm new password:"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                  />
                </div>
              )}

              <FieldRow className="justify-end" style={{ marginTop: 16 }}>
                <Button type="submit" isDefault accessKey="k" loading={saving} disabled={loading}>
                  OK
                </Button>
                <Button type="button" accessKey="a" disabled={saving} onClick={onClose}>
                  Cancel
                </Button>
              </FieldRow>
            </WindowBody>
          </TabPanel>
        </form>
      </PaneWindowShell>

      {linkForm ? (
        <DesktopModal dingSoundUrl={dingSoundUrl}>
          <LinkFormModal
            mode={linkForm.mode}
            initial={linkForm.initial}
            onClose={() => setLinkForm(null)}
            onError={showError}
            onSave={(link) => {
              if (linkForm.mode === 'add') {
                setLinks((prev) => [...prev, link]);
              } else if (linkForm.index != null) {
                setLinks((prev) =>
                  prev.map((row, i) => (i === linkForm.index ? link : row)),
                );
              }
              setLinkForm(null);
            }}
          />
        </DesktopModal>
      ) : null}

      {cropOpen && tempImageUrl ? (
        <DesktopModal dingSoundUrl={dingSoundUrl}>
          <AvatarCropModal
            imageUrl={tempImageUrl}
            onClose={() => {
              setCropOpen(false);
              if (tempImageUrl) {
                URL.revokeObjectURL(tempImageUrl);
                setTempImageUrl(null);
              }
            }}
            onError={showError}
            onConfirm={handleCropConfirm}
          />
        </DesktopModal>
      ) : null}

      {alert ? (
        <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
          <MessageDialog
            type="error"
            title="Error"
            message={alert}
            onClose={() => setAlert(null)}
          />
        </DesktopModal>
      ) : null}
    </>
  );
}
