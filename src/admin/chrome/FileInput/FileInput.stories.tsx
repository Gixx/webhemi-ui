import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FileInput } from './FileInput';

const meta = {
  title: 'Admin/Atoms/FileInput',
  component: FileInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Retro file picker: readonly path + Browse… over a hidden `<input type="file">`.',
      },
    },
  },
  args: {
    emptyLabel: 'No file selected.',
    browseLabel: 'Browse…',
    accept: 'image/*',
    disabled: false,
  },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof FileInput>;

export const Empty: Story = {};

export const WithFileName: Story = {
  args: {
    value: 'C:\\Users\\Public\\avatar.png',
  },
};

function InteractiveDemo() {
  const [name, setName] = useState('');
  return (
    <FileInput
      label="Picture:"
      value={name}
      onFileChange={(file) => setName(file?.name ?? '')}
      pathClassName="w-window-sm"
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
