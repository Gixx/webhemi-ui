import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldRow } from '../FieldRow';
import { GroupBox } from './GroupBox';
import { Radio } from '../Radio';

type GroupBoxArgs = {
  legend: string;
  selected: '581' | '582' | 'def';
  disabled: boolean;
};

const meta = {
  title: 'Admin/Atoms/GroupBox',
  component: GroupBox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chrome `fieldset` / `legend`. Contains FieldRows only (not bare controls, not nested as a FieldRow child).',
      },
    },
    controls: {
      include: ['legend', 'selected', 'disabled'],
    },
  },
  args: {
    legend: 'COMCTL32',
    selected: '581' as const,
    disabled: false,
  },
  argTypes: {
    legend: { control: 'text' },
    selected: { control: 'select', options: ['581', '582', 'def'] },
    disabled: { control: 'boolean' },
    children: { table: { disable: true }, control: false },
  },
  render: (args) => (
    <GroupBox legend={args.legend} style={{ width: 320 }}>
      <FieldRow key={args.selected}>
        <Radio
          id="ser581"
          name="comctl32"
          label="5.81 Series"
          defaultChecked={args.selected === '581'}
          disabled={args.disabled}
        />
        <Radio
          id="ser582"
          name="comctl32"
          label="5.82 Series"
          defaultChecked={args.selected === '582'}
          disabled={args.disabled}
        />
        <Radio
          id="serdef"
          name="comctl32"
          label="Default"
          defaultChecked={args.selected === 'def'}
          disabled={args.disabled}
        />
      </FieldRow>
    </GroupBox>
  ),
} satisfies Meta<GroupBoxArgs>;

export default meta;
type Story = StoryObj<GroupBoxArgs>;

export const HorizontalRadios: Story = {
  name: 'Horizontal radios',
};

type VerticalArgs = {
  legend: string;
  optionOne: string;
  optionTwo: string;
  disabled: boolean;
};

export const VerticalRows: StoryObj<VerticalArgs> = {
  name: 'Vertical rows',
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
  parameters: {
    controls: { include: ['legend', 'optionOne', 'optionTwo', 'disabled'] },
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
