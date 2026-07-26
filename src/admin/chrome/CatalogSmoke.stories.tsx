import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import {
  Button,
  Checkbox,
  FieldRow,
  GroupBox,
  Radio,
  StatusBar,
  StatusBarField,
  SunkenPanel,
  Tab,
  Table,
  TableRow,
  TabList,
  TabPanel,
  TextBox,
  TitleBar,
  TitleBarControl,
  TitleBarControls,
  TitleBarText,
  Window,
  WindowBody,
} from './index';

/**
 * Catalog parity smoke built from chrome atoms (replaces raw-HTML CatalogSmoke).
 */
const meta = {
  title: 'Admin/Foundations/CatalogSmoke',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 6, color: '#fff', fontSize: 12 }}>{label}</div>
      {children}
    </div>
  );
}

export const ChromeSamples: Story = {
  render: () => (
    <div style={{ padding: 24, minHeight: '100vh', overflow: 'auto' }}>
      <Sample label="Buttons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button>OK</Button>
          <Button isDefault>OK</Button>
          <Button disabled>OK</Button>
          <Button type="submit">Submit</Button>
        </div>
      </Sample>

      <Sample label="Window + title controls">
        <Window style={{ width: 320 }}>
          <TitleBar>
            <TitleBarText>Catalog Smoke</TitleBarText>
            <TitleBarControls>
              <TitleBarControl action="Minimize" />
              <TitleBarControl action="Maximize" />
              <TitleBarControl action="Close" />
            </TitleBarControls>
          </TitleBar>
          <WindowBody>
            <p style={{ margin: 0 }}>Chrome atoms under data-wh-theme=&quot;admin&quot;.</p>
          </WindowBody>
          <StatusBar>
            <StatusBarField style={{ margin: 0, width: '100%' }}>Phase 2</StatusBarField>
          </StatusBar>
        </Window>
      </Sample>

      <Sample label="Field row + text + checkbox (adjacency)">
        <Window style={{ width: 360 }}>
          <TitleBar>
            <TitleBarText>Form</TitleBarText>
          </TitleBar>
          <WindowBody>
            <FieldRow>
              <label htmlFor="smoke-user">User name:</label>
              <TextBox id="smoke-user" defaultValue="admin" className="w-window-xs" />
            </FieldRow>
            <FieldRow>
              <Checkbox id="smoke-remember" label="Remember me" defaultChecked />
            </FieldRow>
            <GroupBox legend="Group">
              <FieldRow>
                <Radio id="smoke-a" name="smoke-g" label="Option A" defaultChecked />
              </FieldRow>
              <FieldRow>
                <Radio id="smoke-b" name="smoke-g" label="Option B" />
              </FieldRow>
            </GroupBox>
          </WindowBody>
        </Window>
      </Sample>

      <Sample label="Tabs">
        <div style={{ width: 360 }}>
          <TabList>
            <Tab selected href="#smoke-tab-1">
              General
            </Tab>
            <Tab href="#smoke-tab-2">Advanced</Tab>
          </TabList>
          <TabPanel id="smoke-tab-1">
            <WindowBody>Selected tab panel (TabPanel).</WindowBody>
          </TabPanel>
        </div>
      </Sample>

      <Sample label="Sunken panel + table">
        <SunkenPanel style={{ width: 360, height: 120, overflow: 'auto' }}>
          <Table interactive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <TableRow highlighted>
                <td>Sites</td>
                <td>Folder</td>
              </TableRow>
              <TableRow>
                <td>Hosts</td>
                <td>Folder</td>
              </TableRow>
            </tbody>
          </Table>
        </SunkenPanel>
      </Sample>
    </div>
  ),
};
