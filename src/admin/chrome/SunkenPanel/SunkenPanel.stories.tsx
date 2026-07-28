import type { Meta, StoryObj } from '@storybook/react-vite';
import { SunkenPanel, FieldBorder } from './SunkenPanel';

type PanelArgs = {
  content: string;
  width: number;
  height: number;
  padding: number;
  scrollable: boolean;
};

const meta = {
  title: 'Admin/Atoms/SunkenPanel',
  component: SunkenPanel,
  parameters: { layout: 'centered' },
  args: {
    content: 'Sunken panel content',
    width: 280,
    height: 80,
    padding: 8,
    scrollable: false,
  },
  argTypes: {
    content: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 40, max: 400 } },
    padding: { control: { type: 'number', min: 0, max: 24 } },
    scrollable: { control: 'boolean' },
  },
  render: (args) => (
    <SunkenPanel
      scrollable={args.scrollable}
      style={{ width: args.width, height: args.height, padding: args.padding }}
    >
      {args.content}
    </SunkenPanel>
  ),
} satisfies Meta<PanelArgs>;

export default meta;
type Story = StoryObj<PanelArgs>;

export const Panel: Story = {};

const overflowCopy = (
  <>
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
    <p>Still more content for a usable thumb.</p>
  </>
);

/** Sunken panel with Retro OS scrollbar (atom `scrollable` prop). */
export const Scrollable: Story = {
  args: {
    scrollable: true,
    height: 160,
    width: 320,
    padding: 8,
  },
  render: (args) => (
    <SunkenPanel
      scrollable={args.scrollable}
      style={{ width: args.width, height: args.height, padding: args.padding }}
    >
      {overflowCopy}
    </SunkenPanel>
  ),
};

type BorderArgs = {
  content: string;
  width: number;
  height: number;
  padding: number;
  disabled: boolean;
  scrollable: boolean;
};

export const Border: StoryObj<BorderArgs> = {
  name: 'FieldBorder',
  args: {
    content: 'Field border',
    width: 200,
    height: 40,
    padding: 4,
    disabled: false,
    scrollable: false,
  },
  argTypes: {
    content: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 24, max: 400 } },
    padding: { control: { type: 'number', min: 0, max: 24 } },
    disabled: { control: 'boolean' },
    scrollable: { control: 'boolean' },
  },
  render: (args) => (
    <FieldBorder
      disabled={args.disabled}
      scrollable={args.scrollable}
      style={{ width: args.width, height: args.height, padding: args.padding }}
    >
      {args.scrollable ? overflowCopy : args.content}
    </FieldBorder>
  ),
};
