import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FieldRow, TextBox } from '../../chrome';
import { adminAsset } from '../../lib/assetPaths';
import { DialogWindow, type DialogWindowType } from './DialogWindow';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from '../_lib/windowBrickStory';

const DIALOG_TYPES: DialogWindowType[] = ['none', 'info', 'question', 'warning', 'error'];

const accessKeyArgType = {
  control: 'text' as const,
  table: {
    category: 'Accessibility',
    type: { summary: 'string' },
  },
};

type StoryArgs = WindowBrickShellArgs & {
  type: DialogWindowType;
  /** Banner image URL; empty string hides the banner. */
  banner: string;
  okAccessKey: string;
  cancelAccessKey: string;
  registerAccessKey: string;
  userAccessKey: string;
  passwordAccessKey: string;
};

const meta = {
  title: 'Admin/Bricks/DialogWindow',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog layout brick. Form fields and action buttons accept `accessKey` on the atoms (see Controls → Accessibility).',
      },
    },
  },
  args: {
    ...windowBrickShellArgs,
    title: 'Enter Password',
    titleBarControls: [],
    type: 'none' as DialogWindowType,
    banner: adminAsset('system/banner-dialog-login.gif'),
    okAccessKey: 'o',
    cancelAccessKey: 'c',
    registerAccessKey: 'r',
    userAccessKey: 'u',
    passwordAccessKey: 'p',
  },
  argTypes: {
    ...windowBrickShellArgTypes,
    type: { control: 'select', options: DIALOG_TYPES },
    banner: { control: 'text', description: 'Banner image URL (empty = no banner)' },
    okAccessKey: { ...accessKeyArgType, name: 'OK accessKey', description: 'Button access key' },
    cancelAccessKey: {
      ...accessKeyArgType,
      name: 'Cancel accessKey',
      description: 'Button access key',
    },
    registerAccessKey: {
      ...accessKeyArgType,
      name: 'Register accessKey',
      description: 'Button access key',
    },
    userAccessKey: {
      ...accessKeyArgType,
      name: 'User name accessKey',
      description: 'TextBox access key (control + label underline)',
    },
    passwordAccessKey: {
      ...accessKeyArgType,
      name: 'Password accessKey',
      description: 'TextBox access key (control + label underline)',
    },
  },
  render: (args) => (
    <DialogWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      type={args.type}
      banner={args.banner ? <img className="dialog-banner" src={args.banner} alt="" /> : undefined}
      actions={
        <FieldRow className="justify-end">
          <Button isDefault accessKey={args.okAccessKey || undefined}>
            OK
          </Button>
          <Button disabled accessKey={args.cancelAccessKey || undefined}>
            Cancel
          </Button>
          <Button accessKey={args.registerAccessKey || undefined}>Register</Button>
        </FieldRow>
      }
    >
      <FieldRow>
        <TextBox
          id="dlg-user"
          label="User name:"
          accessKey={args.userAccessKey || undefined}
          className="w-window-xs"
          type="text"
        />
      </FieldRow>
      <FieldRow>
        <TextBox
          id="dlg-pass"
          label="Password:"
          accessKey={args.passwordAccessKey || undefined}
          className="w-window-xs"
          type="password"
        />
      </FieldRow>
    </DialogWindow>
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/** Classic message box — icon + indented body; actions full width. */
export const Message: Story = {
  args: {
    title: 'Confirm',
    banner: '',
    type: 'warning',
    titleBarControls: ['Close'],
  },
  argTypes: {
    okAccessKey: { table: { disable: true }, control: false },
    cancelAccessKey: { table: { disable: true }, control: false },
    registerAccessKey: { table: { disable: true }, control: false },
    userAccessKey: { table: { disable: true }, control: false },
    passwordAccessKey: { table: { disable: true }, control: false },
  },
  render: (args) => (
    <DialogWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      type={args.type}
      banner={args.banner ? <img className="dialog-banner" src={args.banner} alt="" /> : undefined}
      actions={
        <FieldRow className="justify-center">
          <Button isDefault>OK</Button>
          <Button>Cancel</Button>
        </FieldRow>
      }
    >
      <p>You must save the changes before closing the editor.</p>
      <p>Click OK to save and close, or click Cancel to continue editing.</p>
    </DialogWindow>
  ),
};
