import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
import { FieldRow } from '../FieldRow';

const meta = {
  title: 'Admin/Atoms/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  args: {
    id: 'cb-demo',
    label: 'Remember me',
    defaultChecked: false,
    disabled: false,
  },
  argTypes: {
    id: { control: 'text' },
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <FieldRow>
      <Checkbox {...args} />
    </FieldRow>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { id: 'cb-on', label: 'Checked', defaultChecked: true },
};

export const Disabled: Story = {
  args: { id: 'cb-dis', label: 'Disabled', disabled: true },
};
