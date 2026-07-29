import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldBorder } from './FieldBorder';

type BorderArgs = {
  children: string;
  width: number;
  height: number;
  disabled: boolean;
  scrollable: boolean;
};

const meta = {
  title: 'Admin/Atoms/FieldBorder',
  component: FieldBorder,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Inset field surface (`.field-border`). Optional `scrollable` adds Retro OS scrollbar chrome.',
      },
    },
    controls: { include: ['children', 'width', 'height', 'disabled', 'scrollable'] },
  },
  args: {
    children: 'Field border',
    width: 200,
    height: 40,
    disabled: false,
    scrollable: false,
  },
  argTypes: {
    children: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 24, max: 400 } },
    disabled: { control: 'boolean' },
    scrollable: { control: 'boolean' },
  },
  render: (args) => (
    <FieldBorder
      disabled={args.disabled}
      scrollable={args.scrollable}
      style={{ width: args.width, height: args.height }}
    >
      {args.children}
    </FieldBorder>
  ),
} satisfies Meta<BorderArgs>;

export default meta;
type Story = StoryObj<BorderArgs>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled field border' },
};

/** Field border with Retro OS scrollbar (atom `scrollable` prop). */
export const Scrollable: Story = {
  args: {
    scrollable: true,
    height: 140,
    width: 280,
  },
  parameters: {
    controls: { include: ['width', 'height', 'disabled', 'scrollable'] },
  },
  render: (args) => (
    <FieldBorder
      disabled={args.disabled}
      scrollable={args.scrollable}
      style={{ width: args.width, height: args.height }}
    >
      <p style={{ marginTop: 0 }}>Lorem ipsum dolor sit amet.</p>
      <p>
        Extra lines so the custom scrollbar can be exercised when the panel is short. Windows 98
        scrollbars used arrow buttons, a checkerboard track, and a raised thumb.
      </p>
      <p>
        The native browser scrollbar is hidden; useCustomScrollbar paints the Retro OS chrome and
        keeps it in sync with scrollTop / scrollLeft.
      </p>
      <p>More content to force overflow on the vertical axis.</p>
    </FieldBorder>
  ),
};
