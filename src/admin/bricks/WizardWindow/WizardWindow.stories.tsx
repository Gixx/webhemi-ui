import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { Button, FieldRow } from '../../chrome';
import { adminAsset } from '../../lib/assetPaths';
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
  component: WizardWindow as unknown as ComponentType<StoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Setup / wizard layout brick: banner | info, actions below.',
      },
      source: {
        language: 'tsx',
        code: `import { Button, FieldRow, WizardWindow } from '@webhemi/ui';

<WizardWindow
  title="WebHemi CMS Setup"
  banner={<img src="/assets/admin/system/banner-wizard.gif" alt="" />}
  info={
    <>
      <h4>Welcome</h4>
      <p>Click Next to continue.</p>
    </>
  }
  actions={
    <FieldRow className="justify-center">
      <Button disabled>&lt; Back</Button>
      <Button>Next &gt;</Button>
    </FieldRow>
  }
/>`,
      },
    },
  },
  args: {
    ...windowBrickShellArgs,
    title: 'WebHemi CMS Setup',
    titleBarControls: [],
    banner: adminAsset('system/banner-wizard.gif'),
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
