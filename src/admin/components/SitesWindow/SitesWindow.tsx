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
  SiteFormDialog,
  type SiteFormHostOption,
  type SiteFormSavePayload,
} from './SiteFormDialog';

export type SitesWindowSite = {
  id: number;
  slug: string;
  name: string;
  enabled: boolean;
  hostCount: number;
};

/** @deprecated Prefer {@link SiteFormSavePayload} via `onSave`. */
export type SitesWindowCreatePayload = {
  name: string;
  slug: string;
};

export type SitesWindowProps = {
  sites?: SitesWindowSite[];
  /** Hosts available for assignment in New/Edit (props until Hosts API). */
  hosts?: SiteFormHostOption[];
  canEdit?: boolean;
  loading?: boolean;
  /** Window-level load error (list) — shown in status bar. */
  error?: string | null;
  /** Field errors from the last save attempt (MessageDialog + aria-invalid). */
  fieldErrors?: Partial<Record<'name' | 'slug', string>>;
  /** Save error message (MessageDialog). */
  formError?: string | null;
  /** Submit spinner on OK in the form dialog. */
  saving?: boolean;
  onSave?: (payload: SiteFormSavePayload) => void;
  /** @deprecated Use `onSave` with `mode: 'new'`. */
  onCreate?: (payload: SitesWindowCreatePayload) => void;
  onDelete?: (site: SitesWindowSite) => void;
  /** Opens Hosts → Add from the form dialog (later slice). */
  onAddHost?: () => void;
  /** Digested chord URL from Twig; Storybook uses package static path. */
  errorSoundUrl?: string;
  /** Digested ding URL — blocked-owner attention (Default Beep). */
  dingSoundUrl?: string;
  /** Defaults to `onClose` when omitted. */
  onCancel?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  /** Requires `resizable` (default true). */
  onMaximize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
  maximized?: boolean;
  /**
   * Window may be resized / maximized (default true).
   * When false, Maximize/Restore is not shown.
   */
  resizable?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
  /** Optional floor for standalone Storybook; omit in the shell so resize can shrink. */
  tableMinHeight?: number;
};

type FormState =
  | { open: false }
  | {
      open: true;
      mode: 'new' | 'edit';
      siteId?: number;
      name: string;
      slug: string;
      enabled: boolean;
      hostIds: number[];
      title?: string;
    };

type AlertState = { title: string; message: string } | null;

function formatSaveErrors(
  formError: string | null | undefined,
  fieldErrors: Partial<Record<'name' | 'slug', string>> | undefined,
): string | null {
  const parts = [
    formError,
    fieldErrors?.name,
    fieldErrors?.slug,
  ].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length === 0) {
    return null;
  }
  return [...new Set(parts)].join('\n');
}

/**
 * Sites admin window: list + New/Edit/Delete/Cancel.
 * New/Edit open a tabbed SiteFormDialog (General + Hosts).
 */
export function SitesWindow({
  sites = [],
  hosts = [],
  canEdit = false,
  loading = false,
  error = null,
  fieldErrors,
  formError = null,
  saving = false,
  onSave,
  onCreate,
  onDelete,
  onAddHost,
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
  width = 560,
  tableMinHeight,
}: SitesWindowProps) {
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
    if (selectedId != null && !sites.some((site) => site.id === selectedId)) {
      setSelectedId(null);
    }
  }, [sites, selectedId]);

  // Close the form after success; API errors open MessageDialog via formError effect.
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
  const selected = sites.find((site) => site.id === selectedId) ?? null;
  const hasSelection = selected != null;
  const canSave = Boolean(onSave || onCreate);

  const openNew = () => {
    if (!canEdit || busy) {
      return;
    }
    setShowFormErrors(false);
    setForm({
      open: true,
      mode: 'new',
      name: '',
      slug: '',
      enabled: true,
      hostIds: [],
    });
  };

  const openEdit = (site?: SitesWindowSite) => {
    const target = site ?? selected;
    if (!canEdit || !target || busy || !canSave) {
      return;
    }
    setSelectedId(target.id);
    setShowFormErrors(false);
    const assigned = hosts
      .filter((host) => host.siteId === target.id)
      .map((host) => host.id);
    setForm({
      open: true,
      mode: 'edit',
      siteId: target.id,
      name: target.name,
      slug: target.slug,
      enabled: target.enabled,
      hostIds: assigned,
      title: target.name,
    });
  };

  const closeForm = () => {
    setShowFormErrors(false);
    setForm({ open: false });
  };

  const handleFormSave = (payload: SiteFormSavePayload) => {
    setShowFormErrors(true);
    if (onSave) {
      onSave(payload);
      return;
    }
    if (payload.mode === 'new' && onCreate) {
      onCreate({ name: payload.name, slug: payload.slug });
      setForm({ open: false });
    }
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
    : `${sites.length} site${sites.length === 1 ? '' : 's'}`;
  const statusMid =
    error ??
    (selected
      ? selected.name
      : canEdit
        ? 'Select a site, or choose New.'
        : '');

  return (
    <HeadingPanelWindow
      className={cn('sites-window', className)}
      style={{ width, minHeight: 420, ...style }}
      inactive={inactive}
      resizable={resizable}
      title="Sites"
      titleIcon="sites"
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
          Multi-tenant sites bound to one or more hostnames.
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
          className="bg-white"
          style={tableMinHeight != null ? { minHeight: tableMinHeight } : undefined}
        >
          {loading && sites.length === 0 ? (
            <p style={{ margin: 8 }}>Loading sites…</p>
          ) : sites.length === 0 ? (
            <p style={{ margin: 8 }}>No sites yet.</p>
          ) : (
            <Table aria-label="Sites">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Hosts</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <TableRow
                    key={site.id}
                    highlighted={selectedId === site.id}
                    onClick={() =>
                      setSelectedId((current) => (current === site.id ? null : site.id))
                    }
                    onDoubleClick={() => openEdit(site)}
                  >
                    <td>{site.name}</td>
                    <td>{site.slug}</td>
                    <td>{site.hostCount}</td>
                    <td>{site.enabled ? 'Enabled' : 'Disabled'}</td>
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
            <SiteFormDialog
              key={`${form.mode}-${form.siteId ?? 'new'}`}
              mode={form.mode}
              initial={{
                siteId: form.siteId,
                name: form.name,
                slug: form.slug,
                enabled: form.enabled,
                hostIds: form.hostIds,
                title: form.title,
              }}
              hosts={hosts}
              fieldErrors={showFormErrors ? fieldErrors : undefined}
              saving={saving}
              onSave={handleFormSave}
              onError={showErrorAlert}
              onClose={closeForm}
              onAddHost={onAddHost}
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
