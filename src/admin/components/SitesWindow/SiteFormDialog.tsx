import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  Tab,
  TabList,
  TabPanel,
  TextBox,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cn } from '../../../lib/cn';

export type SiteFormHostOption = {
  id: number;
  host: string;
  /** Site currently owning this host, if any. */
  siteId?: number | null;
};

export type SiteFormMode = 'new' | 'edit';

export type SiteFormValues = {
  name: string;
  slug: string;
  enabled: boolean;
  hostIds: number[];
};

export type SiteFormSavePayload = SiteFormValues & {
  mode: SiteFormMode;
  siteId?: number;
};

export type SiteFormDialogProps = {
  mode: SiteFormMode;
  /** Prefilled when `mode === 'edit'`. */
  initial?: Partial<SiteFormValues> & { siteId?: number; title?: string };
  /** Existing hosts that can be assigned (checkbox list). */
  hosts?: SiteFormHostOption[];
  /** Marks invalid fields (no inline text — use {@link onError} / MessageDialog). */
  fieldErrors?: Partial<Record<'name' | 'slug', string>>;
  saving?: boolean;
  onSave: (payload: SiteFormSavePayload) => void;
  /** Validation / user-facing errors (caller shows MessageDialog + sound). */
  onError?: (message: string) => void;
  onClose: () => void;
  /**
   * Placeholder for Hosts → Add modal (Phase 6 Hosts slice).
   * When omitted, the Add button stays disabled.
   */
  onAddHost?: () => void;
  className?: string;
};

type FormTab = 'general' | 'hosts';

/**
 * New / Edit Site modal: General + Hosts tabs (nested `.window` tabpanel — not a shell window).
 */
export function SiteFormDialog({
  mode,
  initial,
  hosts = [],
  fieldErrors,
  saving = false,
  onSave,
  onError,
  onClose,
  onAddHost,
  className,
}: SiteFormDialogProps) {
  const nameId = useId();
  const slugId = useId();
  const enabledId = useId();
  const [tab, setTab] = useState<FormTab>('general');
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [hostIds, setHostIds] = useState<number[]>(initial?.hostIds ?? []);
  const [localErrors, setLocalErrors] = useState<Partial<Record<'name' | 'slug', string>>>(
    {},
  );

  useEffect(() => {
    setLocalErrors({});
  }, [fieldErrors]);

  const errors = { ...localErrors, ...fieldErrors };
  const title =
    mode === 'new'
      ? 'New Site'
      : `${initial?.title ?? initial?.name ?? 'Site'} Properties`;

  const toggleHost = (id: number, checked: boolean) => {
    setHostIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((hostId) => hostId !== id);
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextName = name.trim();
    const nextSlug = slug.trim().toLowerCase();
    const nextLocal: Partial<Record<'name' | 'slug', string>> = {};
    if (!nextName) {
      nextLocal.name = 'Name is required.';
    }
    if (!nextSlug) {
      nextLocal.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nextSlug)) {
      nextLocal.slug = 'Use lowercase letters, digits, and hyphens.';
    }

    setLocalErrors(nextLocal);
    if (Object.keys(nextLocal).length > 0) {
      setTab('general');
      onError?.(Object.values(nextLocal).join('\n'));
      return;
    }

    onSave({
      mode,
      siteId: initial?.siteId,
      name: nextName,
      slug: nextSlug,
      enabled,
      hostIds: [...hostIds],
    });
  };

  return (
    <PaneWindowShell
      className={cn('site-form-dialog', className)}
      width={480}
      title={title}
      titleIcon="sites"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form className="site-form-dialog-form" onSubmit={handleSubmit}>
        <TabList>
          <Tab
            selected={tab === 'general'}
            href="#site-form-general"
            onClick={(event) => {
              event.preventDefault();
              setTab('general');
            }}
          >
            General
          </Tab>
          <Tab
            selected={tab === 'hosts'}
            href="#site-form-hosts"
            onClick={(event) => {
              event.preventDefault();
              setTab('hosts');
            }}
          >
            Hosts
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
                    disabled={saving}
                    aria-invalid={Boolean(errors.name) || undefined}
                    onChange={(event) => setName(event.target.value)}
                  />
                </FieldRow>
                <FieldRow>
                  <TextBox
                    id={slugId}
                    label="Slug:"
                    accessKey="s"
                    value={slug}
                    disabled={saving}
                    aria-invalid={Boolean(errors.slug) || undefined}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                </FieldRow>
                <FieldRow>
                  <Checkbox
                    id={enabledId}
                    label="Enabled"
                    accessKey="e"
                    checked={enabled}
                    disabled={saving}
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0, marginBottom: 8 }}>
                  Assign existing hosts to this site. Use Add… later to open Hosts → Add.
                </p>
                <div className="site-form-host-list sunken-panel" role="group" aria-label="Hosts">
                  <div className="scrollable-viewport">
                    {hosts.length === 0 ? (
                      <p style={{ margin: 8 }}>No hosts available.</p>
                    ) : (
                      hosts.map((option) => {
                        const checkboxId = `${enabledId}-host-${option.id}`;
                        const assignedElsewhere =
                          option.siteId != null &&
                          (mode === 'new' || option.siteId !== initial?.siteId);
                        return (
                          <FieldRow key={option.id}>
                            <Checkbox
                              id={checkboxId}
                              label={
                                assignedElsewhere
                                  ? `${option.host} (site #${option.siteId})`
                                  : option.host
                              }
                              checked={hostIds.includes(option.id)}
                              disabled={saving}
                              onChange={(event) =>
                                toggleHost(option.id, event.target.checked)
                              }
                            />
                          </FieldRow>
                        );
                      })
                    )}
                  </div>
                </div>
                <FieldRow className="justify-end" style={{ marginTop: 8 }}>
                  <Button
                    type="button"
                    accessKey="a"
                    disabled={saving || !onAddHost}
                    title={
                      onAddHost
                        ? 'Add a new host'
                        : 'Opens Hosts → Add (coming soon)'
                    }
                    onClick={onAddHost}
                  >
                    Add…
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
          <Button type="button" accessKey="c" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      </form>
    </PaneWindowShell>
  );
}
