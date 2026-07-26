import { Fragment, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { promoteTabRow } from './promoteTabRow';
import { Tab, TabList, TabPanel, TabRow } from './Tabs';
import { WindowBody } from './Window';

const DEFAULT_BASIC_TABS: string[][] = [
  ['General', 'Desktop', 'Screen Saver', 'Appearance', 'Settings'],
];

const DEFAULT_MULTIROW_TABS: string[][] = [
  ['Desktop', 'My computer', 'Control panel', 'Devices', 'Hardware'],
  ['Performance', 'Network', 'Programs', 'Services', 'Resources'],
  ['Users', 'Advanced', 'Other'],
];

const meta = {
  title: 'Admin/Atoms/Tabs',
  component: TabList,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TabList>;

export default meta;

type TabsMatrixArgs = {
  /**
   * Rows of tab labels (`string[][]`).
   * Last row sits on the tab panel; selecting a tab in another row promotes that row (Win32).
   */
  tabs: string[][];
  width: number;
  /** Index within the **last** row only. */
  selectedIndex: number;
  panelText: string;
};

function normalizeRows(tabs: string[][] | undefined, fallback: string[][]): string[][] {
  const rows = (tabs?.length ? tabs : fallback)
    .map((row) =>
      (Array.isArray(row) ? row : [row]).map((label) => String(label).trim()).filter(Boolean),
    )
    .filter((row) => row.length > 0);
  return rows.length > 0 ? rows : fallback.map((row) => [...row]);
}

function TabsMatrix({
  tabs: tabsArg,
  width,
  selectedIndex,
  panelText,
  fallback,
}: TabsMatrixArgs & { fallback: string[][] }) {
  const normalized = normalizeRows(tabsArg, fallback);
  const [rows, setRows] = useState(normalized);
  const lastRow = rows[rows.length - 1] ?? [];
  const clampedArg = Math.min(
    Math.max(0, lastRow.length - 1),
    Math.max(0, Number(selectedIndex) || 0),
  );
  const [selected, setSelected] = useState(clampedArg);

  useEffect(() => {
    const next = normalizeRows(tabsArg, fallback);
    setRows(next);
    const last = next[next.length - 1] ?? [];
    setSelected(Math.min(Math.max(0, last.length - 1), Math.max(0, Number(selectedIndex) || 0)));
  }, [tabsArg, selectedIndex, fallback]);

  const selectAt = (rowIndex: number, columnIndex: number) => {
    const promoted = promoteTabRow(rows, rowIndex, columnIndex);
    setRows(promoted.rows);
    setSelected(promoted.selectedIndex);
  };

  const activeLabel = lastRow[selected] ?? '';
  const multirows = rows.length > 1;

  return (
    <div style={{ width }}>
      <TabList multirows={multirows}>
        {rows.map((row, rowIndex) => {
          const tabs = row.map((label, columnIndex) => {
            const isLastRow = rowIndex === rows.length - 1;
            const isSelected = isLastRow && columnIndex === selected;
            return (
              <Tab
                key={`${label}-${columnIndex}`}
                selected={isSelected}
                href={`#r${rowIndex}-c${columnIndex}`}
                onClick={() => selectAt(rowIndex, columnIndex)}
              >
                {label}
              </Tab>
            );
          });

          // One row: flat TabList (classic single-row strip). Multiple: TabRow groups.
          return multirows ? (
            <TabRow key={row.join('\0')}>{tabs}</TabRow>
          ) : (
            <Fragment key={row.join('\0')}>{tabs}</Fragment>
          );
        })}
      </TabList>
      <TabPanel>
        <WindowBody>
          [{selected}/{Math.max(0, lastRow.length - 1)}] {activeLabel} — {panelText}
        </WindowBody>
      </TabPanel>
    </div>
  );
}

const matrixArgTypes = {
  tabs: {
    control: 'object' as const,
    description: 'string[][] — each inner array is one tab row.',
  },
  width: { control: { type: 'number' as const, min: 280, max: 640 } },
  selectedIndex: {
    control: { type: 'number' as const, min: 0, step: 1 },
    description: 'Selection index within the last row only.',
  },
  panelText: { control: 'text' as const },
};

export const Basic: StoryObj<TabsMatrixArgs> = {
  args: {
    tabs: DEFAULT_BASIC_TABS.map((row) => [...row]),
    width: 480,
    selectedIndex: 0,
    panelText: 'Single-row strip via string[][] (one inner array).',
  },
  argTypes: matrixArgTypes,
  render: (args) => <TabsMatrix {...args} fallback={DEFAULT_BASIC_TABS} />,
};

export const Multirows: StoryObj<TabsMatrixArgs> = {
  args: {
    tabs: DEFAULT_MULTIROW_TABS.map((row) => [...row]),
    width: 420,
    selectedIndex: 0,
    panelText: 'Last row meets the panel; other rows keep internal order.',
  },
  argTypes: matrixArgTypes,
  render: (args) => <TabsMatrix {...args} fallback={DEFAULT_MULTIROW_TABS} />,
};
