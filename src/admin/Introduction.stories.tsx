import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Window, TitleBar, TitleBarText, WindowBody } from './chrome';

const meta = {
  title: 'Admin/Introduction',
} satisfies Meta;

export default meta;

export const Overview: StoryObj = {
  render: () => (
    <div style={{ padding: 24 }}>
      <Window style={{ width: 420 }}>
        <TitleBar>
          <TitleBarText>WebHemi Admin Theme</TitleBarText>
        </TitleBar>
        <WindowBody>
          <p style={{ marginTop: 0 }}>
            Win98-inspired CMS UI. Chrome atoms live under <code>src/admin/chrome/</code>. Frontend
            themes under <code>Themes/*</code> are separate and self-contained.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button isDefault>OK</Button>
            <Button>Cancel</Button>
          </div>
        </WindowBody>
      </Window>
    </div>
  ),
};
