import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  args: {
    placeholder: 'admin@example.com',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'bad' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked' } };
