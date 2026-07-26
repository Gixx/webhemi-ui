import type { Meta, StoryObj } from '@storybook/react-vite';
import { SunkenPanel, FieldBorder } from './SunkenPanel';

type PanelArgs = {
  content: string;
  width: number;
  height: number;
  padding: number;
};

const meta = {
  title: 'Admin/Atoms/SunkenPanel',
  component: SunkenPanel,
  parameters: { layout: 'centered' },
  args: {
    content: 'Sunken panel content',
    width: 280,
    height: 80,
    padding: 8,
  },
  argTypes: {
    content: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 40, max: 400 } },
    padding: { control: { type: 'number', min: 0, max: 24 } },
  },
  render: (args) => (
    <SunkenPanel style={{ width: args.width, height: args.height, padding: args.padding }}>
      {args.content}
    </SunkenPanel>
  ),
} satisfies Meta<PanelArgs>;

export default meta;
type Story = StoryObj<PanelArgs>;

export const Panel: Story = {};

type BorderArgs = {
  content: string;
  width: number;
  height: number;
  padding: number;
  disabled: boolean;
};

export const Border: StoryObj<BorderArgs> = {
  name: 'FieldBorder',
  args: {
    content: 'Field border',
    width: 200,
    height: 40,
    padding: 4,
    disabled: false,
  },
  argTypes: {
    content: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 24, max: 200 } },
    padding: { control: { type: 'number', min: 0, max: 24 } },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <FieldBorder
      disabled={args.disabled}
      style={{ width: args.width, height: args.height, padding: args.padding }}
    >
      {args.content}
    </FieldBorder>
  ),
};
