import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, VerticalBar } from './Button';

const accessKeyArgType = {
  control: 'text' as const,
  description:
    'Native access key. When set and children is a plain string, underlines the first case-insensitive match.',
  table: {
    category: 'Accessibility',
    type: { summary: 'string' },
    defaultValue: { summary: 'undefined' },
  },
};

const meta = {
  title: 'Admin/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Retro OS chrome button. Use `accessKey` for the native attribute and automatic `<u>` underline on plain-string labels.',
      },
    },
    controls: {
      include: ['children', 'isDefault', 'disabled', 'loading', 'type', 'accessKey'],
    },
  },
  args: {
    children: 'OK',
    isDefault: false,
    disabled: false,
    loading: false,
    type: 'button',
    accessKey: '',
  },
  argTypes: {
    children: { control: 'text' },
    isDefault: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    accessKey: accessKeyArgType,
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const AccessKey: Story = {
  args: { accessKey: 'o', children: 'OK' },
  parameters: {
    docs: {
      description: {
        story: 'Set `accessKey` in Controls to change the underlined letter and the `accesskey` DOM attribute.',
      },
    },
  },
};

export const DefaultAction: Story = {
  args: { isDefault: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithVerticalBar: Story = {
  args: {
    children: 'Cut',
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <Button {...args} />
      <VerticalBar />
      <Button disabled={args.disabled} loading={args.loading}>
        Copy
      </Button>
      <Button disabled={args.disabled} loading={args.loading}>
        Paste
      </Button>
    </div>
  ),
};
