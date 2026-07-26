import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar, StatusBarField, TitleBarControl, TitleBarControls } from '../chrome';
import { DesktopIcon, type DesktopIconKind } from './DesktopIcon';
import { IconPanelWindow } from './IconPanelWindow';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from './PaneWindowShell';

const ICONS: { kind: DesktopIconKind; label: string; description: string }[] = [
  { kind: 'sites', label: 'Sites', description: 'Manage sites and their contents.' },
  { kind: 'hosts', label: 'Hosts', description: 'Add, remove and verify domains.' },
  { kind: 'roles', label: 'Roles', description: 'Add/remove custom roles.' },
  { kind: 'permissions', label: 'Permissions', description: 'Manage permissions.' },
  { kind: 'users', label: 'Users', description: 'Manage administrative users.' },
  { kind: 'settings', label: 'Settings', description: 'General settings for the admin area.' },
  { kind: 'themes', label: 'Themes', description: 'Manage frontend themes.' },
];

type StoryArgs = {
  titleIcon: TitleBarIconOption;
  width: number;
  paneHeight: number;
};

function ControlPanelDemo({ titleIcon, width, paneHeight }: StoryArgs) {
  const [selected, setSelected] = useState<(typeof ICONS)[number] | null>(null);

  return (
    <IconPanelWindow
      title="Control Panel"
      titleIcon={resolveTitleBarIcon(titleIcon)}
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" />
          <TitleBarControl action="Maximize" />
          <TitleBarControl action="Close" />
        </TitleBarControls>
      }
      paneHeight={paneHeight}
      width={width}
      infoUnselected={!selected}
      info={
        selected ? (
          <>
            <h1 className="info-title">{selected.label}</h1>
            <hr className="info-separator" />
            <p className="info-description">{selected.description}</p>
          </>
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
        <DesktopIcon
          key={icon.kind}
          kind={icon.kind}
          label={icon.label}
          description={icon.description}
          onActivate={() => setSelected(icon)}
        />
      ))}
    </IconPanelWindow>
  );
}

const meta = {
  title: 'Admin/Bricks/IconPanelWindow',
  parameters: { layout: 'centered' },
  args: {
    titleIcon: 'none' as TitleBarIconOption,
    width: 600,
    paneHeight: 300,
  },
  argTypes: {
    titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
    width: { control: { type: 'number', min: 320, max: 1200, step: 10 } },
    paneHeight: { control: { type: 'number', min: 120, max: 800, step: 10 } },
  },
  render: (args) => <ControlPanelDemo {...args} />,
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Per-story initial icon: override `args.titleIcon` (Controls can still change it). */
export const ControlPanel: Story = {
  args: {
    titleIcon: 'control-panel',
  },
};
