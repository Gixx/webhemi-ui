import { useState, type CSSProperties } from 'react';
import {
  StatusBar,
  StatusBarField,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { IconPanelWindow } from '../../bricks/IconPanelWindow';
import { IconPanelSelectionInfo } from '../../bricks/IconPanelWindow/IconPanelSelectionInfo';
import { SystemIcon, type SystemIconKind } from '../../chrome/SystemIcon';

const ICONS: { kind: SystemIconKind; label: string; description: string }[] = [
  { kind: 'sites', label: 'Sites', description: 'Manage sites and their contents.' },
  { kind: 'hosts', label: 'Hosts', description: 'Add, remove and verify domains.' },
  { kind: 'roles', label: 'Roles', description: 'Add/remove custom roles.' },
  { kind: 'permissions', label: 'Permissions', description: 'Manage permissions.' },
  { kind: 'users', label: 'Users', description: 'Manage administrative users.' },
  { kind: 'settings', label: 'Settings', description: 'General settings for the admin area.' },
  { kind: 'themes', label: 'Themes', description: 'Manage frontend themes.' },
];

export type ControlPanelProps = {
  onClose: () => void;
  /** Open the Sites shell window (Phase 6). */
  onOpenSites?: () => void;
  /** Open the Hosts shell window (Phase 6). */
  onOpenHosts?: () => void;
  /** Open the Settings shell window. */
  onOpenSettings?: () => void;
  /** Open the Permissions shell window. */
  onOpenPermissions?: () => void;
  /** Open the Roles shell window. */
  onOpenRoles?: () => void;
  /** Wired in Phase 5 shell; no-op until then. */
  onMinimize?: () => void;
  /** Wired in Phase 5 shell; no-op until then. Requires `resizable`. */
  onMaximize?: () => void;
  /** Bring this window to front (Phase 4: bump z-index via parent). */
  onActivate?: () => void;
  /** Inactive title-bar when another shell window is focused. */
  inactive?: boolean;
  /** When true, Maximize control shows Restore. */
  maximized?: boolean;
  /**
   * Window may be resized / maximized (default true).
   * When false, Maximize/Restore is not shown.
   */
  resizable?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
  paneHeight?: number;
};

/**
 * Control Panel product surface: IconPanelWindow + static admin icons.
 * Sites / Hosts / Settings / Permissions / Roles open via callbacks; other icons are
 * selection-only until later slices.
 */
export function ControlPanel({
  onClose,
  onOpenSites,
  onOpenHosts,
  onOpenSettings,
  onOpenPermissions,
  onOpenRoles,
  onMinimize,
  onMaximize,
  onActivate,
  inactive = false,
  maximized = false,
  resizable = true,
  className,
  style,
  width = 600,
  paneHeight = 300,
}: ControlPanelProps) {
  const [selected, setSelected] = useState<(typeof ICONS)[number] | null>(null);

  return (
    <IconPanelWindow
      className={className}
      style={style}
      width={width}
      inactive={inactive}
      resizable={resizable}
      paneHeight={paneHeight}
      title="Control Panel"
      titleIcon="control-panel"
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
      infoUnselected={!selected}
      info={
        selected ? (
          <IconPanelSelectionInfo
            kind={selected.kind}
            label={selected.label}
            description={selected.description}
          />
        ) : null
      }
      statusBar={
        <StatusBar>
          <StatusBarField>{ICONS.length} items</StatusBarField>
          <StatusBarField className="description">{selected?.description ?? ''}</StatusBarField>
          <StatusBarField />
        </StatusBar>
      }
    >
      {ICONS.map((icon) => {
        const onOpen =
          icon.kind === 'sites'
            ? onOpenSites
            : icon.kind === 'hosts'
              ? onOpenHosts
              : icon.kind === 'settings'
                ? onOpenSettings
                : icon.kind === 'permissions'
                  ? onOpenPermissions
                  : icon.kind === 'roles'
                    ? onOpenRoles
                    : undefined;
        return (
          <SystemIcon
            key={icon.kind}
            kind={icon.kind}
            label={icon.label}
            labelTone="dark"
            onActivate={() => setSelected(icon)}
            onOpen={onOpen}
          />
        );
      })}
    </IconPanelWindow>
  );
}
