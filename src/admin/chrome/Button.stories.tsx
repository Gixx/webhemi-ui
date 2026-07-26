import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, VerticalBar } from './Button';

const meta = {
  title: 'Admin/Atoms/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'OK',
    isDefault: false,
    disabled: false,
    loading: false,
    type: 'button',
  },
  argTypes: {
    children: { control: 'text' },
    isDefault: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

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
