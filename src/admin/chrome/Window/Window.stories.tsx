import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from '../../bricks/_lib/titleBarIcon';
import {
  Window,
  TitleBar,
  TitleBarText,
  TitleBarControls,
  TitleBarControl,
  WindowBody,
  StatusBar,
  StatusBarField,
} from './Window';

type WindowStoryArgs = {
  title: string;
  body: string;
  inactive: boolean;
  status: string;
  titleIcon: TitleBarIconOption;
  /** Adds `.resizable` — required for Maximize / Restore. */
  resizable: boolean;
  showMinimize: boolean;
  showMaximize: boolean;
  showRestore: boolean;
  showHelp: boolean;
  showClose: boolean;
  maximizeDisabled: boolean;
  width: number;
};

const meta = {
  title: 'Admin/Atoms/Window',
  component: Window as unknown as ComponentType<WindowStoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Retro OS window chrome: compose TitleBar / WindowBody / StatusBar as children.',
      },
      source: {
        language: 'tsx',
        code: `import {
  StatusBar,
  StatusBarField,
  TitleBar,
  TitleBarControl,
  TitleBarControls,
  TitleBarText,
  Window,
  WindowBody,
} from '@webhemi/ui';

<Window style={{ width: 320 }}>
  <TitleBar>
    <TitleBarText>Active window</TitleBarText>
    <TitleBarControls>
      <TitleBarControl action="Minimize" />
      <TitleBarControl action="Maximize" />
      <TitleBarControl action="Close" />
    </TitleBarControls>
  </TitleBar>
  <WindowBody>
    <p>Window body content.</p>
  </WindowBody>
  <StatusBar>
    <StatusBarField>Ready</StatusBarField>
    <StatusBarField />
    <StatusBarField />
  </StatusBar>
</Window>`,
      },
    },
  },
  args: {
    title: 'Active window',
    body: 'Window body content.',
    inactive: false,
    status: 'Ready',
    titleIcon: 'none' as TitleBarIconOption,
    resizable: true,
    showMinimize: true,
    showMaximize: true,
    showRestore: false,
    showHelp: false,
    showClose: true,
    maximizeDisabled: false,
    width: 320,
  },
  argTypes: {
    title: { control: 'text' },
    body: { control: 'text' },
    inactive: { control: 'boolean' },
    status: { control: 'text' },
    titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
    resizable: {
      control: 'boolean',
      description: 'When false, Maximize/Restore are not shown (Win98 invariant)',
    },
    showMinimize: { control: 'boolean' },
    showMaximize: {
      control: 'boolean',
      if: { arg: 'resizable', truthy: true },
    },
    showRestore: {
      control: 'boolean',
      if: { arg: 'resizable', truthy: true },
    },
    showHelp: { control: 'boolean' },
    showClose: { control: 'boolean' },
    maximizeDisabled: {
      control: 'boolean',
      if: { arg: 'resizable', truthy: true },
    },
    width: { control: { type: 'number', min: 200, max: 640 } },
  },
  render: (args) => {
    const showMaximize = args.resizable && args.showMaximize;
    const showRestore = args.resizable && args.showRestore;
    return (
      <Window className={args.resizable ? 'resizable' : undefined} style={{ width: args.width }}>
        <TitleBar inactive={args.inactive}>
          <TitleBarText className={resolveTitleBarIcon(args.titleIcon)}>{args.title}</TitleBarText>
          <TitleBarControls>
            {args.showMinimize ? <TitleBarControl action="Minimize" /> : null}
            {showMaximize ? (
              <TitleBarControl action="Maximize" disabled={args.maximizeDisabled} />
            ) : null}
            {showRestore ? <TitleBarControl action="Restore" /> : null}
            {args.showHelp ? <TitleBarControl action="Help" /> : null}
            {args.showClose ? <TitleBarControl action="Close" /> : null}
          </TitleBarControls>
        </TitleBar>
        <WindowBody>
          <p>{args.body}</p>
        </WindowBody>
        {args.status ? (
          <StatusBar>
            <StatusBarField>{args.status}</StatusBarField>
            <StatusBarField></StatusBarField>
            <StatusBarField></StatusBarField>
          </StatusBar>
        ) : null}
      </Window>
    );
  },
} satisfies Meta<WindowStoryArgs>;

export default meta;
type Story = StoryObj<WindowStoryArgs>;

export const Active: Story = {};

export const Inactive: Story = {
  args: {
    title: 'Inactive window',
    body: 'Background window.',
    inactive: true,
    status: '',
  },
};

export const AllControls: Story = {
  args: {
    title: 'All controls',
    body: 'Every title-bar control glyph.',
    showRestore: true,
    showHelp: true,
    width: 400,
    status: '',
  },
};
