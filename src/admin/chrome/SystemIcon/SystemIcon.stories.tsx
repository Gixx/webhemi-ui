import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { SystemIcon, type SystemIconKind, type SystemIconLabelTone } from './SystemIcon';

const KINDS: SystemIconKind[] = [
  'control-panel',
  'site',
  'users',
  'roles',
  'permissions',
  'hosts',
  'sites',
  'settings',
  'themes',
  'website',
  'trash',
  'trash-empty',
  'folder',
  'folder-open',
  'folder-documents',
  'folder-gallery',
  'folder-draft',
  'folder-scheduled',
  'file-document',
  'file-draft',
  'file-image',
  'file-audio',
  'file-video',
  'general-app',
];

type IconEntry = { kind: SystemIconKind; label: string; labelTone?: SystemIconLabelTone };

/** Teal desktop surface so white labels stay readable (Docs + OnDesktop). */
const withDesktopSurface: Decorator = (Story, context) => {
  if (context.name === 'In Icon Panel' || context.name === 'Grid') {
    return <Story />;
  }

  return (
    <div
      className="icon-list"
      style={{
        boxSizing: 'border-box',
        minHeight: 120,
        padding: 16,
        background: 'var(--desktop, #008284)',
        fontFamily: 'var(--font-chrome)',
        fontSize: 'var(--font-size-chrome)',
      }}
    >
      <Story />
    </div>
  );
};

const meta = {
  title: 'Admin/Atoms/SystemIcon',
  component: SystemIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Desktop / icon-panel glyph + label. Item metadata stays on the parent list model — not on this atom.',
      },
      source: {
        language: 'tsx',
        code: `import { SystemIcon } from '@webhemi/ui';

<SystemIcon
  kind="users"
  label="Users"
  labelTone="light"
  onActivate={() => {}}
  onOpen={() => {}}
/>`,
      },
    },
  },
  decorators: [withDesktopSurface],
  args: {
    kind: 'users' as SystemIconKind,
    label: 'Users',
    labelTone: 'light' as SystemIconLabelTone,
  },
  argTypes: {
    kind: { control: 'select', options: KINDS },
    label: { control: 'text' },
    labelTone: { control: 'inline-radio', options: ['light', 'dark'] },
    onActivate: { action: 'activate' },
    onOpen: { action: 'open' },
  },
} satisfies Meta<typeof SystemIcon>;

export default meta;
type Story = StoryObj<typeof SystemIcon>;

/** On desktop (teal) — light (white) label. */
export const OnDesktop: Story = {
  args: { labelTone: 'light' },
};

/** Inside icon panel — dark (black) label. */
export const InIconPanel: Story = {
  args: { labelTone: 'dark' },
  decorators: [
    (Story) => (
      <div
        className="panel icon-list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          background: '#fff',
          padding: 12,
          width: 280,
          fontFamily: 'var(--font-chrome)',
          fontSize: 'var(--font-size-chrome)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Grid: StoryObj<{ icons: IconEntry[] }> = {
  args: {
    icons: KINDS.map((kind) => ({ kind, label: kind, labelTone: 'dark' })),
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
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        background: '#fff',
        padding: 12,
        width: 400,
        fontFamily: 'var(--font-chrome)',
        fontSize: 'var(--font-size-chrome)',
      }}
    >
      {icons.map(({ kind, label, labelTone = 'dark' }) => (
        <SystemIcon key={`${kind}-${label}`} kind={kind} label={label} labelTone={labelTone} />
      ))}
    </div>
  ),
};
