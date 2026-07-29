import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { FieldRow } from './FieldRow';
import { TextBox } from '../TextBox';
import { fieldAccessKeyArgType } from '../_lib/fieldBoxStory';

type FieldRowStoryArgs = {
  label: string;
  value: string;
  disabled: boolean;
  className: string;
  accessKey: string;
};

const meta = {
  title: 'Admin/Atoms/FieldRow',
  component: FieldRow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Horizontal form row. Recommended children: Button, TextBox, TextArea, Checkbox, Radio, Select, Slider. Sibling FieldRows stack vertically. Put captions on the atoms (`label` / `accessKey`), not on FieldRow.',
      },
    },
    controls: {
      include: ['label', 'value', 'disabled', 'className', 'accessKey'],
    },
  },
  args: {
    label: 'Occupation',
    value: 'Developer',
    disabled: false,
    className: '',
    accessKey: 'o',
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    accessKey: fieldAccessKeyArgType,
    children: { table: { disable: true }, control: false },
  },
  render: (args) => (
    <FieldRow className={args.className || undefined}>
      <TextBox
        id="field-row-demo"
        label={args.label}
        accessKey={args.accessKey || undefined}
        defaultValue={args.value}
        disabled={args.disabled}
        className="w-window-xs"
      />
    </FieldRow>
  ),
} satisfies Meta<FieldRowStoryArgs>;

export default meta;
type Story = StoryObj<FieldRowStoryArgs>;

export const SingleField: Story = {};

export const StackedRows: Story = {
  name: 'Stacked rows',
  render: (args) => (
    <>
      <FieldRow className={args.className || undefined}>
        <TextBox
          id="row-occupation"
          label={args.label}
          accessKey={args.accessKey || undefined}
          defaultValue={args.value}
          disabled={args.disabled}
          className="w-window-xs"
        />
      </FieldRow>
      <FieldRow>
        <TextBox
          id="row-company"
          label="Company"
          accessKey="c"
          disabled={args.disabled}
          className="w-window-xs"
        />
      </FieldRow>
      <FieldRow>
        <Checkbox id="row-active" label="Active" disabled={args.disabled} />
      </FieldRow>
    </>
  ),
};

export const SideBySide: Story = {
  name: 'Side by side',
  args: { accessKey: '' },
  render: (args) => (
    <FieldRow className={args.className || undefined}>
      <TextBox
        id="row-first"
        label="First"
        defaultValue={args.value}
        disabled={args.disabled}
        className="w-window-xs"
      />
      <TextBox
        id="row-last"
        label="Last"
        disabled={args.disabled}
        className="w-window-xs"
      />
    </FieldRow>
  ),
};

export const LabelAbove: Story = {
  args: { label: 'Name', value: '', accessKey: 'n' },
  render: (args) => (
    <div style={{ width: 220 }}>
      <FieldRow>
        <TextBox
          id="stack-name"
          label={args.label}
          accessKey={args.accessKey || undefined}
          defaultValue={args.value}
          disabled={args.disabled}
          labelPosition="above"
        />
      </FieldRow>
      <FieldRow>
        <TextBox
          id="stack-city"
          label="City"
          accessKey="c"
          disabled={args.disabled}
          labelPosition="above"
        />
      </FieldRow>
    </div>
  ),
};

type ButtonRowArgs = {
  okLabel: string;
  cancelLabel: string;
  okAccessKey: string;
  cancelAccessKey: string;
  isDefault: boolean;
  disabled: boolean;
};

export const Buttons: StoryObj<ButtonRowArgs> = {
  args: {
    okLabel: 'OK',
    cancelLabel: 'Cancel',
    okAccessKey: 'o',
    cancelAccessKey: 'c',
    isDefault: true,
    disabled: false,
  },
  parameters: {
    controls: {
      include: ['okLabel', 'cancelLabel', 'okAccessKey', 'cancelAccessKey', 'isDefault', 'disabled'],
    },
  },
  argTypes: {
    okLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    okAccessKey: {
      ...fieldAccessKeyArgType,
      name: 'OK accessKey',
    },
    cancelAccessKey: {
      ...fieldAccessKeyArgType,
      name: 'Cancel accessKey',
    },
    isDefault: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <FieldRow className="justify-end">
      <Button
        isDefault={args.isDefault}
        disabled={args.disabled}
        accessKey={args.okAccessKey || undefined}
      >
        {args.okLabel}
      </Button>
      <Button disabled={args.disabled} accessKey={args.cancelAccessKey || undefined}>
        {args.cancelLabel}
      </Button>
    </FieldRow>
  ),
};
