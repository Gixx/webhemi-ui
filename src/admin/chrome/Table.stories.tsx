import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableRow } from './Table';
import { SunkenPanel } from './SunkenPanel';

type TableStoryArgs = {
  interactive: boolean;
  width: number;
  height: number;
  row1Name: string;
  row1Type: string;
  row2Name: string;
  row2Type: string;
  row3Name: string;
  row3Type: string;
  highlightFirst: boolean;
};

const meta = {
  title: 'Admin/Atoms/Table',
  parameters: { layout: 'centered' },
  args: {
    interactive: true,
    width: 360,
    height: 140,
    row1Name: 'Sites',
    row1Type: 'Folder',
    row2Name: 'Hosts',
    row2Type: 'Folder',
    row3Name: 'Users',
    row3Type: 'Folder',
    highlightFirst: true,
  },
  argTypes: {
    interactive: { control: 'boolean' },
    width: { control: { type: 'number', min: 200, max: 640 } },
    height: { control: { type: 'number', min: 80, max: 400 } },
    row1Name: { control: 'text' },
    row1Type: { control: 'text' },
    row2Name: { control: 'text' },
    row2Type: { control: 'text' },
    row3Name: { control: 'text' },
    row3Type: { control: 'text' },
    highlightFirst: { control: 'boolean' },
  },
  render: (args) => (
    <SunkenPanel style={{ width: args.width, height: args.height, overflow: 'auto' }}>
      <Table interactive={args.interactive}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <TableRow highlighted={args.highlightFirst}>
            <td>{args.row1Name}</td>
            <td>{args.row1Type}</td>
          </TableRow>
          <TableRow>
            <td>{args.row2Name}</td>
            <td>{args.row2Type}</td>
          </TableRow>
          <TableRow>
            <td>{args.row3Name}</td>
            <td>{args.row3Type}</td>
          </TableRow>
        </tbody>
      </Table>
    </SunkenPanel>
  ),
} satisfies Meta<TableStoryArgs>;

export default meta;
type Story = StoryObj<TableStoryArgs>;

export const Interactive: Story = {};

export const Static: Story = {
  args: { interactive: false, highlightFirst: false },
};
