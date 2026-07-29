import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';
import { FieldRow } from '../FieldRow';
import { boxClassNameArgType, fieldAccessKeyArgType } from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Radio with `.field-box` wrapper (`input` then `label`). Wrap in FieldRow for form rows. Use `accessKey` for the control attribute and underline on plain-string labels.',
      },
    },
    controls: {
      include: ['id', 'name', 'label', 'defaultChecked', 'disabled', 'boxClassName', 'accessKey'],
    },
  },
  args: {
    id: 'r1',
    name: 'demo-radio',
    label: 'Selected',
    defaultChecked: true,
    disabled: false,
    boxClassName: '',
    accessKey: '',
  },
  argTypes: {
    id: { control: 'text' },
    name: { control: 'text' },
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    boxClassName: boxClassNameArgType,
    accessKey: fieldAccessKeyArgType,
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <>
      <FieldRow>
        <Radio
          {...args}
          boxClassName={args.boxClassName || undefined}
          accessKey={args.accessKey || undefined}
        />
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

export const AccessKey: Story = {
  args: { accessKey: 's', label: 'Selected' },
};

export const DisabledGroup: Story = {
  args: { disabled: true, label: 'Selected disabled' },
};
