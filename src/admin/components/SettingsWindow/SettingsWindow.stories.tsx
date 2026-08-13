import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SettingsWindow } from './SettingsWindow';

const meta = {
  title: 'Admin/Product/SettingsWindow',
  component: SettingsWindow,
  args: {
    onClose: fn(),
    onSave: fn(),
    onMinimize: fn(),
    onMaximize: fn(),
    onActivate: fn(),
    symfonyDebugToolbar: true,
    symfonyDebugToolbarEditable: true,
  },
} satisfies Meta<typeof SettingsWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PathMode: Story = {
  args: {
    adminAccess: 'path',
    domainAvailable: true,
  },
};

export const DomainMode: Story = {
  args: {
    adminAccess: 'domain',
    domainAvailable: true,
  },
};

export const DomainUnavailable: Story = {
  args: {
    adminAccess: 'path',
    domainAvailable: false,
  },
};

export const ToolbarDisabledProd: Story = {
  args: {
    adminAccess: 'path',
    domainAvailable: true,
    symfonyDebugToolbar: true,
    symfonyDebugToolbarEditable: false,
  },
};
