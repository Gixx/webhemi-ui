import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FieldRow } from '../../chrome';
import bannerWizardUrl from '../../assets/demo/banner-wizard.gif';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from '../_lib/windowBrickStory';
import { WizardWindow } from './WizardWindow';

type StoryArgs = WindowBrickShellArgs & {
  /** Banner image URL; empty string leaves the navy banner panel empty. */
  banner: string;
};

const meta = {
  title: 'Admin/Bricks/WizardWindow',
  parameters: { layout: 'centered' },
  args: {
    ...windowBrickShellArgs,
    title: 'WebHemi CMS Setup',
    titleBarControls: [],
    banner: bannerWizardUrl,
  },
  argTypes: {
    ...windowBrickShellArgTypes,
    banner: { control: 'text', description: 'Banner image URL (empty = no image)' },
  },
  render: (args) => (
    <WizardWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      banner={args.banner ? <img src={args.banner} alt="" /> : undefined}
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
