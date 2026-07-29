import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';
import {
  boxClassNameArgType,
  fieldAccessKeyArgType,
  fieldLabelArgType,
  labelPositionArgType,
} from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Select control. Optional `label` wraps control + caption in `.field-box` (requires `id`).',
      },
    },
    controls: {
      include: [
        'id',
        'label',
        'labelPosition',
        'defaultValue',
        'disabled',
        'className',
        'boxClassName',
        'accessKey',
      ],
    },
  },
  args: {
    id: 'sel-demo',
    label: '',
    labelPosition: 'before' as const,
    className: 'w-window-xs',
    boxClassName: '',
    defaultValue: '3',
    disabled: false,
    accessKey: '',
  },
  argTypes: {
    id: { control: 'text' },
    label: fieldLabelArgType,
    labelPosition: labelPositionArgType,
    className: { control: 'text' },
    boxClassName: boxClassNameArgType,
    defaultValue: { control: 'select', options: ['1', '2', '3', '4', '5'] },
    disabled: { control: 'boolean' },
    accessKey: fieldAccessKeyArgType,
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <Select
      {...args}
      label={args.label || undefined}
      boxClassName={args.boxClassName || undefined}
      accessKey={args.accessKey || undefined}
    >
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

export const Labeled: Story = {
  args: {
    id: 'sel-rating',
    label: 'Rating:',
    accessKey: 'r',
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: undefined },
};
