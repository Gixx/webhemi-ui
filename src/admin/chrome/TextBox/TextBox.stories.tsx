import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextBox } from './TextBox';
import {
  boxClassNameArgType,
  fieldAccessKeyArgType,
  fieldLabelArgType,
  labelPositionArgType,
} from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/TextBox',
  component: TextBox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Single-line text control. Optional `label` wraps control + caption in `.field-box` (requires `id`). Use `labelPosition` `before` | `above`.',
      },
    },
    controls: {
      include: [
        'id',
        'label',
        'labelPosition',
        'defaultValue',
        'type',
        'disabled',
        'readOnly',
        'placeholder',
        'className',
        'boxClassName',
        'accessKey',
      ],
    },
  },
  args: {
    id: 'tb-demo',
    label: '',
    labelPosition: 'before' as const,
    defaultValue: 'Sample text',
    className: 'w-window-xs',
    boxClassName: '',
    type: 'text',
    disabled: false,
    readOnly: false,
    accessKey: '',
  },
  argTypes: {
    id: { control: 'text' },
    label: fieldLabelArgType,
    labelPosition: labelPositionArgType,
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    boxClassName: boxClassNameArgType,
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    accessKey: fieldAccessKeyArgType,
  },
  render: (args) => (
    <TextBox
      {...args}
      label={args.label || undefined}
      boxClassName={args.boxClassName || undefined}
      accessKey={args.accessKey || undefined}
    />
  ),
} satisfies Meta<typeof TextBox>;

export default meta;
type Story = StoryObj<typeof TextBox>;

export const Text: Story = {};

export const Labeled: Story = {
  args: {
    id: 'tb-name',
    label: 'Name:',
    defaultValue: '',
    accessKey: 'n',
  },
};

export const LabelAbove: Story = {
  args: {
    id: 'tb-city',
    label: 'City:',
    labelPosition: 'above',
    defaultValue: '',
    className: undefined,
  },
};

export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret', label: undefined },
};

export const Disabled: Story = {
  args: { defaultValue: 'Disabled', disabled: true, label: undefined },
};
