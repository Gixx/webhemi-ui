import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Checkbox,
  FieldRow,
  GroupBox,
  TitleBarControl,
  TitleBarControls,
} from '../chrome';
import { HeadingPanelWindow } from './HeadingPanelWindow';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from './PaneWindowShell';

type StoryArgs = {
  title: string;
  titleIcon: TitleBarIconOption;
};

const meta = {
  title: 'Admin/Bricks/HeadingPanelWindow',
  parameters: { layout: 'centered' },
  args: {
    title: 'Settings',
    titleIcon: 'none' as TitleBarIconOption,
  },
  argTypes: {
    title: { control: 'text' },
    titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
  },
  render: ({ title, titleIcon }) => (
    <HeadingPanelWindow
      title={title}
      titleIcon={resolveTitleBarIcon(titleIcon)}
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Minimize" />
          <TitleBarControl action="Maximize" disabled />
          <TitleBarControl action="Close" />
        </TitleBarControls>
      }
      heading={<p style={{ margin: '8px 12px', fontWeight: 700 }}>General options</p>}
      actions={
        <FieldRow className="justify-end">
          <Button isDefault>OK</Button>
          <Button>Cancel</Button>
        </FieldRow>
      }
    >
      <GroupBox legend="Session">
        <FieldRow>
          <Checkbox id="idle" label="Automatically logout after 10 minutes of idle" defaultChecked />
        </FieldRow>
      </GroupBox>
      <GroupBox legend="Display">
        <FieldRow>
          <Checkbox id="compat" label="Compatible mode" disabled />
        </FieldRow>
      </GroupBox>
    </HeadingPanelWindow>
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Per-story initial icon: override `args.titleIcon` (Controls can still change it). */
export const SettingsLike: Story = {
  args: {
    titleIcon: 'settings',
  },
};
