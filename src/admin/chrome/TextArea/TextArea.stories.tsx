import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
import {
  boxClassNameArgType,
  fieldAccessKeyArgType,
  fieldLabelArgType,
  labelPositionArgType,
} from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multiline text. Optional `label` wraps control + caption in `.field-box`. `resizable` defaults to `none`.',
      },
    },
    controls: {
      include: [
        'id',
        'label',
        'labelPosition',
        'rows',
        'defaultValue',
        'disabled',
        'readOnly',
        'placeholder',
        'className',
        'boxClassName',
        'resizable',
        'accessKey',
      ],
    },
  },
  args: {
    id: 'ta-demo',
    label: '',
    labelPosition: 'before' as const,
    rows: 3,
    className: 'w-window-sm',
    boxClassName: '',
    defaultValue: 'Multiline text',
    disabled: false,
    readOnly: false,
    resizable: 'none' as const,
    accessKey: '',
  },
  argTypes: {
    id: { control: 'text' },
    label: fieldLabelArgType,
    labelPosition: labelPositionArgType,
    rows: { control: { type: 'number', min: 1, max: 12 } },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    boxClassName: boxClassNameArgType,
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    resizable: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'CSS resize axis (default none)',
      table: {
        type: { summary: "'none' | 'vertical' | 'horizontal' | 'both'" },
        defaultValue: { summary: 'none' },
      },
    },
    accessKey: fieldAccessKeyArgType,
  },
  render: (args) => (
    <TextArea
      {...args}
      label={args.label || undefined}
      boxClassName={args.boxClassName || undefined}
      accessKey={args.accessKey || undefined}
    />
  ),
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {};

export const Labeled: Story = {
  args: {
    id: 'ta-notes',
    label: 'Notes:',
    defaultValue: '',
    accessKey: 'n',
  },
};

export const ResizableVertical: Story = {
  args: { resizable: 'vertical', defaultValue: 'Drag the bottom edge', label: undefined },
};

export const Disabled: Story = {
  args: { defaultValue: 'Disabled', disabled: true, label: undefined },
};
