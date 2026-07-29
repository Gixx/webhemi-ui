import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
import { FieldRow } from '../FieldRow';
import { boxClassNameArgType, fieldAccessKeyArgType } from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Checkbox with `.field-box` wrapper (`input` then `label`). Wrap in FieldRow for form rows. Use `accessKey` for the control attribute and underline on plain-string labels.',
      },
    },
    controls: {
      include: ['id', 'label', 'defaultChecked', 'disabled', 'name', 'boxClassName', 'accessKey'],
    },
  },
  args: {
    id: 'cb-demo',
    label: 'Remember me',
    defaultChecked: false,
    disabled: false,
    boxClassName: '',
    accessKey: '',
  },
  argTypes: {
    id: { control: 'text' },
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
    boxClassName: boxClassNameArgType,
    accessKey: fieldAccessKeyArgType,
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <FieldRow>
      <Checkbox
        {...args}
        boxClassName={args.boxClassName || undefined}
        accessKey={args.accessKey || undefined}
      />
    </FieldRow>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { id: 'cb-on', label: 'Checked', defaultChecked: true },
};

export const AccessKey: Story = {
  args: { id: 'cb-ak', label: 'Remember me', accessKey: 'r' },
};

export const Disabled: Story = {
  args: { id: 'cb-dis', label: 'Disabled', disabled: true },
};
