import { useEffect, useId, useState, type CSSProperties } from 'react';
import {
  Button,
  FieldRow,
  GroupBox,
  StatusBar,
  StatusBarField,
  TextBox,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { HeadingPanelWindow } from '../../bricks/HeadingPanelWindow';
import { DesktopModal } from '../../bricks/DesktopModal';
import { MessageDialog } from '../../bricks/MessageDialog';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import type { AdminApiMediaAsset } from '../../api/types';

export type SiteSettingsHostRow = {
  id: number;
  host: string;
  surface: string;
  verification: string;
  enabled: boolean;
  protected: boolean;
};

export type SiteSettingsAssignmentRow = {
  id: number;
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
  roleLabel: string;
};

export type SiteSettingsCapabilities = {
  manageHosts: boolean;
  manageUsers: boolean;
};

export type SiteSettingsSavePatch = {
  name?: string;
  description?: string | null;
  faviconMediaId?: number | null;
};

export type SiteSettingsWindowProps = {
  siteName: string;
  name?: string;
  description?: string | null;
  themeId?: string;
  protected?: boolean;
  faviconMediaId?: number | null;
  favicon?: AdminApiMediaAsset | null;
  hosts?: SiteSettingsHostRow[];
  assignments?: SiteSettingsAssignmentRow[];
  capabilities?: SiteSettingsCapabilities;
  canEdit?: boolean;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  statusMessage?: string | null;
  onClearStatusMessage?: () => void;
  onSave?: (patch: SiteSettingsSavePatch) => void;
  onManageHosts?: () => void;
  onManageUsers?: () => void;
  errorSoundUrl?: string;
  dingSoundUrl?: string;
  onAlertClose?: () => void;
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
};

/**
 * Site-interior settings (explorer Settings root) — not CP install Settings.
 */
export function SiteSettingsWindow({
  siteName,
  name: nameProp = '',
  description: descriptionProp = '',
  themeId = 'default',
  protected: isProtected = false,
  faviconMediaId = null,
  favicon = null,
  hosts = [],
  assignments = [],
  capabilities = { manageHosts: false, manageUsers: false },
  canEdit = true,
  loading = false,
  saving = false,
  error = null,
  statusMessage = null,
  onClearStatusMessage,
  onSave,
  onManageHosts,
  onManageUsers,
  errorSoundUrl,
  dingSoundUrl,
  onAlertClose,
  onClose,
  onMinimize,
  onMaximize,
  onActivate,
  inactive = false,
  maximized = false,
  resizable = true,
  className,
  style,
  width,
}: SiteSettingsWindowProps) {
  void dingSoundUrl;  const nameId = useId();
  const descriptionId = useId();
  const faviconId = useId();
  const [name, setName] = useState(nameProp);
  const [description, setDescription] = useState(descriptionProp ?? '');
  const [faviconIdInput, setFaviconIdInput] = useState(
    faviconMediaId != null ? String(faviconMediaId) : '',
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(nameProp);
    setDescription(descriptionProp ?? '');
    setFaviconIdInput(faviconMediaId != null ? String(faviconMediaId) : '');
  }, [nameProp, descriptionProp, faviconMediaId]);

  useEffect(() => {
    if (!error) {
      return;
    }
    setAlertMessage(error);
    playAdminSound('chord', errorSoundUrl);
  }, [error, errorSoundUrl]);

  const dirty =
    name.trim() !== nameProp.trim() ||
    description !== (descriptionProp ?? '') ||
    faviconIdInput.trim() !== (faviconMediaId != null ? String(faviconMediaId) : '');

  const handleSave = () => {
    if (!canEdit || !onSave || saving || loading) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setAlertMessage('Name is required.');
      playAdminSound('chord', errorSoundUrl);
      return;
    }
    const patch: SiteSettingsSavePatch = {};
    if (trimmed !== nameProp.trim()) {
      patch.name = trimmed;
    }
    if (description !== (descriptionProp ?? '')) {
      patch.description = description.trim() === '' ? null : description;
    }
    const nextFav =
      faviconIdInput.trim() === '' ? null : Number(faviconIdInput.trim());
    if (
      faviconIdInput.trim() !== '' &&
      (!Number.isFinite(nextFav) || nextFav === null || nextFav <= 0)
    ) {
      setAlertMessage('Favicon media id must be a positive integer or empty.');
      playAdminSound('chord', errorSoundUrl);
      return;
    }
    const prevFav = faviconMediaId ?? null;
    if (nextFav !== prevFav) {
      patch.faviconMediaId = nextFav;
    }
    if (Object.keys(patch).length === 0) {
      return;
    }
    onSave(patch);
  };

  return (
    <>
      <HeadingPanelWindow
        className={cn('site-settings-window', maximized && 'is-maximized', className)}
        title={`${siteName} — Settings`}
        titleIcon="settings"
        inactive={inactive}
        resizable={resizable}
        width={width}
        style={style}
        onMouseDown={onActivate}
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
        statusBar={
          <StatusBar>
            <StatusBarField>
              {loading
                ? 'Loading…'
                : saving
                  ? 'Saving…'
                  : statusMessage
                    ? statusMessage
                    : dirty
                      ? 'Unsaved changes'
                      : 'Ready'}
            </StatusBarField>
            {statusMessage ? (
              <StatusBarField>
                <Button type="button" onClick={onClearStatusMessage}>
                  Clear
                </Button>
              </StatusBarField>
            ) : null}
          </StatusBar>
        }
      >
        <GroupBox legend="Identity">
          <FieldRow>
            <label htmlFor={nameId}>Name</label>
            <TextBox
              id={nameId}
              value={name}
              disabled={!canEdit || loading || saving}
              onChange={(event) => setName(event.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <label htmlFor={descriptionId}>Description</label>
            <TextBox
              id={descriptionId}
              value={description}
              disabled={!canEdit || loading || saving}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <span>Theme</span>
            <span>{themeId}</span>
          </FieldRow>
          {isProtected ? (
            <FieldRow>
              <span>Protected</span>
              <span>Yes (Main site)</span>
            </FieldRow>
          ) : null}
        </GroupBox>

        <GroupBox legend="Favicon">
          <FieldRow>
            <label htmlFor={faviconId}>Media id</label>
            <TextBox
              id={faviconId}
              value={faviconIdInput}
              disabled={!canEdit || loading || saving}
              placeholder="Empty to clear"
              onChange={(event) => setFaviconIdInput(event.target.value)}
            />
          </FieldRow>
          {favicon ? (
            <FieldRow>
              <span>Current</span>
              <span>
                {favicon.originalFilename} ({favicon.mimeType})
              </span>
            </FieldRow>
          ) : null}
        </GroupBox>

        <GroupBox legend="Hosts">
          {hosts.length === 0 ? (
            <p style={{ margin: 0 }}>No hosts assigned.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {hosts.map((host) => (
                <li key={host.id}>
                  {host.host}
                  {host.enabled ? '' : ' (disabled)'}
                  {host.protected ? ' · protected' : ''}
                </li>
              ))}
            </ul>
          )}
          {capabilities.manageHosts && onManageHosts ? (
            <FieldRow className="justify-end">
              <Button type="button" onClick={onManageHosts}>
                Manage in Hosts…
              </Button>
            </FieldRow>
          ) : null}
        </GroupBox>

        <GroupBox legend="Assigned users">
          {assignments.length === 0 ? (
            <p style={{ margin: 0 }}>No site assignments.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {assignments.map((row) => (
                <li key={row.id}>
                  {row.email} — {row.roleLabel}
                </li>
              ))}
            </ul>
          )}
          {capabilities.manageUsers && onManageUsers ? (
            <FieldRow className="justify-end">
              <Button type="button" onClick={onManageUsers}>
                Manage in Users…
              </Button>
            </FieldRow>
          ) : null}
        </GroupBox>

        <FieldRow className="justify-end">
          <Button
            type="button"
            isDefault
            disabled={!canEdit || !dirty || loading || saving || !onSave}
            onClick={handleSave}
          >
            OK
          </Button>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      </HeadingPanelWindow>

      {alertMessage ? (
        <DesktopModal>
          <MessageDialog
            type="error"
            title="Error"
            message={alertMessage}
            onClose={() => {
              setAlertMessage(null);
              onAlertClose?.();
            }}
          />
        </DesktopModal>
      ) : null}
    </>
  );
}
