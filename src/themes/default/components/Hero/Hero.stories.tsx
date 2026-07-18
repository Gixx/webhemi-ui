import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hero } from './Hero';
import { Button } from '../../../../shared/components/Button/Button';

const meta = {
  title: 'Themes/Default/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
    globals: { theme: 'default' },
  },
  args: {
    title: 'Publish once, theme freely',
    subtitle: 'Visitor-facing layout for the Default frontend theme.',
    actions: (
      <>
        <Button>Primary CTA</Button>
        <Button variant="ghost">Secondary</Button>
      </>
    ),
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
