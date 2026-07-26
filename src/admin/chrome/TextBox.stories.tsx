import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextBox } from './TextBox';

const meta = {
  title: 'Admin/Atoms/TextBox',
  component: TextBox,
  parameters: { layout: 'centered' },
  args: {
    defaultValue: 'Sample text',
    className: 'w-window-xs',
    type: 'text',
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof TextBox>;

export default meta;
type Story = StoryObj<typeof TextBox>;

export const Text: Story = {};

export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret' },
};

export const Disabled: Story = {
  args: { defaultValue: 'Disabled', disabled: true },
};
