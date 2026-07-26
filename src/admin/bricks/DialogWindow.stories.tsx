import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FieldRow } from '../chrome';
import bannerDialogUrl from '../assets/demo/banner-dialog.gif';
import { DialogWindow, type DialogWindowType } from './DialogWindow';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from './PaneWindowShell';

const DIALOG_TYPES: DialogWindowType[] = ['none', 'info', 'question', 'warning', 'error'];

type StoryArgs = {
  title: string;
  inactive: boolean;
  type: DialogWindowType;
  titleIcon: TitleBarIconOption;
  /** Banner image URL; empty string hides the banner. */
  banner: string;
};

const meta = {
  title: 'Admin/Bricks/DialogWindow',
  parameters: { layout: 'centered' },
  args: {
    title: 'Enter Password',
    inactive: false,
    type: 'none' as DialogWindowType,
    titleIcon: 'none' as TitleBarIconOption,
    banner: bannerDialogUrl,
  },
  argTypes: {
    title: { control: 'text' },
    inactive: { control: 'boolean' },
    type: { control: 'select', options: DIALOG_TYPES },
    titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
    banner: { control: 'text', description: 'Banner image URL (empty = no banner)' },
  },
  render: ({ title, inactive, type, titleIcon, banner }) => (
    <DialogWindow
      title={title}
      inactive={inactive}
      type={type}
      titleIcon={resolveTitleBarIcon(titleIcon)}
      titleBarControls={null}
      banner={banner ? <img className="login-banner" src={banner} alt="" /> : undefined}
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
  },
  render: ({ title, inactive, type, titleIcon, banner }) => (
    <DialogWindow
      title={title}
      inactive={inactive}
      type={type}
      titleIcon={resolveTitleBarIcon(titleIcon)}
      banner={banner ? <img className="login-banner" src={banner} alt="" /> : undefined}
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
