import { useState, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeToggle, TreeView } from './TreeView';

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

/** Controlled branch: toggle only via TreeToggle; label stays independently focusable. */
function TreeBranch({
  label,
  defaultOpen = false,
  children,
}: {
  label: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details open={open}>
      <summary
        tabIndex={-1}
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        <TreeToggle
          expanded={open}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        />
        {label}
      </summary>
      {children}
    </details>
  );
}

const meta = {
  title: 'Admin/Atoms/TreeView',
  component: TreeView as unknown as ComponentType<TreeStoryArgs>,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`ul.tree-view` — nest lists and `<details>` for expandable branches. Use `TreeToggle` inside `<summary>`; call `preventDefault` on summary clicks so expand/collapse is only on the [+]/[-] control (Win98 Explorer).',
      },
      source: {
        language: 'tsx',
        code: `import { useState } from 'react';
import { TreeToggle, TreeView } from '@webhemi/ui';

function Branch({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details open={open}>
      <summary tabIndex={-1} onClick={(e) => e.preventDefault()}>
        <TreeToggle
          expanded={open}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        />
        {label}
      </summary>
      {children}
    </details>
  );
}

<TreeView style={{ width: 200 }}>
  <li>Table of Contents</li>
  <li>
    Chapter 1
    <ul>
      <li>Section 1.1</li>
      <li>
        <Branch label={<a href="#"><span className="tree-view-label">Section 1.2</span></a>} defaultOpen>
          <ul>
            <li><a href="#"><span className="tree-view-label">Item A</span></a></li>
            <li><a href="#"><span className="tree-view-label">Item B</span></a></li>
          </ul>
        </Branch>
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
      <li>
        <a href="#" onClick={(e) => e.preventDefault()}>
          <span className="tree-view-label">{args.rootLabel}</span>
        </a>
      </li>
      <li>
        {args.chapterOne}
        <ul>
          <li>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <span className="tree-view-label">{args.sectionOne}</span>
            </a>
          </li>
          <li>
            <TreeBranch
              defaultOpen={args.openDetails}
              label={
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <span className="tree-view-label">{args.sectionTwo}</span>
                </a>
              }
            >
              <ul>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    <span className="tree-view-label">{args.itemA}</span>
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    <span className="tree-view-label">{args.itemB}</span>
                  </a>
                </li>
              </ul>
            </TreeBranch>
          </li>
        </ul>
      </li>
      <li>
        <a href="#" onClick={(e) => e.preventDefault()}>
          <span className="tree-view-label">{args.chapterTwo}</span>
        </a>
      </li>
    </TreeView>
  ),
} satisfies Meta<TreeStoryArgs>;

export default meta;
type Story = StoryObj<TreeStoryArgs>;

export const Nested: Story = {};
