import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FieldRow } from '../chrome';
import bannerDialogUrl from '../assets/demo/banner-dialog.gif';
import { DialogWindow, type DialogWindowType } from './DialogWindow';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from './windowBrickStory';

const DIALOG_TYPES: DialogWindowType[] = ['none', 'info', 'question', 'warning', 'error'];

type StoryArgs = WindowBrickShellArgs & {
  type: DialogWindowType;
  /** Banner image URL; empty string hides the banner. */
  banner: string;
};

const meta = {
  title: 'Admin/Bricks/DialogWindow',
  parameters: { layout: 'centered' },
  args: {
    ...windowBrickShellArgs,
    title: 'Enter Password',
    titleBarControls: [],
    type: 'none' as DialogWindowType,
    banner: bannerDialogUrl,
  },
  argTypes: {
    ...windowBrickShellArgTypes,
    type: { control: 'select', options: DIALOG_TYPES },
    banner: { control: 'text', description: 'Banner image URL (empty = no banner)' },
  },
  render: (args) => (
    <DialogWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      type={args.type}
      banner={args.banner ? <img className="dialog-banner" src={args.banner} alt="" /> : undefined}
      actions={
        <FieldRow className="justify-end">
          <Button isDefault>
            <u>O</u>K
          </Button>
          <Button disabled>
            <u>C</u>ancel
          </Button>
          <Button>
            <u>R</u>egister
          </Button>
        </FieldRow>
      }
    >
      <FieldRow>
        <label htmlFor="dlg-user">
          <u>U</u>ser name:
        </label>
        <input id="dlg-user" className="w-window-xs" type="text" />
      </FieldRow>
      <FieldRow>
        <label htmlFor="dlg-pass">
          <u>P</u>assword:
        </label>
        <input id="dlg-pass" className="w-window-xs" type="password" />
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
