import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Admin/Atoms/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: {
    className: 'w-window-xs',
    defaultValue: '3',
    disabled: false,
  },
  argTypes: {
    className: { control: 'text' },
    defaultValue: { control: 'select', options: ['1', '2', '3', '4', '5'] },
    disabled: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <Select {...args}>
      <option value="5">5 - Incredible!</option>
      <option value="4">4 - Great!</option>
      <option value="3">3 - Pretty good</option>
      <option value="2">2 - Not so great</option>
      <option value="1">1 - Unfortunate</option>
    </Select>
  ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Closed: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
