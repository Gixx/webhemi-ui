import type { Meta, StoryObj } from '@storybook/react-vite';
import { createAdminApiHandlers, MSW_SAMPLE_USERS } from '../../api/msw';
import { createAdminApiClient } from '../../api';
import { MyAccountWindow } from './MyAccountWindow';

const meta = {
  title: 'Admin/Windows/MyAccount',
  component: MyAccountWindow,
  parameters: {
    layout: 'centered',
    msw: {
      handlers: createAdminApiHandlers({
        users: MSW_SAMPLE_USERS,
      }),
    },
  },
} satisfies Meta<typeof MyAccountWindow>;

export default meta;
type Story = StoryObj<typeof MyAccountWindow>;

export const Default: Story = {
  args: {
    api: createAdminApiClient({ csrfToken: 'storybook' }),
    userId: 1,
    onClose: () => {},
  },
};
