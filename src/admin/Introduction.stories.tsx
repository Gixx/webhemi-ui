import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin/Introduction',
  parameters: { globals: { theme: 'admin' } },
} satisfies Meta;

export default meta;

export const Tokens: StoryObj = {
  render: () => (
    <div className="wh-ui space-y-4 p-4">
      <h1 className="font-[family-name:var(--wh-font-display)] text-4xl">WebHemi Admin Theme</h1>
      <p className="max-w-xl text-[var(--wh-color-muted)]">
        Fixed CMS control-panel UI. Every installation gets this Admin Theme; frontend themes under{' '}
        <code>Themes/*</code> are swappable for site visitors.
      </p>
      <div className="flex flex-wrap gap-3">
        {[
          ['Ink', 'var(--wh-color-ink)'],
          ['Canvas', 'var(--wh-color-canvas)'],
          ['Accent', 'var(--wh-color-accent)'],
          ['Hot', 'var(--wh-color-accent-hot)'],
        ].map(([label, color]) => (
          <div key={label} className="w-28">
            <div className="h-16 rounded-[var(--wh-radius-md)] border" style={{ background: color }} />
            <p className="mt-1 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
