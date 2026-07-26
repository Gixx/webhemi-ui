import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Admin/Atoms/Progress',
  component: Progress,
  parameters: { layout: 'centered' },
  args: {
    value: 40,
    segmented: false,
    style: { width: 200 },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    segmented: { control: 'boolean' },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Indicator: Story = {};

export const Segmented: Story = {
  args: { value: 70, segmented: true },
};
