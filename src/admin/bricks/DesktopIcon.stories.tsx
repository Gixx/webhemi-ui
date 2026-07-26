import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesktopIcon, type DesktopIconKind } from './DesktopIcon';

const KINDS: DesktopIconKind[] = [
  'control-panel',
  'site',
  'network-neighborhood',
  'users',
  'roles',
  'permissions',
  'hosts',
  'sites',
  'settings',
  'themes',
];

type IconEntry = { kind: DesktopIconKind; label: string };

const meta = {
  title: 'Admin/Bricks/DesktopIcon',
  component: DesktopIcon,
  parameters: { layout: 'centered' },
  args: {
    kind: 'users' as DesktopIconKind,
    label: 'Users',
  },
  argTypes: {
    kind: { control: 'select', options: KINDS },
    label: { control: 'text' },
    onActivate: { action: 'activate' },
    onOpen: { action: 'open' },
  },
} satisfies Meta<typeof DesktopIcon>;

export default meta;
type Story = StoryObj<typeof DesktopIcon>;

/** On desktop (teal) — white label text. */
export const OnDesktop: Story = {
  decorators: [
    (Story) => (
      <div className="icon-list" style={{ minHeight: 120, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

/** Inside icon panel — black label text. */
export const InIconPanel: Story = {
  decorators: [
    (Story) => (
      <div
        className="panel icon-list"
        style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', padding: 12, width: 280 }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Grid: StoryObj<{ icons: IconEntry[] }> = {
  args: {
    icons: KINDS.map((kind) => ({ kind, label: kind })),
  },
  argTypes: {
    icons: { control: 'object' },
  },
  parameters: {
    controls: { include: ['icons'] },
  },
  render: ({ icons }) => (
    <div
      className="panel icon-list"
      style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', padding: 12, width: 400 }}
    >
      {icons.map(({ kind, label }) => (
        <DesktopIcon key={`${kind}-${label}`} kind={kind} label={label} />
      ))}
    </div>
  ),
};
