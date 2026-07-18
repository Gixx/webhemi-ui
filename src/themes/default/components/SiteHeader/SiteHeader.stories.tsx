import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteHeader } from './SiteHeader';

const meta = {
  title: 'Themes/Default/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
    globals: { theme: 'default' },
  },
  args: {
    siteName: 'WebHemi',
    navItems: [
      { label: 'Home', href: '#', active: true },
      { label: 'Blog', href: '#' },
      { label: 'About', href: '#' },
    ],
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
