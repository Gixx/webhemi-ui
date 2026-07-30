import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AdminDesktop } from './AdminDesktop';

const SAMPLE_SITES = [
  { id: 1, name: 'Example Site', slug: 'example', enabled: true },
  { id: 2, name: 'Docs', slug: 'docs', enabled: true },
];

const meta = {
  title: 'Admin/Components/AdminDesktop',
  component: AdminDesktop,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { value: 'desktop' },
  },
  args: {
    sites: SAMPLE_SITES,
  },
} satisfies Meta<typeof AdminDesktop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptySites: Story = {
  args: { sites: [] },
};

export const OpenControlPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Control Panel' }));
    await expect(canvas.getByText('Control Panel', { selector: '.title-bar-text' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Sites' })).toBeVisible();
  },
};

export const OpenSiteStub: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.dblClick(canvas.getByRole('link', { name: 'Example Site' }));
    await expect(canvas.getByText(/Site administration for/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'OK' })).toBeVisible();
  },
};
