import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { Button, FieldRow, SunkenPanel, Table, TableRow } from '../../chrome';
import { HeadingPanelWindow } from './HeadingPanelWindow';
import {
  pickShellArgs,
  shellPropsFromArgs,
  windowBrickShellArgs,
  windowBrickShellArgTypes,
  type WindowBrickShellArgs,
} from '../_lib/windowBrickStory';

type StoryArgs = WindowBrickShellArgs;

const meta = {
  title: 'Admin/Bricks/HeadingPanelWindow',
  component: HeadingPanelWindow as unknown as ComponentType<StoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Heading layout brick: stacked panels (toolbar / body / `.panel.actions`) with groove separators.',
      },
      source: {
        language: 'tsx',
        code: `import { Button, FieldRow, HeadingPanelWindow, SunkenPanel, Table, TableRow } from '@webhemi/ui';

<HeadingPanelWindow
  title="Sites"
  titleIcon="sites"
  heading={<p style={{ margin: 0 }}>Manage multi-tenant sites.</p>}
  actions={
    <FieldRow className="justify-end">
      <Button isDefault accessKey="n">New</Button>
      <Button accessKey="e" disabled>Edit</Button>
      <Button accessKey="d" disabled>Delete</Button>
      <Button accessKey="c">Cancel</Button>
    </FieldRow>
  }
>
  <SunkenPanel scrollable style={{ minHeight: 220 }}>
    <Table>…</Table>
  </SunkenPanel>
</HeadingPanelWindow>`,
      },
    },
  },
  args: {
    ...windowBrickShellArgs,
    title: 'Sites',
    titleIcon: 'sites',
    titleBarControls: ['Minimize', 'Maximize', 'Close'],
    resizable: true,
  },
  argTypes: windowBrickShellArgTypes,
  render: (args) => (
    <HeadingPanelWindow
      {...shellPropsFromArgs(pickShellArgs(args))}
      style={{ width: 520, minHeight: 420 }}
      heading={<p style={{ margin: 0 }}>Manage multi-tenant sites.</p>}
      actions={
        <FieldRow className="justify-end">
          <Button isDefault accessKey="n">
            New
          </Button>
          <Button accessKey="e" disabled>
            Edit
          </Button>
          <Button accessKey="d" disabled>
            Delete
          </Button>
          <Button accessKey="c">Cancel</Button>
        </FieldRow>
      }
    >
      <SunkenPanel scrollable style={{ minHeight: 220 }}>
        <Table interactive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
            </tr>
          </thead>
          <tbody>
            <TableRow>
              <td>Main site</td>
              <td>main</td>
            </TableRow>
            <TableRow>
              <td>Blog</td>
              <td>blog</td>
            </TableRow>
          </tbody>
        </Table>
      </SunkenPanel>
    </HeadingPanelWindow>
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {};
