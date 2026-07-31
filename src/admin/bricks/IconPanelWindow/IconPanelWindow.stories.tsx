import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { StatusBar, StatusBarField } from '../../chrome';
import { SystemIcon, type SystemIconKind } from '../../chrome/SystemIcon';
import { IconPanelWindow } from './IconPanelWindow';
import { IconPanelSelectionInfo } from './IconPanelSelectionInfo';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from '../_lib/windowBrickStory';

const ICONS: { kind: SystemIconKind; label: string; description: string }[] = [
  { kind: 'sites', label: 'Sites', description: 'Manage sites and their contents.' },
  { kind: 'hosts', label: 'Hosts', description: 'Add, remove and verify domains.' },
  { kind: 'roles', label: 'Roles', description: 'Add/remove custom roles.' },
  { kind: 'permissions', label: 'Permissions', description: 'Manage permissions.' },
  { kind: 'users', label: 'Users', description: 'Manage administrative users.' },
  { kind: 'settings', label: 'Settings', description: 'General settings for the admin area.' },
  { kind: 'themes', label: 'Themes', description: 'Manage frontend themes.' },
];

type StoryArgs = WindowBrickShellArgs & {
  width: number;
  paneHeight: number;
};

function ControlPanelDemo(args: StoryArgs) {
  const [selected, setSelected] = useState<(typeof ICONS)[number] | null>(null);

  return (
    <IconPanelWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      paneHeight={args.paneHeight}
      width={args.width}
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
    ...windowBrickShellArgs,
    title: 'Control Panel',
    titleBarControls: ['Minimize', 'Maximize', 'Close'],
    resizable: true,
    width: 600,
    paneHeight: 300,
  },
  argTypes: {
    ...windowBrickShellArgTypes,
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sites = ICONS[0];

    await userEvent.click(canvas.getByRole('link', { name: sites.label }));

    await expect(canvas.getByRole('heading', { name: sites.label })).toBeVisible();
    await expect(canvasElement.querySelector('.panel.info .info-icon')).toBeTruthy();
    await expect(
      canvas.getByText(sites.description, { selector: '.info-description' }),
    ).toBeVisible();
    await expect(
      canvas.getByText(sites.description, { selector: '.status-bar-field.description' }),
    ).toBeVisible();
  },
};
