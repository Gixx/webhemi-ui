import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { EMPTY_EDITOR_STATE_JSON } from './emptyEditorState';
import { DocumentEditorWindow } from './DocumentEditorWindow';

const meta = {
  title: 'Admin/Bricks/DocumentEditorWindow',
  component: DocumentEditorWindow,
  args: {
    title: 'Welcome',
    documentTitle: 'Welcome',
    bodyJson: EMPTY_EDITOR_STATE_JSON,
    onClose: fn(),
    onSave: fn(),
    onMinimize: fn(),
    onMaximize: fn(),
    onActivate: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div data-wh-theme="admin" style={{ padding: 24, minHeight: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentEditorWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    publication: 'draft',
  },
};

export const Published: Story = {
  args: {
    publication: 'published',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const ReadOnly: Story = {
  args: {
    canEdit: false,
    publication: 'published',
  },
};
