import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteHeader } from './components/SiteHeader/SiteHeader';
import { Hero } from './components/Hero/Hero';
import { Button } from '../../shared/components/Button/Button';

const meta = {
  title: 'Themes/Default/Introduction',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    globals: { theme: 'default' },
  },
} satisfies Meta;

export default meta;

export const Overview: StoryObj = {
  render: () => (
    <div className="wh-ui min-h-screen bg-[var(--wh-color-canvas)]">
      <SiteHeader
        siteName="WebHemi"
        navItems={[
          { label: 'Home', href: '#home', active: true },
          { label: 'Blog', href: '#blog' },
          { label: 'About', href: '#about' },
        ]}
      />
      <Hero
        title="A dual-engine CMS with swappable frontends"
        subtitle="This Default theme is what site visitors see. Swap it for another theme without touching the Admin Theme."
        actions={
          <>
            <Button>Get started</Button>
            <Button variant="secondary">Read the docs</Button>
          </>
        }
      />
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-12">
        <h2 className="font-[family-name:var(--wh-font-display)] text-3xl">Theme tokens</h2>
        <p className="max-w-xl text-[var(--wh-color-muted)]">
          Frontend themes own their own token files under <code>themes/&lt;name&gt;/styles/</code>.
          Use the Storybook toolbar to switch between Admin and Default.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            ['Ink', 'var(--wh-color-ink)'],
            ['Canvas', 'var(--wh-color-canvas)'],
            ['Accent', 'var(--wh-color-accent)'],
            ['Hot', 'var(--wh-color-accent-hot)'],
          ].map(([label, color]) => (
            <div key={label} className="w-28">
              <div
                className="h-16 rounded-[var(--wh-radius-md)] border border-[var(--wh-color-line)]"
                style={{ background: color }}
              />
              <p className="mt-1 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
