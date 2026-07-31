import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { TreeView } from './TreeView';

type TreeStoryArgs = {
  rootLabel: string;
  chapterOne: string;
  sectionOne: string;
  sectionTwo: string;
  itemA: string;
  itemB: string;
  chapterTwo: string;
  width: number;
  openDetails: boolean;
};

const meta = {
  title: 'Admin/Atoms/TreeView',
  component: TreeView as unknown as ComponentType<TreeStoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '`ul.tree-view` — nest lists and `<details>` for expandable branches.',
      },
      source: {
        language: 'tsx',
        code: `import { TreeView } from '@webhemi/ui';

<TreeView style={{ width: 200 }}>
  <li>Table of Contents</li>
  <li>
    Chapter 1
    <ul>
      <li>Section 1.1</li>
      <li>
        <details open>
          <summary>Section 1.2</summary>
          <ul>
            <li>Item A</li>
            <li>Item B</li>
          </ul>
        </details>
      </li>
    </ul>
  </li>
  <li>Chapter 2</li>
</TreeView>`,
      },
    },
  },
  args: {
    rootLabel: 'Table of Contents',
    chapterOne: 'Chapter 1',
    sectionOne: 'Section 1.1',
    sectionTwo: 'Section 1.2',
    itemA: 'Item A',
    itemB: 'Item B',
    chapterTwo: 'Chapter 2',
    width: 200,
    openDetails: true,
  },
  argTypes: {
    rootLabel: { control: 'text' },
    chapterOne: { control: 'text' },
    sectionOne: { control: 'text' },
    sectionTwo: { control: 'text' },
    itemA: { control: 'text' },
    itemB: { control: 'text' },
    chapterTwo: { control: 'text' },
    width: { control: { type: 'number', min: 120, max: 400 } },
    openDetails: { control: 'boolean' },
  },
  render: (args) => (
    <TreeView style={{ width: args.width }}>
      <li>{args.rootLabel}</li>
      <li>
        {args.chapterOne}
        <ul>
          <li>{args.sectionOne}</li>
          <li>
            <details open={args.openDetails}>
              <summary>{args.sectionTwo}</summary>
              <ul>
                <li>{args.itemA}</li>
                <li>{args.itemB}</li>
              </ul>
            </details>
          </li>
        </ul>
      </li>
      <li>{args.chapterTwo}</li>
    </TreeView>
  ),
} satisfies Meta<TreeStoryArgs>;

export default meta;
type Story = StoryObj<TreeStoryArgs>;

export const Nested: Story = {};
