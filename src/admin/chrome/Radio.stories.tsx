import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';
import { FieldRow } from './FieldRow';

const meta = {
  title: 'Admin/Atoms/Radio',
  component: Radio,
  parameters: { layout: 'centered' },
  args: {
    id: 'r1',
    name: 'demo-radio',
    label: 'Selected',
    defaultChecked: true,
    disabled: false,
  },
  argTypes: {
    id: { control: 'text' },
    name: { control: 'text' },
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <>
      <FieldRow>
        <Radio {...args} />
      </FieldRow>
      <FieldRow>
        <Radio
          id={`${args.id}-idle`}
          name={args.name}
          label="Idle"
          disabled={args.disabled}
        />
      </FieldRow>
    </>
  ),
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof Radio>;

export const Group: Story = {};

export const DisabledGroup: Story = {
  args: { disabled: true, label: 'Selected disabled' },
};
