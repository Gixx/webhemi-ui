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
  /** Wired in Phase 5 shell; no-op until then. */
  onMinimize?: () => void;
  /** Wired in Phase 5 shell; no-op until then. */
  onMaximize?: () => void;
  /** Bring this window to front (Phase 4: bump z-index via parent). */
  onActivate?: () => void;
  className?: string;
  style?: CSSProperties;
  width?: number;
  paneHeight?: number;
};

/**
 * Control Panel product surface: IconPanelWindow + static admin icons.
 * Icon open/CRUD is Phase 6; selection only updates the info column.
 */
export function ControlPanel({
  onClose,
  onMinimize,
  onMaximize,
  onActivate,
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
      draggable
      resizable
      paneHeight={paneHeight}
      title="Control Panel"
      titleIcon="control-panel"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" onClick={onMinimize} />
          <TitleBarControl action="Maximize" onClick={onMaximize} />
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
      {ICONS.map((icon) => (
        <SystemIcon
          key={icon.kind}
          kind={icon.kind}
          label={icon.label}
          labelTone="dark"
          description={icon.description}
          onActivate={() => setSelected(icon)}
        />
      ))}
    </IconPanelWindow>
  );
}
