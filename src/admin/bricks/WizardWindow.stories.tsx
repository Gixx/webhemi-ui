import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FieldRow } from '../chrome';
import bannerWizardUrl from '../assets/demo/banner-wizard.gif';
import {
  resolveTitleBarIcon,
  TITLE_BAR_ICON_OPTIONS,
  type TitleBarIconOption,
} from './PaneWindowShell';
import { WizardWindow } from './WizardWindow';

type StoryArgs = {
  title: string;
  titleIcon: TitleBarIconOption;
  /** Banner image URL; empty string leaves the navy banner panel empty. */
  banner: string;
};

const meta = {
  title: 'Admin/Bricks/WizardWindow',
  parameters: { layout: 'centered' },
  args: {
    title: 'WebHemi CMS Setup',
    titleIcon: 'none' as TitleBarIconOption,
    banner: bannerWizardUrl,
  },
  argTypes: {
    title: { control: 'text' },
    titleIcon: { control: 'select', options: [...TITLE_BAR_ICON_OPTIONS] },
    banner: { control: 'text', description: 'Banner image URL (empty = no image)' },
  },
  render: ({ title, titleIcon, banner }) => (
    <WizardWindow
      title={title}
      titleIcon={resolveTitleBarIcon(titleIcon)}
      titleBarControls={null}
      banner={banner ? <img src={banner} alt="" /> : undefined}
      info={
        <>
          <h4>Welcome to the WebHemi CMS Setup Wizard</h4>
          <p>
            This wizard helps you install WebHemi on your server. Click Next to continue with
            Setup.
          </p>
        </>
      }
      actions={
        <FieldRow className="justify-center">
          <Button disabled>&lt; Back</Button>
          <Button>Next &gt;</Button>
        </FieldRow>
      }
    />
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};
