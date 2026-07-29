import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';
import {
  boxClassNameArgType,
  fieldAccessKeyArgType,
  fieldLabelArgType,
  labelPositionArgType,
} from '../_lib/fieldBoxStory';

const meta = {
  title: 'Admin/Atoms/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Horizontal range control. Optional `label` wraps control + caption in `.field-box` (requires `id`).',
      },
    },
    controls: {
      include: [
        'id',
        'label',
        'labelPosition',
        'min',
        'max',
        'defaultValue',
        'boxIndicator',
        'disabled',
        'boxClassName',
        'accessKey',
      ],
    },
  },
  args: {
    id: 'slider-demo',
    label: '',
    labelPosition: 'before' as const,
    min: 0,
    max: 100,
    defaultValue: 40,
    boxIndicator: false,
    disabled: false,
    boxClassName: '',
    accessKey: '',
    style: { width: 200 },
  },
  argTypes: {
    id: { control: 'text' },
    label: fieldLabelArgType,
    labelPosition: labelPositionArgType,
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    defaultValue: { control: { type: 'range', min: 0, max: 100 } },
    boxIndicator: { control: 'boolean' },
    disabled: { control: 'boolean' },
    boxClassName: boxClassNameArgType,
    accessKey: fieldAccessKeyArgType,
    onChange: { action: 'changed' },
  },
  render: (args) => (
    <Slider
      {...args}
      label={args.label || undefined}
      boxClassName={args.boxClassName || undefined}
      accessKey={args.accessKey || undefined}
    />
  ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof Slider>;

export const Range: Story = {};

export const Labeled: Story = {
  args: {
    id: 'slider-volume',
    label: 'Level:',
    accessKey: 'l',
  },
};

export const BoxIndicator: Story = {
  args: { boxIndicator: true, defaultValue: 60, label: undefined },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 40, label: undefined },
};

export const DisabledBoxIndicator: Story = {
  args: { disabled: true, boxIndicator: true, defaultValue: 60, label: undefined },
};
