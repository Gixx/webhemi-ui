import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta = {
  title: 'Admin/Atoms/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  args: {
    min: 0,
    max: 100,
    defaultValue: 40,
    boxIndicator: false,
    vertical: false,
    disabled: false,
    style: { width: 200 },
  },
  argTypes: {
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    defaultValue: { control: { type: 'range', min: 0, max: 100 } },
    boxIndicator: { control: 'boolean' },
    vertical: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof Slider>;

export const Range: Story = {};

export const BoxIndicator: Story = {
  args: { boxIndicator: true, defaultValue: 60 },
};

export const Vertical: Story = {
  args: { vertical: true, defaultValue: 30, style: undefined },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 40 },
};

export const DisabledBoxIndicator: Story = {
  args: { disabled: true, boxIndicator: true, defaultValue: 60 },
};
