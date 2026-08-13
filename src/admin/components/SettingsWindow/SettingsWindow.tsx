import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  GroupBox,
  Radio,
  StatusBar,
  StatusBarField,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { HeadingPanelWindow } from '../../bricks/HeadingPanelWindow';
import { DesktopModal } from '../../bricks/DesktopModal';
import { MessageDialog } from '../../bricks/MessageDialog';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';

export type AdminAccessModeValue = 'path' | 'domain';

export type SettingsSavePatch = {
  adminAccess?: AdminAccessModeValue;
  symfonyDebugToolbar?: boolean;
};

const ACCESS_SWITCH_WARNING =
  'Changing admin access mode will discard unfinished work in this session.\nYou will need to sign in again on the new admin login page.';

export type SettingsWindowProps = {
  adminAccess?: AdminAccessModeValue;
  /** When false, Domain radio is disabled. */
  domainAvailable?: boolean;
  symfonyDebugToolbar?: boolean;
  /** When false (e.g. prod), checkbox is unchecked and disabled. */
  symfonyDebugToolbarEditable?: boolean;
  canEdit?: boolean;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  statusMessage?: string | null;
  onClearStatusMessage?: () => void;
  /** Access mode (after warning) and/or toolbar toggle. */
  onSave?: (patch: SettingsSavePatch) => void;
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
};

/**
 * Install settings: Admin access mode (path | domain) + Symfony debug toolbar.
 */
export function SettingsWindow({
  adminAccess = 'path',
  domainAvailable = false,
  symfonyDebugToolbar = true,
  symfonyDebugToolbarEditable = true,
  canEdit = true,
  loading = false,
  saving = false,
  error = null,
  statusMessage = null,
  onClearStatusMessage,
  onSave,
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
  width = 420,
}: SettingsWindowProps) {
  const [draft, setDraft] = useState<AdminAccessModeValue>(adminAccess);
  const [toolbarDraft, setToolbarDraft] = useState(symfonyDebugToolbar);
  const [pendingAccess, setPendingAccess] = useState<AdminAccessModeValue | null>(
    null,
  );
  const [alert, setAlert] = useState<string | null>(null);
  const soundedFor = useRef<string | null>(null);
  const warnedFor = useRef<AdminAccessModeValue | null>(null);
  const handleCancel = onCancel ?? onClose;
  const busy = loading || saving;
  const showAlert = Boolean(alert);
  const showSwitchWarning = pendingAccess != null && !showAlert;
  const toolbarChecked = symfonyDebugToolbarEditable ? toolbarDraft : false;
  const toolbarDisabled =
    !symfonyDebugToolbarEditable || !canEdit || busy;

  useEffect(() => {
    setDraft(adminAccess);
  }, [adminAccess]);

  useEffect(() => {
    setToolbarDraft(symfonyDebugToolbar);
  }, [symfonyDebugToolbar]);

  useEffect(() => {
    if (draft === 'domain' && !domainAvailable) {
      setDraft('path');
    }
  }, [domainAvailable, draft]);

  useEffect(() => {
    if (!error) {
      return;
    }
    setPendingAccess(null);
    setToolbarDraft(symfonyDebugToolbar);
    setAlert(error);
  }, [error, symfonyDebugToolbar]);

  useLayoutEffect(() => {
    if (!alert) {
      soundedFor.current = null;
      return;
    }
    if (soundedFor.current === alert) {
      return;
    }
    soundedFor.current = alert;
    playAdminSound('chord', errorSoundUrl);
  }, [alert, errorSoundUrl]);

  useLayoutEffect(() => {
    if (!pendingAccess) {
      warnedFor.current = null;
      return;
    }
    if (warnedFor.current === pendingAccess) {
      return;
    }
    warnedFor.current = pendingAccess;
    playAdminSound('chord', errorSoundUrl);
  }, [pendingAccess, errorSoundUrl]);

  const requestAccessChange = (next: AdminAccessModeValue) => {
    if (busy || !canEdit || next === adminAccess) {
      return;
    }
    if (next === 'domain' && !domainAvailable) {
      return;
    }
    onClearStatusMessage?.();
    setDraft(next);
    setPendingAccess(next);
  };

  const cancelAccessChange = () => {
    setPendingAccess(null);
    setDraft(adminAccess);
  };

  const confirmAccessChange = () => {
    if (pendingAccess == null || !onSave) {
      setPendingAccess(null);
      return;
    }
    const next = pendingAccess;
    setPendingAccess(null);
    onSave({ adminAccess: next });
  };

  const requestToolbarChange = (next: boolean) => {
    if (toolbarDisabled || next === toolbarDraft) {
      return;
    }
    onClearStatusMessage?.();
    setToolbarDraft(next);
    onSave?.({ symfonyDebugToolbar: next });
  };

  const domainDisabled = !domainAvailable || !canEdit || busy;

  return (
    <HeadingPanelWindow
      className={cn('settings-window', className)}
      style={style}
      width={width}
      inactive={inactive}
      resizable={resizable}
      title="Settings"
      titleIcon="settings"
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
      actions={
        <FieldRow className="justify-end">
          <Button type="button" accessKey="c" disabled={busy} onClick={handleCancel}>
            Cancel
          </Button>
        </FieldRow>
      }
      statusBar={
        <StatusBar>
          <StatusBarField>
            {loading ? 'Loading…' : domainAvailable ? 'Domain available' : 'Path only'}
          </StatusBarField>
          <StatusBarField className="description">{statusMessage ?? ''}</StatusBarField>
          <StatusBarField />
        </StatusBar>
      }
    >
      <GroupBox legend="Admin access">
        <FieldRow>
          <Radio
            id="settings-admin-access-domain"
            name="adminAccess"
            label="domain"
            checked={draft === 'domain'}
            disabled={domainDisabled}
            onChange={() => requestAccessChange('domain')}
          />
          <Radio
            id="settings-admin-access-path"
            name="adminAccess"
            label="path"
            checked={draft === 'path'}
            disabled={!canEdit || busy}
            onChange={() => requestAccessChange('path')}
          />
        </FieldRow>
      </GroupBox>

      <GroupBox legend="Symfony" style={{ marginTop: 12 }}>
        <FieldRow>
          <Checkbox
            id="settings-symfony-debug-toolbar"
            label="Debug toolbar"
            checked={toolbarChecked}
            disabled={toolbarDisabled}
            onChange={(event) => requestToolbarChange(event.target.checked)}
          />
        </FieldRow>
      </GroupBox>

      {showSwitchWarning ? (
        <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
          <MessageDialog
            type="warning"
            title="Warning"
            message={ACCESS_SWITCH_WARNING}
            confirmLabel="OK"
            cancelLabel="Cancel"
            onClose={cancelAccessChange}
            onConfirm={confirmAccessChange}
          />
        </DesktopModal>
      ) : null}

      {showAlert ? (
        <DesktopModal layer="alert" dingSoundUrl={dingSoundUrl}>
          <MessageDialog
            type="error"
            title="Error"
            message={alert!}
            onClose={() => {
              setAlert(null);
              onAlertClose?.();
            }}
          />
        </DesktopModal>
      ) : null}
    </HeadingPanelWindow>
  );
}
