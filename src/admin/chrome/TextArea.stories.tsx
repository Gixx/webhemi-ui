import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';

const meta = {
  title: 'Admin/Atoms/TextArea',
  component: TextArea,
  parameters: { layout: 'centered' },
  args: {
    rows: 3,
    className: 'w-window-sm',
    defaultValue: 'Multiline text',
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 12 } },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { defaultValue: 'Disabled', disabled: true },
};
