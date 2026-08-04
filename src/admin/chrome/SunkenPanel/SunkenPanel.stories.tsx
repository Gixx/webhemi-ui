import type { Meta, StoryObj } from '@storybook/react-vite';
import { SunkenPanel, type SunkenPanelTone } from './SunkenPanel';

type PanelArgs = {
  children: string;
  width: number;
  height: number;
  scrollable: boolean;
  tone: SunkenPanelTone;
};

const meta = {
  title: 'Admin/Atoms/SunkenPanel',
  component: SunkenPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Sunken panel. Always wraps children in `.scrollable-viewport`. Optional `scrollable` adds Retro OS scrollbar chrome. `tone` selects system (silver) or white face.',
      },
    },
    controls: { include: ['children', 'width', 'height', 'scrollable', 'tone'] },
  },
  args: {
    children: 'Sunken panel content',
    width: 280,
    height: 120,
    scrollable: false,
    tone: 'system',
  },
  argTypes: {
    children: { control: 'text' },
    width: { control: { type: 'number', min: 80, max: 600 } },
    height: { control: { type: 'number', min: 40, max: 400 } },
    scrollable: { control: 'boolean' },
    tone: { control: 'select', options: ['system', 'white'] },
  },
  render: (args) => (
    <SunkenPanel
      scrollable={args.scrollable}
      tone={args.tone}
      style={{ width: args.width, height: args.height }}
    >
      {args.children}
    </SunkenPanel>
  ),
} satisfies Meta<PanelArgs>;

export default meta;
type Story = StoryObj<PanelArgs>;

export const Panel: Story = {};

export const White: Story = {
  args: { tone: 'white' },
};

/** Sunken panel with Retro OS scrollbar (atom `scrollable` prop). */
export const Scrollable: Story = {
  args: {
    scrollable: true,
    tone: 'white',
    height: 160,
    width: 320,
  },
  parameters: {
    controls: { include: ['width', 'height', 'scrollable', 'tone'] },
    docs: {
      description: {
        story:
          'Markup is real JSX children (edit in the story file, not as an HTML string in Controls).',
      },
    },
  },
  render: (args) => (
    <SunkenPanel
      scrollable={args.scrollable}
      tone={args.tone}
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
      <p>Still more content for a usable thumb.</p>
    </SunkenPanel>
  ),
};
