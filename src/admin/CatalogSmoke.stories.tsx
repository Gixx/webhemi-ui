import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/**
 * Phase 1 smoke: representative chrome markup from admin98 catalog.html.
 * Full atom coverage lands in Phase 2 React stories.
 */
const meta = {
  title: 'Admin/Foundations/CatalogSmoke',
  parameters: {
    layout: 'fullscreen',
    globals: { theme: 'admin' },
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
          <button type="button">OK</button>
          <button type="button" className="default">
            OK
          </button>
          <button type="button" disabled>
            OK
          </button>
          <input type="submit" value="Submit" />
        </div>
      </Sample>

      <Sample label="Window + title controls">
        <div className="window" style={{ width: 320 }}>
          <div className="title-bar">
            <div className="title-bar-text">Catalog Smoke</div>
            <div className="title-bar-controls">
              <button type="button" aria-label="Minimize" />
              <button type="button" aria-label="Maximize" />
              <button type="button" aria-label="Close" />
            </div>
          </div>
          <div className="window-body">
            <p style={{ margin: 0 }}>Owned Win98 chrome under data-wh-theme=&quot;admin&quot;.</p>
          </div>
          <div className="status-bar">
            <p className="status-bar-field" style={{ margin: 0, width: '100%' }}>
              Phase 1
            </p>
          </div>
        </div>
      </Sample>

      <Sample label="Field row + text + checkbox (adjacency)">
        <div className="window" style={{ width: 360 }}>
          <div className="title-bar">
            <div className="title-bar-text">Form</div>
          </div>
          <div className="window-body">
            <div className="field-row">
              <label htmlFor="smoke-user">User name:</label>
              <input id="smoke-user" type="text" defaultValue="admin" style={{ width: 160 }} />
            </div>
            <div className="field-row">
              <input id="smoke-remember" type="checkbox" defaultChecked />
              <label htmlFor="smoke-remember">Remember me</label>
            </div>
            <fieldset>
              <legend>Group</legend>
              <div className="field-row">
                <input id="smoke-a" type="radio" name="smoke-g" defaultChecked />
                <label htmlFor="smoke-a">Option A</label>
              </div>
              <div className="field-row">
                <input id="smoke-b" type="radio" name="smoke-g" />
                <label htmlFor="smoke-b">Option B</label>
              </div>
            </fieldset>
          </div>
        </div>
      </Sample>

      <Sample label="Tabs">
        <div style={{ width: 360 }}>
          <menu role="tablist">
            <li role="tab" aria-selected="true">
              <a href="#smoke-tab-1">General</a>
            </li>
            <li role="tab">
              <a href="#smoke-tab-2">Advanced</a>
            </li>
          </menu>
          <div className="window" role="tabpanel" id="smoke-tab-1">
            <div className="window-body">Selected tab panel (.window[role=tabpanel]).</div>
          </div>
        </div>
      </Sample>

      <Sample label="Sunken panel + table">
        <div className="sunken-panel" style={{ width: 360, height: 120, overflow: 'auto' }}>
          <table className="interactive">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlighted">
                <td>Sites</td>
                <td>Folder</td>
              </tr>
              <tr>
                <td>Hosts</td>
                <td>Folder</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Sample>
    </div>
  ),
};
