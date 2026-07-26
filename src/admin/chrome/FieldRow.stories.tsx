import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { FieldColumn, FieldRow, GroupBox } from './FieldRow';
import { Radio } from './Radio';
import { TextBox } from './TextBox';

type FieldRowStoryArgs = {
  stacked: boolean;
  label: string;
  value: string;
  disabled: boolean;
  className: string;
};

const meta = {
  title: 'Admin/Atoms/FieldRow',
  parameters: { layout: 'centered' },
  args: {
    stacked: false,
    label: 'Occupation',
    value: 'Developer',
    disabled: false,
    className: '',
  },
  argTypes: {
    stacked: { control: 'boolean' },
    label: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
  },
  render: (args) => (
    <FieldRow stacked={args.stacked} className={args.className || undefined}>
      <label htmlFor="field-row-demo">{args.label}</label>
      <TextBox
        id="field-row-demo"
        defaultValue={args.value}
        disabled={args.disabled}
        className={args.stacked ? undefined : 'w-window-xs'}
      />
    </FieldRow>
  ),
} satisfies Meta<FieldRowStoryArgs>;

export default meta;
type Story = StoryObj<FieldRowStoryArgs>;

export const LabelBeside: Story = {
  render: (args) => (
    <>
      <FieldRow stacked={args.stacked} className={args.className || undefined}>
        <label htmlFor="row-occupation">{args.label}</label>
        <TextBox
          id="row-occupation"
          defaultValue={args.value}
          disabled={args.disabled}
          className="w-window-xs"
        />
      </FieldRow>
      <FieldRow stacked={args.stacked}>
        <label htmlFor="row-company">Company</label>
        <TextBox id="row-company" disabled={args.disabled} className="w-window-xs" />
      </FieldRow>
    </>
  ),
};

export const Stacked: Story = {
  args: { stacked: true, label: 'Name', value: '' },
  render: (args) => (
    <div style={{ width: 220 }}>
      <FieldRow stacked={args.stacked}>
        <label htmlFor="stack-name">{args.label}</label>
        <TextBox id="stack-name" defaultValue={args.value} disabled={args.disabled} />
      </FieldRow>
      <FieldRow stacked={args.stacked}>
        <label htmlFor="stack-city">City</label>
        <TextBox id="stack-city" disabled={args.disabled} />
      </FieldRow>
    </div>
  ),
};

type ButtonRowArgs = {
  okLabel: string;
  cancelLabel: string;
  isDefault: boolean;
  disabled: boolean;
};

export const Buttons: StoryObj<ButtonRowArgs> = {
  args: {
    okLabel: 'OK',
    cancelLabel: 'Cancel',
    isDefault: true,
    disabled: false,
  },
  argTypes: {
    okLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    isDefault: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <FieldRow className="justify-end">
      <Button isDefault={args.isDefault} disabled={args.disabled}>
        {args.okLabel}
      </Button>
      <Button disabled={args.disabled}>{args.cancelLabel}</Button>
    </FieldRow>
  ),
};

type FieldColumnArgs = {
  legend: string;
  selected: '581' | '582' | 'def';
  disabled: boolean;
};

export const InFieldColumn: StoryObj<FieldColumnArgs> = {
  name: 'FieldColumn (horizontal)',
  args: {
    legend: 'COMCTL32',
    selected: '581',
    disabled: false,
  },
  argTypes: {
    legend: { control: 'text' },
    selected: { control: 'select', options: ['581', '582', 'def'] },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <GroupBox legend={args.legend} style={{ width: 320 }}>
      <FieldColumn key={args.selected}>
        <FieldRow>
          <Radio
            id="ser581"
            name="comctl32"
            label="5.81 Series"
            defaultChecked={args.selected === '581'}
            disabled={args.disabled}
          />
        </FieldRow>
        <FieldRow>
          <Radio
            id="ser582"
            name="comctl32"
            label="5.82 Series"
            defaultChecked={args.selected === '582'}
            disabled={args.disabled}
          />
        </FieldRow>
        <FieldRow>
          <Radio
            id="serdef"
            name="comctl32"
            label="Default"
            defaultChecked={args.selected === 'def'}
            disabled={args.disabled}
          />
        </FieldRow>
      </FieldColumn>
    </GroupBox>
  ),
};

type GroupBoxArgs = {
  legend: string;
  optionOne: string;
  optionTwo: string;
  disabled: boolean;
};

export const GroupBoxVertical: StoryObj<GroupBoxArgs> = {
  name: 'GroupBox (vertical rows)',
  args: {
    legend: 'Options',
    optionOne: 'One',
    optionTwo: 'Two',
    disabled: false,
  },
  argTypes: {
    legend: { control: 'text' },
    optionOne: { control: 'text' },
    optionTwo: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <GroupBox legend={args.legend} style={{ width: 260 }}>
      <FieldRow>
        <Radio id="g1" name="grp" label={args.optionOne} defaultChecked disabled={args.disabled} />
      </FieldRow>
      <FieldRow>
        <Radio id="g2" name="grp" label={args.optionTwo} disabled={args.disabled} />
      </FieldRow>
    </GroupBox>
  ),
};
